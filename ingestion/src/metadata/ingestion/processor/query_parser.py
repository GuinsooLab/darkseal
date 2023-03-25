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
Query parser implementation
"""

import datetime
import traceback
from typing import Optional

from metadata.config.common import ConfigModel
from metadata.generated.schema.entity.services.connections.metadata.openMetadataConnection import (
    OpenMetadataConnection,
)
from metadata.generated.schema.type.queryParserData import ParsedData, QueryParserData
from metadata.generated.schema.type.tableQuery import TableQueries, TableQuery
from metadata.ingestion.api.processor import Processor
from metadata.ingestion.lineage.models import ConnectionTypeDialectMapper, Dialect
from metadata.ingestion.lineage.parser import LineageParser
from metadata.utils.logger import ingestion_logger

logger = ingestion_logger()


def parse_sql_statement(record: TableQuery, dialect: Dialect) -> Optional[ParsedData]:
    """
    Use the lineage parser and work with the tokens
    to convert a RAW SQL statement into
    QueryParserData.
    :param record: TableQuery from usage
    :param dialect: dialect used to compute lineage
    :return: QueryParserData
    """

    start_date = record.analysisDate
    if isinstance(record.analysisDate, str):
        start_date = datetime.datetime.strptime(
            str(record.analysisDate), "%Y-%m-%d %H:%M:%S"
        ).date()

    lineage_parser = LineageParser(record.query, dialect=dialect)

    if not lineage_parser.involved_tables:
        return None

    return ParsedData(
        tables=lineage_parser.clean_table_list,
        joins=lineage_parser.table_joins,
        databaseName=record.databaseName,
        databaseSchema=record.databaseSchema,
        sql=record.query,
        userName=record.userName,
        date=int(start_date.__root__.timestamp()),
        serviceName=record.serviceName,
        duration=record.duration,
    )


class QueryParserProcessor(Processor):
    """
    Extension of the `Processor` class

    Args:
        config (QueryParserProcessorConfig):
        metadata_config (MetadataServerConfig):
        connection_type (str):
    """

    config: ConfigModel

    def __init__(
        self,
        config: ConfigModel,
        metadata_config: OpenMetadataConnection,
        connection_type: str,
    ):
        super().__init__()
        self.config = config
        self.metadata_config = metadata_config
        self.connection_type = connection_type

    @classmethod
    def create(
        cls, config_dict: dict, metadata_config: OpenMetadataConnection, **kwargs
    ):
        config = ConfigModel.parse_obj(config_dict)
        connection_type = kwargs.pop("connection_type", "")
        return cls(config, metadata_config, connection_type)

    def process(  # pylint: disable=arguments-differ
        self, queries: TableQueries
    ) -> Optional[QueryParserData]:
        if queries and queries.queries:
            data = []
            for record in queries.queries:
                try:
                    parsed_sql = parse_sql_statement(
                        record,
                        ConnectionTypeDialectMapper.dialect_of(self.connection_type),
                    )
                    if parsed_sql:
                        data.append(parsed_sql)
                except Exception as exc:
                    logger.debug(traceback.format_exc())
                    logger.warning(f"Error processing query [{record.query}]: {exc}")
            return QueryParserData(parsedData=data)

        return None

    def close(self):
        pass
