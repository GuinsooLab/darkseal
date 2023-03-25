#  Copyright 2021 Collate
#  Licensed under the Apache License, Version 2.0 (the "License");
#  you may not use this file except in compliance with the License.
#  You may obtain a copy of the License at
#  http://www.apache.org/licenses/LICENSE-2.0
#  Unless required by applicable law or agreed to in writing, software
#  distributed under the License is distributed on an "AS IS" BASIS,
#  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#  See the License for the specific language governing permissions and
#  limitations under the License.
"""
MSSQL SQLAlchemy Helper Methods
"""
import traceback

from sqlalchemy import sql
from sqlalchemy import types as sqltypes
from sqlalchemy import util
from sqlalchemy.dialects.mssql import information_schema as ischema
from sqlalchemy.dialects.mssql.base import (
    MSBinary,
    MSChar,
    MSNChar,
    MSNText,
    MSNVarchar,
    MSString,
    MSText,
    MSVarBinary,
    _db_plus_owner,
)
from sqlalchemy.engine import reflection
from sqlalchemy.sql import func
from sqlalchemy.types import NVARCHAR
from sqlalchemy.util import compat

from metadata.ingestion.source.database.mssql.queries import (
    MSSQL_ALL_VIEW_DEFINITIONS,
    MSSQL_GET_COLUMN_COMMENTS,
    MSSQL_GET_TABLE_COMMENTS,
)
from metadata.utils.logger import ingestion_logger
from metadata.utils.sqlalchemy_utils import (
    get_display_datatype,
    get_table_comment_wrapper,
    get_view_definition_wrapper,
)

logger = ingestion_logger()


@reflection.cache
def get_table_comment(
    self, connection, table_name, schema=None, **kw
):  # pylint: disable=unused-argument
    return get_table_comment_wrapper(
        self,
        connection,
        table_name=table_name,
        schema=schema,
        query=MSSQL_GET_TABLE_COMMENTS,
    )


@reflection.cache
@_db_plus_owner
def get_columns(
    self, connection, tablename, dbname, owner, schema, **kw
):  # pylint: disable=unused-argument, too-many-locals, disable=too-many-branches, too-many-statements
    """
    This function overrides to add support for column comments
    """
    is_temp_table = tablename.startswith("#")
    if is_temp_table:
        (
            owner,
            tablename,
        ) = self._get_internal_temp_table_name(  # pylint: disable=protected-access
            connection, tablename
        )

        columns = ischema.mssql_temp_table_columns
    else:
        columns = ischema.columns

    computed_cols = ischema.computed_columns
    identity_cols = ischema.identity_columns
    if owner:
        whereclause = sql.and_(
            columns.c.table_name == tablename,
            columns.c.table_schema == owner,
        )
        full_name = columns.c.table_schema + "." + columns.c.table_name
    else:
        whereclause = columns.c.table_name == tablename
        full_name = columns.c.table_name

    join = columns.join(
        computed_cols,
        onclause=sql.and_(
            computed_cols.c.object_id == func.object_id(full_name),
            computed_cols.c.name == columns.c.column_name.collate("DATABASE_DEFAULT"),
        ),
        isouter=True,
    ).join(
        identity_cols,
        onclause=sql.and_(
            identity_cols.c.object_id == func.object_id(full_name),
            identity_cols.c.name == columns.c.column_name.collate("DATABASE_DEFAULT"),
        ),
        isouter=True,
    )

    if self._supports_nvarchar_max:  # pylint: disable=protected-access
        computed_definition = computed_cols.c.definition
    else:
        # tds_version 4.2 does not support NVARCHAR(MAX)
        computed_definition = sql.cast(computed_cols.c.definition, NVARCHAR(4000))

    s = (  # pylint: disable=invalid-name
        sql.select(
            columns,
            computed_definition,
            computed_cols.c.is_persisted,
            identity_cols.c.is_identity,
            identity_cols.c.seed_value,
            identity_cols.c.increment_value,
        )
        .where(whereclause)
        .select_from(join)
        .order_by(columns.c.ordinal_position)
    )

    c = connection.execution_options(  # pylint:disable=invalid-name
        future_result=True
    ).execute(s)

    cols = []
    for row in c.mappings():
        name = row[columns.c.column_name]
        type_ = row[columns.c.data_type]
        nullable = row[columns.c.is_nullable] == "YES"
        charlen = row[columns.c.character_maximum_length]
        numericprec = row[columns.c.numeric_precision]
        numericscale = row[columns.c.numeric_scale]
        default = row[columns.c.column_default]
        collation = row[columns.c.collation_name]
        definition = row[computed_definition]
        is_persisted = row[computed_cols.c.is_persisted]
        is_identity = row[identity_cols.c.is_identity]
        identity_start = row[identity_cols.c.seed_value]
        identity_increment = row[identity_cols.c.increment_value]

        coltype = self.ischema_names.get(type_, None)
        comment = None
        kwargs = {}
        if coltype in (
            MSString,
            MSChar,
            MSNVarchar,
            MSNChar,
            MSText,
            MSNText,
            MSBinary,
            MSVarBinary,
            sqltypes.LargeBinary,
        ):
            if charlen == -1:
                charlen = None
            kwargs["length"] = charlen
            if collation:
                kwargs["collation"] = collation

        precision = None
        scale = None
        if coltype is None:
            util.warn(f"Did not recognize type '{type_}' of column '{name}'")
            coltype = sqltypes.NULLTYPE
        else:
            if issubclass(coltype, sqltypes.Numeric):
                kwargs["precision"] = numericprec
                precision = numericprec

                if not issubclass(coltype, sqltypes.Float):
                    kwargs["scale"] = numericscale
                    scale = numericscale

            coltype = coltype(**kwargs)
        raw_data_type = get_display_datatype(
            type_, char_len=charlen, precision=precision, scale=scale
        )
        cdict = {
            "name": name,
            "type": coltype,
            "system_data_type": raw_data_type,
            "nullable": nullable,
            "default": default,
            "autoincrement": is_identity is not None,
            "comment": comment,
        }

        if definition is not None and is_persisted is not None:
            cdict["computed"] = {
                "sqltext": definition,
                "persisted": is_persisted,
            }

        if is_identity is not None:
            # identity_start and identity_increment are Decimal or None
            if identity_start is None or identity_increment is None:
                cdict["identity"] = {}
            else:
                if isinstance(coltype, sqltypes.BigInteger):
                    start = compat.long_type(identity_start)
                    increment = compat.long_type(identity_increment)
                elif isinstance(coltype, sqltypes.Integer):
                    start = int(identity_start)
                    increment = int(identity_increment)
                else:
                    start = identity_start
                    increment = identity_increment

                cdict["identity"] = {
                    "start": start,
                    "increment": increment,
                }

        cols.append(cdict)
    cursor = connection.execute(
        MSSQL_GET_COLUMN_COMMENTS.format(schema_name=schema, table_name=tablename)
    )
    try:
        for index, result in enumerate(cursor):
            if result[2]:
                cols[index]["comment"] = result[2]
    except Exception:
        logger.debug(traceback.format_exc())
    return cols


@reflection.cache
@_db_plus_owner
def get_view_definition(
    self, connection, viewname, dbname, owner, schema, **kw
):  # pylint: disable=unused-argument
    return get_view_definition_wrapper(
        self,
        connection,
        table_name=viewname,
        schema=owner,
        query=MSSQL_ALL_VIEW_DEFINITIONS,
    )
