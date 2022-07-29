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
Mysql unit test
"""
import json
from unittest import TestCase
from unittest.mock import patch

from pymysql.constants import FIELD_TYPE
from sqlalchemy.types import (
    BIGINT,
    CHAR,
    INTEGER,
    JSON,
    SMALLINT,
    TEXT,
    TIMESTAMP,
    VARCHAR,
    Enum,
)

from metadata.generated.schema.entity.data.table import Column, Table, TableType
from metadata.ingestion.api.workflow import Workflow
from metadata.ingestion.models.ometa_table_db import OMetaDatabaseAndTable

CONFIG = """
{
    "source": {
        "type": "mysql",
        "serviceName": "local_mysql",
        "serviceConnection": {
            "config": {
                "type": "Mysql",
                "username": "openmetadata_user",
                "password": "openmetadata_password",
                "hostPort": "localhost:3306",
                "connectionOptions": {},
                "connectionArguments": {}
            }
        },
        "sourceConfig": {
            "config": {
            "type": "DatabaseMetadata",
                "schemaFilterPattern": {
                    "excludes": [
                        "system.*",
                        "information_schema.*",
                        "INFORMATION_SCHEMA.*"
                    ]
                }
            }
        }
    },
    "sink": {
        "type": "file",
        "config": {
            "filename": "/var/tmp/datasets.json"
        }
    },
    "workflowConfig": {
        "openMetadataServerConfig": {
            "hostPort": "http://localhost:8585/api",
            "authProvider": "no-auth"
        }
    }
}
"""

MOCK_GET_TABLE_NAMES = [
    "DATABASE_CHANGE_LOG",
    "bot_entity",
    "change_event",
    "chart_entity",
    "dashboard_entity",
    "dashboard_service_entity",
    "database_entity",
    "database_schema_entity",
    "dbservice_entity",
    "entity_extension",
    "entity_relationship",
    "entity_usage",
    "field_relationship",
    "glossary_entity",
    "glossary_term_entity",
    "ingestion_pipeline_entity",
    "location_entity",
    "messaging_service_entity",
    "metric_entity",
    "ml_model_entity",
    "pipeline_entity",
    "pipeline_service_entity",
    "policy_entity",
    "report_entity",
    "role_entity",
    "storage_service_entity",
    "table_entity",
    "tag",
    "tag_category",
    "tag_usage",
    "team_entity",
    "thread_entity",
    "topic_entity",
    "user_entity",
    "webhook_entity",
]

GET_TABLE_DESCRIPTIONS = {"text": "Test Description"}
MOCK_GET_SCHEMA_NAMES = ["information_schema", "openmetadata_db"]

MOCK_UNIQUE_CONSTRAINTS = [
    {
        "name": "OBJECT",
        "column_names": ["OBJECT_TYPE", "OBJECT_SCHEMA", "OBJECT_NAME"],
        "duplicates_index": "OBJECT",
    }
]


MOCK_PK_CONSTRAINT = {
    "constrained_columns": ["TRANSACTION_COUNTER"],
    "name": "NOT_NULL",
}


MOCK_GET_COLUMN = [
    {
        "name": "OBJECT_TYPE",
        "type": VARCHAR(length=64),
        "default": None,
        "comment": None,
        "nullable": True,
    },
    {
        "name": "MAXLEN",
        "type": INTEGER,
        "default": None,
        "comment": None,
        "nullable": True,
        "autoincrement": False,
    },
    {
        "name": "ret",
        "type": FIELD_TYPE.INT24,
        "default": "'0'",
        "comment": None,
        "nullable": False,
        "autoincrement": False,
    },
    {
        "name": "type",
        "type": FIELD_TYPE.TINY_BLOB,
        "default": None,
        "comment": None,
        "nullable": False,
    },
    {
        "name": "LOG_TYPE.TEST",
        "type": Enum,
        "default": None,
        "comment": "The log type to which the transactions were written.",
        "nullable": False,
    },
    {
        "name": "TRANSACTION_COUNTER",
        "type": BIGINT,
        "default": None,
        "comment": "Number of transactions written to the log",
        "nullable": False,
        "autoincrement": False,
    },
    {
        "name": "COMPRESSION_PERCENTAGE",
        "type": SMALLINT(),
        "default": None,
        "comment": "The compression ratio as a percentage.",
        "nullable": False,
        "autoincrement": False,
    },
    {
        "name": "FIRST_TRANSACTION_ID",
        "type": TEXT(),
        "default": None,
        "comment": "The first transaction written.",
        "nullable": True,
    },
    {
        "name": "FIRST_TRANSACTION_TIMESTAMP",
        "type": TIMESTAMP(),
        "default": None,
        "comment": "When the first transaction was written.",
        "nullable": True,
    },
    {
        "name": "LAST_TRANSACTION_ID",
        "type": JSON,
        "default": None,
        "comment": "The last transaction written.",
        "nullable": True,
    },
    {
        "name": "LAST_TRANSACTION_COMPRESSED_BYTES",
        "type": BIGINT,
        "default": None,
        "comment": "Last transaction written compressed bytes.",
        "nullable": False,
        "autoincrement": False,
    },
    {
        "name": "Db",
        "type": CHAR(collation="utf8_bin", length=64),
        "default": "''",
        "comment": None,
        "nullable": False,
    },
    {
        "name": "Column_priv",
        "type": FIELD_TYPE.VAR_STRING,
        "default": "''",
        "comment": None,
        "nullable": False,
    },
]


MOCK_GET_VIEW_NAMES = ["ADMINISTRABLE_ROLE_AUTHORIZATIONS", "APPLICABLE_ROLES"]


MOCK_GET_VIEW_DEFINITION = """
CREATE VIEW test_view AS
          SELECT * FROM accounts
          UNION
          SELECT * FROM APPLICABLE_ROLES
"""


def execute_workflow():
    workflow = Workflow.create(json.loads(CONFIG))
    workflow.execute()
    workflow.print_status()
    workflow.stop()


class MySqlIngestionTest(TestCase):
    @patch("sqlalchemy.engine.reflection.Inspector.get_view_definition")
    @patch("sqlalchemy.engine.reflection.Inspector.get_view_names")
    @patch("sqlalchemy.engine.reflection.Inspector.get_table_comment")
    @patch("sqlalchemy.engine.reflection.Inspector.get_table_names")
    @patch("sqlalchemy.engine.reflection.Inspector.get_schema_names")
    @patch("sqlalchemy.engine.reflection.Inspector.get_unique_constraints")
    @patch("sqlalchemy.engine.reflection.Inspector.get_pk_constraint")
    @patch("sqlalchemy.engine.reflection.Inspector.get_columns")
    @patch("sqlalchemy.engine.base.Engine.connect")
    def test_mysql_ingestion(
        self,
        mock_connect,
        get_columns,
        get_pk_constraint,
        get_unique_constraints,
        get_schema_names,
        get_table_names,
        get_table_comment,
        get_view_names,
        get_view_definition,
    ):
        get_schema_names.return_value = MOCK_GET_SCHEMA_NAMES
        get_table_names.return_value = MOCK_GET_TABLE_NAMES
        get_table_comment.return_value = GET_TABLE_DESCRIPTIONS
        get_unique_constraints.return_value = MOCK_UNIQUE_CONSTRAINTS
        get_pk_constraint.return_value = MOCK_PK_CONSTRAINT
        get_columns.return_value = MOCK_GET_COLUMN
        get_view_names.return_value = MOCK_GET_VIEW_NAMES
        get_view_definition.return_value = MOCK_GET_VIEW_DEFINITION

        execute_workflow()

        config = json.loads(CONFIG)
        file_data = open(config["sink"]["config"]["filename"])
        data = json.load(file_data)
        for i in data:
            table = i.get("table")
            _: OMetaDatabaseAndTable = OMetaDatabaseAndTable.parse_obj(i)
            _: Table = Table.parse_obj(table)

            assert table.get("description") == GET_TABLE_DESCRIPTIONS.get("text")

            if table.get("tableType") == TableType.Regular.value:
                assert table.get("name") in MOCK_GET_TABLE_NAMES

            for column in table.get("columns"):
                _: Column = Column.parse_obj(column)
                if column in MOCK_UNIQUE_CONSTRAINTS[0].get("column_names"):
                    assert Column.constraint.UNIQUE == column.get("constraint")
                if column in MOCK_PK_CONSTRAINT.get("constrained_columns"):
                    assert Column.constraint.PRIMARY_KEY == column.get("constraint")
            if table.get("name") in MOCK_GET_VIEW_NAMES:
                assert table.get("tableType") == TableType.View.value
                assert table.get("viewDefinition") == MOCK_GET_VIEW_DEFINITION
