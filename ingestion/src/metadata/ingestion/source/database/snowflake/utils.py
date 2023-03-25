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
Module to define overriden dialect methods
"""

import sqlalchemy.types as sqltypes
from sqlalchemy import exc as sa_exc
from sqlalchemy import util as sa_util
from sqlalchemy.engine import reflection
from sqlalchemy.sql import text
from sqlalchemy.types import FLOAT

from metadata.ingestion.source.database.snowflake.queries import (
    SNOWFLAKE_GET_COMMENTS,
    SNOWFLAKE_GET_SCHEMA_COLUMNS,
    SNOWFLAKE_GET_TABLE_NAMES,
    SNOWFLAKE_GET_VIEW_NAMES,
)
from metadata.utils.sqlalchemy_utils import (
    get_display_datatype,
    get_table_comment_wrapper,
)


def get_table_names(self, connection, schema, **kw):  # pylint: disable=unused-argument
    cursor = connection.execute(SNOWFLAKE_GET_TABLE_NAMES.format(schema))
    result = [self.normalize_name(row[0]) for row in cursor]
    return result


def get_view_names(self, connection, schema, **kw):  # pylint: disable=unused-argument
    cursor = connection.execute(SNOWFLAKE_GET_VIEW_NAMES.format(schema))
    result = [self.normalize_name(row[0]) for row in cursor]
    return result


@reflection.cache
def get_view_definition(  # pylint: disable=unused-argument
    self, connection, view_name, schema=None, **kw
):
    """
    Gets the view definition
    """
    schema = schema or self.default_schema_name
    if schema:
        cursor = connection.execute(
            "SHOW /* sqlalchemy:get_view_definition */ VIEWS "
            f"LIKE '{view_name}' IN {schema}"
        )
    else:
        cursor = connection.execute(
            "SHOW /* sqlalchemy:get_view_definition */ VIEWS " f"LIKE '{view_name}'"
        )
    n2i = self.__class__._map_name_to_idx(cursor)  # pylint: disable=protected-access
    try:
        ret = cursor.fetchone()
        if ret:
            return ret[n2i["text"]]
    except Exception:
        pass
    return None


@reflection.cache
def get_table_comment(
    self, connection, table_name, schema=None, **kw
):  # pylint: disable=unused-argument
    return get_table_comment_wrapper(
        self,
        connection,
        table_name=table_name,
        schema=schema,
        query=SNOWFLAKE_GET_COMMENTS,
    )


@reflection.cache
def get_unique_constraints(  # pylint: disable=unused-argument
    self, connection, table_name, schema=None, **kw
):
    return []


def normalize_names(self, name):  # pylint: disable=unused-argument
    return name


# pylint: disable=too-many-locals,protected-access
@reflection.cache
def get_schema_columns(self, connection, schema, **kw):
    """Get all columns in the schema, if we hit 'Information schema query returned too much data' problem return
    None, as it is cacheable and is an unexpected return type for this function"""
    ans = {}
    current_database, _ = self._current_database_schema(connection, **kw)
    full_schema_name = self._denormalize_quote_join(current_database, schema)
    try:
        schema_primary_keys = self._get_schema_primary_keys(
            connection, full_schema_name, **kw
        )
        result = connection.execute(
            text(SNOWFLAKE_GET_SCHEMA_COLUMNS),
            {"table_schema": self.denormalize_name(schema)},
        )
    except sa_exc.ProgrammingError as p_err:
        if p_err.orig.errno == 90030:
            # This means that there are too many tables in the schema, we need to go more granular
            return None  # None triggers _get_table_columns while staying cacheable
        raise
    for (
        table_name,
        column_name,
        coltype,
        character_maximum_length,
        numeric_precision,
        numeric_scale,
        is_nullable,
        column_default,
        is_identity,
        comment,
        identity_start,
        identity_increment,
    ) in result:
        table_name = self.normalize_name(table_name)
        column_name = self.normalize_name(column_name)
        if table_name not in ans:
            ans[table_name] = []
        if column_name.startswith("sys_clustering_column"):
            continue  # ignoring clustering column
        col_type = self.ischema_names.get(coltype, None)
        col_type_kw = {}
        if col_type is None:
            sa_util.warn(
                f"Did not recognize type '{coltype}' of column '{column_name}'"
            )
            col_type = sqltypes.NULLTYPE
        else:
            if issubclass(col_type, FLOAT):
                col_type_kw["precision"] = numeric_precision
                col_type_kw["decimal_return_scale"] = numeric_scale
            elif issubclass(col_type, sqltypes.Numeric):
                col_type_kw["precision"] = numeric_precision
                col_type_kw["scale"] = numeric_scale
            elif issubclass(col_type, (sqltypes.String, sqltypes.BINARY)):
                col_type_kw["length"] = character_maximum_length

        type_instance = col_type(**col_type_kw)

        current_table_pks = schema_primary_keys.get(table_name)

        ans[table_name].append(
            {
                "name": column_name,
                "type": type_instance,
                "nullable": is_nullable == "YES",
                "default": column_default,
                "autoincrement": is_identity == "YES",
                "system_data_type": get_display_datatype(
                    coltype,
                    char_len=character_maximum_length,
                    precision=numeric_precision,
                    scale=numeric_scale,
                ),
                "comment": comment,
                "primary_key": (
                    column_name
                    in schema_primary_keys[table_name]["constrained_columns"]
                )
                if current_table_pks
                else False,
            }
        )
        if is_identity == "YES":
            ans[table_name][-1]["identity"] = {
                "start": identity_start,
                "increment": identity_increment,
            }
    return ans
