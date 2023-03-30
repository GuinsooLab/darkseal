#  Copyright 2022 Collate
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
Test Snowflake connector with CLI
"""
from typing import List

from metadata.ingestion.api.sink import SinkStatus
from metadata.ingestion.api.source import SourceStatus

from .test_cli_db_base_common import CliCommonDB


class SnowflakeCliTest(CliCommonDB.TestSuite):
    """
    Snowflake CLI Tests
    """

    create_table_query: str = """
        CREATE TABLE E2E_DB.e2e_test.persons (
            person_id int,
            full_name varchar(255)
        )
    """

    create_view_query: str = """
        CREATE VIEW E2E_DB.e2e_test.view_persons AS
            SELECT person_id, full_name
            FROM e2e_test.persons;
    """

    insert_data_queries: List[str] = [
        "INSERT INTO E2E_DB.e2e_test.persons (person_id, full_name) VALUES (1,'Peter Parker');",
        "INSERT INTO E2E_DB.e2e_test.persons (person_id, full_name) VALUES (1, 'Clark Kent');",
    ]

    drop_table_query: str = """
        DROP TABLE IF EXISTS E2E_DB.e2e_test.persons;
    """

    drop_view_query: str = """
        DROP VIEW IF EXISTS E2E_DB.e2e_test.view_persons;
    """

    @staticmethod
    def get_connector_name() -> str:
        return "snowflake"

    def assert_for_vanilla_ingestion(
        self, source_status: SourceStatus, sink_status: SinkStatus
    ) -> None:
        self.assertTrue(len(source_status.failures) == 0)
        self.assertTrue(len(source_status.warnings) == 0)
        self.assertTrue(len(source_status.filtered) == 1)
        self.assertTrue(len(source_status.success) >= self.expected_tables())
        self.assertTrue(len(sink_status.failures) == 0)
        self.assertTrue(len(sink_status.warnings) == 0)
        self.assertTrue(len(sink_status.records) > self.expected_tables())

    def create_table_and_view(self) -> None:
        with self.engine.connect() as connection:
            connection.execute(self.create_table_query)
            for insert_query in self.insert_data_queries:
                connection.execute(insert_query)
            connection.execute(self.create_view_query)
            connection.close()

    def delete_table_and_view(self) -> None:
        with self.engine.connect() as connection:
            connection.execute(self.drop_view_query)
            connection.execute(self.drop_table_query)
            connection.close()

    @staticmethod
    def expected_tables() -> int:
        return 7

    def inserted_rows_count(self) -> int:
        return len(self.insert_data_queries)

    @staticmethod
    def fqn_created_table() -> str:
        return "local_snowflake.E2E_DB.E2E_TEST.PERSONS"

    @staticmethod
    def get_includes_schemas() -> List[str]:
        return ["e2e_test.*"]

    @staticmethod
    def get_includes_tables() -> List[str]:
        return ["^test.*"]

    @staticmethod
    def get_excludes_tables() -> List[str]:
        return [".*ons"]

    @staticmethod
    def expected_filtered_schema_includes() -> int:
        return 2

    @staticmethod
    def expected_filtered_schema_excludes() -> int:
        return 1

    @staticmethod
    def expected_filtered_table_includes() -> int:
        return 5

    @staticmethod
    def expected_filtered_table_excludes() -> int:
        return 4

    @staticmethod
    def expected_filtered_mix() -> int:
        return 6
