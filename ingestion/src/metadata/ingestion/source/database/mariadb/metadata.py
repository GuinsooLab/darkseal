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
MariaDB source module
"""
from sqlalchemy.dialects.mysql.base import ischema_names
from sqlalchemy.dialects.mysql.reflection import MySQLTableDefinitionParser

from metadata.generated.schema.entity.services.connections.database.mariaDBConnection import (
    MariaDBConnection,
)
from metadata.generated.schema.entity.services.connections.metadata.openMetadataConnection import (
    OpenMetadataConnection,
)
from metadata.generated.schema.metadataIngestion.workflow import (
    Source as WorkflowSource,
)
from metadata.ingestion.api.source import InvalidSourceException
from metadata.ingestion.source.database.common_db_source import CommonDbSourceService
from metadata.ingestion.source.database.mysql.utils import col_type_map, parse_column

ischema_names.update(col_type_map)


MySQLTableDefinitionParser._parse_column = (  # pylint: disable=protected-access
    parse_column
)


class MariadbSource(CommonDbSourceService):
    """
    Implements the necessary methods to extract
    Database metadata from Hive Source
    """

    @classmethod
    def create(cls, config_dict, metadata_config: OpenMetadataConnection):
        config: WorkflowSource = WorkflowSource.parse_obj(config_dict)
        connection: MariaDBConnection = config.serviceConnection.__root__.config
        if not isinstance(connection, MariaDBConnection):
            raise InvalidSourceException(
                f"Expected MariaDBConnection, but got {connection}"
            )
        return cls(config, metadata_config)