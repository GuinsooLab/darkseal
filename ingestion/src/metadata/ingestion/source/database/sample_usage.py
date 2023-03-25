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
Sample Usage source ingestion
"""
import csv
import json
from datetime import datetime
from typing import Dict, Iterable, Optional

from metadata.generated.schema.entity.services.connections.database.customDatabaseConnection import (
    CustomDatabaseConnection,
)
from metadata.generated.schema.entity.services.connections.metadata.openMetadataConnection import (
    OpenMetadataConnection,
)
from metadata.generated.schema.entity.services.databaseService import (
    DatabaseService,
    DatabaseServiceType,
)
from metadata.generated.schema.metadataIngestion.workflow import (
    Source as WorkflowSource,
)
from metadata.generated.schema.type.tableQuery import TableQueries, TableQuery
from metadata.ingestion.api.source import InvalidSourceException
from metadata.ingestion.source.database.usage_source import UsageSource


class SampleUsageSource(UsageSource):
    """
    Loads JSON data and prepares the required
    python objects to be sent to the Sink.
    """

    service_type = DatabaseServiceType.BigQuery.value

    database_field = ""  # filtering not required

    schema_field = ""  # filtering not required

    def __init__(self, config: WorkflowSource, metadata_config: OpenMetadataConnection):
        super().__init__(config, metadata_config, False)
        self.analysis_date = datetime.utcnow()

        sample_data_folder = self.service_connection.connectionOptions.__root__.get(
            "sampleDataFolder"
        )
        if not sample_data_folder:
            raise ValueError("Cannot get sampleDataFolder from connection options")

        self.service_json = json.load(
            open(  # pylint: disable=consider-using-with
                sample_data_folder + "/datasets/service.json",
                "r",
                encoding="utf-8",
            )
        )
        self.query_log_csv = sample_data_folder + "/datasets/query_log"
        with open(self.query_log_csv, "r", encoding="utf-8") as fin:
            self.query_logs = [dict(i) for i in csv.DictReader(fin)]
        self.service = self.metadata.get_service_or_create(
            entity=DatabaseService, config=config
        )

    @classmethod
    def create(cls, config_dict, metadata_config: OpenMetadataConnection):
        """Create class instance"""
        config: WorkflowSource = WorkflowSource.parse_obj(config_dict)
        connection: CustomDatabaseConnection = config.serviceConnection.__root__.config
        if not isinstance(connection, CustomDatabaseConnection):
            raise InvalidSourceException(
                f"Expected SampleDataConnection, but got {connection}"
            )
        return cls(config, metadata_config)

    def get_table_query(self) -> Optional[Iterable[Dict[str, str]]]:
        yield TableQueries(
            queries=[
                TableQuery(
                    query=row["query"],
                    userName="",
                    startTime="",
                    endTime="",
                    analysisDate=self.analysis_date,
                    aborted=False,
                    databaseName="ecommerce_db",
                    serviceName=self.config.serviceName,
                    databaseSchema="shopify",
                )
                for row in self.query_logs
            ]
        )
