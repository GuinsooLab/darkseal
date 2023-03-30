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
Generic source to build SQL connectors.
"""
import traceback
from abc import ABC
from copy import deepcopy
from typing import Iterable, Optional, Tuple

from pydantic import BaseModel
from sqlalchemy.engine import Connection
from sqlalchemy.engine.base import Engine
from sqlalchemy.engine.reflection import Inspector
from sqlalchemy.inspection import inspect

from metadata.generated.schema.api.data.createDatabase import CreateDatabaseRequest
from metadata.generated.schema.api.data.createDatabaseSchema import (
    CreateDatabaseSchemaRequest,
)
from metadata.generated.schema.api.data.createTable import CreateTableRequest
from metadata.generated.schema.api.lineage.addLineage import AddLineageRequest
from metadata.generated.schema.entity.data.table import Table, TablePartition, TableType
from metadata.generated.schema.entity.services.connections.metadata.openMetadataConnection import (
    OpenMetadataConnection,
)
from metadata.generated.schema.metadataIngestion.databaseServiceMetadataPipeline import (
    DatabaseServiceMetadataPipeline,
)
from metadata.generated.schema.metadataIngestion.workflow import (
    Source as WorkflowSource,
)
from metadata.generated.schema.type.entityReference import EntityReference
from metadata.ingestion.lineage.models import ConnectionTypeDialectMapper
from metadata.ingestion.lineage.parser import LineageParser
from metadata.ingestion.lineage.sql_lineage import (
    get_lineage_by_query,
    get_lineage_via_table_entity,
)
from metadata.ingestion.models.ometa_classification import OMetaTagAndClassification
from metadata.ingestion.ometa.ometa_api import OpenMetadata
from metadata.ingestion.source.connections import get_connection, get_test_connection_fn
from metadata.ingestion.source.database.database_service import (
    DatabaseServiceSource,
    SQLSourceStatus,
)
from metadata.ingestion.source.database.sql_column_handler import SqlColumnHandlerMixin
from metadata.ingestion.source.database.sqlalchemy_source import SqlAlchemySource
from metadata.ingestion.source.models import TableView
from metadata.utils import fqn
from metadata.utils.filters import filter_by_table
from metadata.utils.helpers import calculate_execution_time_generator
from metadata.utils.logger import ingestion_logger

logger = ingestion_logger()


class TableNameAndType(BaseModel):
    """
    Helper model for passing down
    names and types of tables
    """

    name: str
    type_: TableType = TableType.Regular


# pylint: disable=too-many-public-methods
class CommonDbSourceService(
    DatabaseServiceSource, SqlColumnHandlerMixin, SqlAlchemySource, ABC
):
    """
    - fetch_column_tags implemented at SqlColumnHandler. Sources should override this when needed
    """

    def __init__(
        self,
        config: WorkflowSource,
        metadata_config: OpenMetadataConnection,
    ):
        self.config = config
        self.source_config: DatabaseServiceMetadataPipeline = (
            self.config.sourceConfig.config
        )

        self.metadata_config = metadata_config
        self.metadata = OpenMetadata(self.metadata_config)

        # It will be one of the Unions. We don't know the specific type here.
        self.service_connection = self.config.serviceConnection.__root__.config
        self.status = SQLSourceStatus()

        self.engine: Engine = get_connection(self.service_connection)
        self.test_connection()

        self._connection = None  # Lazy init as well
        self.table_constraints = None
        self.database_source_state = set()
        self.context.table_views = []
        super().__init__()

    def set_inspector(self, database_name: str) -> None:
        """
        When sources override `get_database_names`, they will need
        to setup multiple inspectors. They can use this function.
        :param database_name: new database to set
        """
        logger.info(f"Ingesting from database: {database_name}")

        new_service_connection = deepcopy(self.service_connection)
        new_service_connection.database = database_name
        self.engine = get_connection(new_service_connection)
        self.inspector = inspect(self.engine)
        self._connection = None  # Lazy init as well

    def get_database_names(self) -> Iterable[str]:
        """
        Default case with a single database.

        It might come informed - or not - from the source.

        Sources with multiple databases should overwrite this and
        apply the necessary filters.
        """
        custom_database_name = self.service_connection.__dict__.get("databaseName")

        database_name = self.service_connection.__dict__.get(
            "database", custom_database_name or "default"
        )
        # By default, set the inspector on the created engine
        self.inspector = inspect(self.engine)
        yield database_name

    def yield_database(self, database_name: str) -> Iterable[CreateDatabaseRequest]:
        """
        From topology.
        Prepare a database request and pass it to the sink
        """

        yield CreateDatabaseRequest(
            name=database_name,
            service=EntityReference(
                id=self.context.database_service.id,
                type="databaseService",
            ),
        )

    def get_raw_database_schema_names(self) -> Iterable[str]:
        if self.service_connection.__dict__.get("databaseSchema"):
            yield self.service_connection.databaseSchema
        else:
            for schema_name in self.inspector.get_schema_names():
                yield schema_name

    def get_database_schema_names(self) -> Iterable[str]:
        """
        return schema names
        """
        yield from self._get_filtered_schema_names()

    def yield_database_schema(
        self, schema_name: str
    ) -> Iterable[CreateDatabaseSchemaRequest]:
        """
        From topology.
        Prepare a database schema request and pass it to the sink
        """

        yield CreateDatabaseSchemaRequest(
            name=schema_name,
            database=EntityReference(id=self.context.database.id, type="database"),
        )

    @staticmethod
    def get_table_description(
        schema_name: str, table_name: str, inspector: Inspector
    ) -> str:
        description = None
        try:
            table_info: dict = inspector.get_table_comment(table_name, schema_name)
        # Catch any exception without breaking the ingestion
        except Exception as exc:  # pylint: disable=broad-except
            logger.debug(traceback.format_exc())
            logger.warning(
                f"Table description error for table [{schema_name}.{table_name}]: {exc}"
            )
        else:
            description = table_info.get("text")
        return description

    def query_table_names_and_types(
        self, schema_name: str
    ) -> Iterable[TableNameAndType]:
        """
        Connect to the source database to get the table
        name and type. By default, use the inspector method
        to get the names and pass the Regular type.

        This is useful for sources where we need fine-grained
        logic on how to handle table types, e.g., external, foreign,...
        """

        return [
            TableNameAndType(name=table_name)
            for table_name in self.inspector.get_table_names(schema_name) or []
        ]

    def get_tables_name_and_type(self) -> Optional[Iterable[Tuple[str, str]]]:
        """
        Handle table and views.

        Fetches them up using the context information and
        the inspector set when preparing the db.

        :return: tables or views, depending on config
        """
        try:
            schema_name = self.context.database_schema.name.__root__
            if self.source_config.includeTables:
                for table_and_type in self.query_table_names_and_types(schema_name):
                    table_name = self.standardize_table_name(
                        schema_name, table_and_type.name
                    )
                    table_fqn = fqn.build(
                        self.metadata,
                        entity_type=Table,
                        service_name=self.context.database_service.name.__root__,
                        database_name=self.context.database.name.__root__,
                        schema_name=self.context.database_schema.name.__root__,
                        table_name=table_name,
                        skip_es_search=True,
                    )
                    if filter_by_table(
                        self.source_config.tableFilterPattern,
                        table_fqn
                        if self.source_config.useFqnForFiltering
                        else table_name,
                    ):
                        self.status.filter(
                            table_fqn,
                            "Table Filtered Out",
                        )
                        continue
                    yield table_name, table_and_type.type_

            if self.source_config.includeViews:
                for view_name in self.inspector.get_view_names(schema_name):
                    view_name = self.standardize_table_name(schema_name, view_name)
                    view_fqn = fqn.build(
                        self.metadata,
                        entity_type=Table,
                        service_name=self.context.database_service.name.__root__,
                        database_name=self.context.database.name.__root__,
                        schema_name=self.context.database_schema.name.__root__,
                        table_name=view_name,
                    )

                    if filter_by_table(
                        self.source_config.tableFilterPattern,
                        view_fqn
                        if self.source_config.useFqnForFiltering
                        else view_name,
                    ):
                        self.status.filter(
                            view_fqn,
                            "Table Filtered Out",
                        )
                        continue
                    yield view_name, TableType.View
        except Exception as err:
            logger.warning(
                f"Fetching tables names failed for schema {schema_name} due to - {err}"
            )
            logger.debug(traceback.format_exc())

    def get_view_definition(
        self, table_type: str, table_name: str, schema_name: str, inspector: Inspector
    ) -> Optional[str]:

        if table_type == TableType.View:
            try:
                view_definition = inspector.get_view_definition(table_name, schema_name)
                view_definition = (
                    "" if view_definition is None else str(view_definition)
                )
                return view_definition

            except NotImplementedError:
                logger.warning("View definition not implemented")

            except Exception as exc:
                logger.debug(traceback.format_exc())
                logger.warning(
                    f"Failed to fetch view definition for {table_name}: {exc}"
                )
            return None
        return None

    def is_partition(  # pylint: disable=unused-argument
        self,
        table_name: str,
        schema_name: str,
        inspector: Inspector,
    ) -> bool:
        return False

    def get_table_partition_details(  # pylint: disable=unused-argument
        self,
        table_name: str,
        schema_name: str,
        inspector: Inspector,
    ) -> Tuple[bool, Optional[TablePartition]]:
        """
        check if the table is partitioned table and return the partition details
        """
        return False, None  # By default the table will be a Regular Table

    def yield_tag(self, schema_name: str) -> Iterable[OMetaTagAndClassification]:
        pass

    @calculate_execution_time_generator
    def yield_table(
        self, table_name_and_type: Tuple[str, str]
    ) -> Iterable[Optional[CreateTableRequest]]:
        """
        From topology.
        Prepare a table request and pass it to the sink
        """
        table_name, table_type = table_name_and_type
        schema_name = self.context.database_schema.name.__root__
        db_name = self.context.database.name.__root__
        try:

            columns, table_constraints = self.get_columns_and_constraints(
                schema_name=schema_name,
                table_name=table_name,
                db_name=db_name,
                inspector=self.inspector,
            )

            view_definition = self.get_view_definition(
                table_type=table_type,
                table_name=table_name,
                schema_name=schema_name,
                inspector=self.inspector,
            )

            table_request = CreateTableRequest(
                name=table_name,
                tableType=table_type,
                description=self.get_table_description(
                    schema_name=schema_name,
                    table_name=table_name,
                    inspector=self.inspector,
                ),
                columns=columns,
                viewDefinition=view_definition,
                tableConstraints=table_constraints if table_constraints else None,
                databaseSchema=EntityReference(
                    id=self.context.database_schema.id,
                    type="databaseSchema",
                ),
                tags=self.get_tag_labels(
                    table_name=table_name
                ),  # Pick tags from context info, if any
            )
            is_partitioned, partition_details = self.get_table_partition_details(
                table_name=table_name, schema_name=schema_name, inspector=self.inspector
            )
            if is_partitioned:
                table_request.tableType = TableType.Partitioned.value
                table_request.tablePartition = partition_details

            if table_type == TableType.View or view_definition:
                table_view = TableView.parse_obj(
                    {
                        "table_name": table_name,
                        "schema_name": schema_name,
                        "db_name": db_name,
                        "view_definition": view_definition,
                    }
                )
                self.context.table_views.append(table_view)

            yield table_request
            self.register_record(table_request=table_request)

        except Exception as exc:
            logger.debug(traceback.format_exc())
            logger.warning(f"Unexpected exception to yield table [{table_name}]: {exc}")
            self.status.failures.append(f"{self.config.serviceName}.{table_name}")

    def yield_view_lineage(self) -> Optional[Iterable[AddLineageRequest]]:
        logger.info("Processing Lineage for Views")
        for view in [
            v for v in self.context.table_views if v.view_definition is not None
        ]:
            table_name = view.table_name
            schema_name = view.schema_name
            db_name = view.db_name
            view_definition = view.view_definition
            table_fqn = fqn.build(
                self.metadata,
                entity_type=Table,
                service_name=self.context.database_service.name.__root__,
                database_name=db_name,
                schema_name=schema_name,
                table_name=table_name,
            )
            table_entity = self.metadata.get_by_name(
                entity=Table,
                fqn=table_fqn,
            )

            try:
                connection_type = str(self.service_connection.type.value)
                dialect = ConnectionTypeDialectMapper.dialect_of(connection_type)
                lineage_parser = LineageParser(view_definition, dialect)
                if lineage_parser.source_tables and lineage_parser.target_tables:
                    yield from get_lineage_by_query(
                        self.metadata,
                        query=view_definition,
                        service_name=self.context.database_service.name.__root__,
                        database_name=db_name,
                        schema_name=schema_name,
                        dialect=dialect,
                    ) or []

                else:
                    yield from get_lineage_via_table_entity(
                        self.metadata,
                        table_entity=table_entity,
                        service_name=self.context.database_service.name.__root__,
                        database_name=db_name,
                        schema_name=schema_name,
                        query=view_definition,
                        dialect=dialect,
                    ) or []
            except Exception as exc:
                logger.debug(traceback.format_exc())
                logger.warning(
                    f"Could not parse query [{view_definition}] ingesting lineage failed: {exc}"
                )

    def test_connection(self) -> None:
        """
        Used a timed-bound function to test that the engine
        can properly reach the source
        """
        test_connection_fn = get_test_connection_fn(self.service_connection)
        test_connection_fn(self.engine)

    @property
    def connection(self) -> Connection:
        """
        Return the SQLAlchemy connection
        """
        if not self._connection:
            self._connection = self.engine.connect()

        return self._connection

    def close(self):
        if self.connection is not None:
            self.connection.close()
        self.engine.dispose()

    def fetch_table_tags(
        self,
        table_name: str,
        schema_name: str,
        inspector: Inspector,
    ) -> None:
        """
        Method to fetch tags associated with table
        """

    def standardize_table_name(self, schema_name: str, table: str) -> str:
        """
        This method is interesting to be maintained in case
        some connector, such as BigQuery, needs to perform
        some added logic here.

        Returning `table` is just the default implementation.
        """
        return table

    def yield_table_tag(self) -> Iterable[OMetaTagAndClassification]:
        pass
