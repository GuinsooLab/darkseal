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
"""Db2 source module"""
import traceback

from ibm_db_sa.base import DB2Dialect
from sqlalchemy.engine import reflection
from sqlalchemy.engine.reflection import Inspector
from sqlalchemy.engine.row import LegacyRow

from metadata.generated.schema.entity.services.connections.database.db2Connection import (
    Db2Connection,
)
from metadata.generated.schema.entity.services.connections.metadata.openMetadataConnection import (
    OpenMetadataConnection,
)
from metadata.generated.schema.metadataIngestion.workflow import (
    Source as WorkflowSource,
)
from metadata.ingestion.api.source import InvalidSourceException
from metadata.ingestion.source.database.common_db_source import CommonDbSourceService
from metadata.utils.logger import ingestion_logger

logger = ingestion_logger()


@reflection.cache
def get_pk_constraint(
    self, bind, table_name, schema=None, **kw
):  # pylint: disable=unused-argument
    return {"constrained_columns": [], "name": "undefined"}


DB2Dialect.get_pk_constraint = get_pk_constraint


class Db2Source(CommonDbSourceService):
    """
    Implements the necessary methods to extract
    Database metadata from Db2 Source
    """

    @classmethod
    def create(cls, config_dict, metadata_config: OpenMetadataConnection):
        config: WorkflowSource = WorkflowSource.parse_obj(config_dict)
        connection: Db2Connection = config.serviceConnection.__root__.config
        if not isinstance(connection, Db2Connection):
            raise InvalidSourceException(
                f"Expected Db2Connection, but got {connection}"
            )
        return cls(config, metadata_config)

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
            if table_info.get("text"):
                description = table_info["text"]

                # DB2 connector does not return a str type
                if isinstance(description, LegacyRow):
                    for table_description in description:
                        return table_description

                if isinstance(description, list):
                    description = description[0]
        return description
