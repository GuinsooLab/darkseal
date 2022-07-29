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
Validate workflow configs and filters
"""
import uuid
from copy import deepcopy
from unittest.mock import patch

import sqlalchemy as sqa
from pytest import raises
from sqlalchemy.orm import declarative_base

from metadata.generated.schema.api.tests.createColumnTest import CreateColumnTestRequest
from metadata.generated.schema.api.tests.createTableTest import CreateTableTestRequest
from metadata.generated.schema.entity.data.table import Column, DataType, Table
from metadata.generated.schema.entity.services.connections.metadata.openMetadataConnection import (
    OpenMetadataConnection,
)
from metadata.generated.schema.metadataIngestion.databaseServiceProfilerPipeline import (
    DatabaseServiceProfilerPipeline,
)
from metadata.generated.schema.tests.column.columnValuesToBeBetween import (
    ColumnValuesToBeBetween,
)
from metadata.generated.schema.tests.columnTest import ColumnTestCase, ColumnTestType
from metadata.generated.schema.tests.table.tableRowCountToEqual import (
    TableRowCountToEqual,
)
from metadata.generated.schema.tests.tableTest import TableTestCase, TableTestType
from metadata.generated.schema.type.entityReference import EntityReference
from metadata.orm_profiler.api.workflow import ProfilerWorkflow
from metadata.orm_profiler.processor.orm_profiler import OrmProfilerProcessor
from metadata.orm_profiler.profiler.default import DefaultProfiler
from metadata.orm_profiler.profiler.models import ProfilerDef
from metadata.orm_profiler.validations.models import TestDef, TestSuite

config = {
    "source": {
        "type": "sqlite",
        "serviceName": "my_service",
        "serviceConnection": {"config": {"type": "SQLite"}},
        "sourceConfig": {"config": {"type": "Profiler"}},
    },
    "processor": {"type": "orm-profiler", "config": {}},
    "sink": {"type": "metadata-rest", "config": {}},
    "workflowConfig": {
        "openMetadataServerConfig": {
            "hostPort": "http://localhost:8585/api",
            "authProvider": "no-auth",
        }
    },
}


@patch.object(
    ProfilerWorkflow,
    "_validate_service_name",
    return_value=True,
)
def test_init_workflow(mocked_method):
    """
    We can initialise the workflow from a config
    """
    workflow = ProfilerWorkflow.create(config)
    mocked_method.assert_called()

    assert isinstance(workflow.source_config, DatabaseServiceProfilerPipeline)
    assert isinstance(workflow.metadata_config, OpenMetadataConnection)

    workflow.create_processor(workflow.config.source.serviceConnection.__root__.config)

    assert isinstance(workflow.processor, OrmProfilerProcessor)
    assert workflow.processor.config.profiler is None
    assert workflow.processor.config.test_suite is None


@patch.object(
    ProfilerWorkflow,
    "_validate_service_name",
    return_value=True,
)
def test_filter_entities(mocked_method):
    """
    We can properly filter entities depending on the
    workflow configuration
    """
    workflow = ProfilerWorkflow.create(config)
    mocked_method.assert_called()

    service_name = "service"
    schema_reference1 = EntityReference(
        id=uuid.uuid4(), name="one_schema", type="databaseSchema"
    )
    schema_reference2 = EntityReference(
        id=uuid.uuid4(), name="another_schema", type="databaseSchema"
    )

    all_tables = [
        Table(
            id=uuid.uuid4(),
            name="table1",
            databaseSchema=schema_reference1,
            fullyQualifiedName=f"{service_name}.db.{schema_reference1.name}.table1",
            columns=[Column(name="id", dataType=DataType.BIGINT)],
        ),
        Table(
            id=uuid.uuid4(),
            name="table2",
            databaseSchema=schema_reference1,
            fullyQualifiedName=f"{service_name}.db.{schema_reference1.name}.table2",
            columns=[Column(name="id", dataType=DataType.BIGINT)],
        ),
        Table(
            id=uuid.uuid4(),
            name="table3",
            databaseSchema=schema_reference2,
            fullyQualifiedName=f"{service_name}.db.{schema_reference2.name}.table3",
            columns=[Column(name="id", dataType=DataType.BIGINT)],
        ),
    ]

    # Simple workflow does not filter
    assert len(list(workflow.filter_entities(all_tables))) == 3

    # We can exclude based on the schema name
    exclude_config = deepcopy(config)
    exclude_config["source"]["sourceConfig"]["config"]["fqnFilterPattern"] = {
        "excludes": ["service*"]
    }

    exclude_workflow = ProfilerWorkflow.create(exclude_config)
    mocked_method.assert_called()
    assert len(list(exclude_workflow.filter_entities(all_tables))) == 0

    exclude_config = deepcopy(config)
    exclude_config["source"]["sourceConfig"]["config"]["fqnFilterPattern"] = {
        "excludes": ["service.db.another*"]
    }

    exclude_workflow = ProfilerWorkflow.create(exclude_config)
    mocked_method.assert_called()
    assert len(list(exclude_workflow.filter_entities(all_tables))) == 2

    include_config = deepcopy(config)
    include_config["source"]["sourceConfig"]["config"]["fqnFilterPattern"] = {
        "includes": ["service*"]
    }

    include_workflow = ProfilerWorkflow.create(include_config)
    mocked_method.assert_called()
    assert len(list(include_workflow.filter_entities(all_tables))) == 3


@patch.object(
    ProfilerWorkflow,
    "_validate_service_name",
    return_value=True,
)
def test_profile_def(mocked_method):
    """
    Validate the definitions of the profile in the JSON
    """
    profile_config = deepcopy(config)
    profile_config["processor"]["config"]["profiler"] = {
        "name": "my_profiler",
        "metrics": ["row_count", "min", "COUNT", "null_count"],
    }

    profile_workflow = ProfilerWorkflow.create(profile_config)
    mocked_method.assert_called()
    profile_workflow.create_processor(
        profile_workflow.config.source.serviceConnection.__root__.config
    )

    profile_definition = ProfilerDef(
        name="my_profiler",
        metrics=["ROW_COUNT", "MIN", "COUNT", "NULL_COUNT"],
        time_metrics=None,
        custom_metrics=None,
    )

    assert isinstance(profile_workflow.processor, OrmProfilerProcessor)
    assert profile_workflow.processor.config.profiler == profile_definition


@patch.object(
    ProfilerWorkflow,
    "_validate_service_name",
    return_value=True,
)
def test_default_profile_def(mocked_method):
    """
    If no information is specified for the profiler, let's
    use the SimpleTableProfiler and SimpleProfiler
    """

    profile_workflow = ProfilerWorkflow.create(config)
    mocked_method.assert_called()
    profile_workflow.create_processor(
        profile_workflow.config.source.serviceConnection.__root__.config
    )

    assert isinstance(profile_workflow.processor, OrmProfilerProcessor)
    assert profile_workflow.processor.config.profiler is None

    Base = declarative_base()

    class User(Base):
        __tablename__ = "users"
        id = sqa.Column(sqa.Integer, primary_key=True)
        name = sqa.Column(sqa.String(256))
        fullname = sqa.Column(sqa.String(256))
        nickname = sqa.Column(sqa.String(256))
        age = sqa.Column(sqa.Integer)

    table = Table(
        id=uuid.uuid4(),
        name="users",
        fullyQualifiedName="service.db.users",
        columns=[
            Column(name="id", dataType=DataType.INT),
            Column(name="name", dataType=DataType.STRING),
            Column(name="fullname", dataType=DataType.STRING),
            Column(name="nickname", dataType=DataType.STRING),
            Column(name="age", dataType=DataType.INT),
        ],
        database=EntityReference(id=uuid.uuid4(), name="db", type="database"),
        profileSample=80.0,
    )

    assert isinstance(
        profile_workflow.processor.build_profiler(User, table=table),
        DefaultProfiler,
    )


@patch.object(
    ProfilerWorkflow,
    "_validate_service_name",
    return_value=True,
)
def test_tests_def(mocked_method):
    """
    Validate the test case definition
    """
    test_config = deepcopy(config)
    test_config["processor"]["config"]["test_suite"] = {
        "name": "My Test Suite",
        "tests": [
            {
                "table": "service.db.name",  # FQDN
                "table_tests": [
                    {
                        "testCase": {
                            "config": {
                                "value": 100,
                            },
                            "tableTestType": "tableRowCountToEqual",
                        },
                    },
                ],
                "column_tests": [
                    {
                        "columnName": "age",
                        "testCase": {
                            "config": {
                                "minValue": 0,
                                "maxValue": 99,
                            },
                            "columnTestType": "columnValuesToBeBetween",
                        },
                    }
                ],
            },
        ],
    }

    test_workflow = ProfilerWorkflow.create(test_config)
    mocked_method.assert_called()
    test_workflow.create_processor(
        test_workflow.config.source.serviceConnection.__root__.config
    )

    assert isinstance(test_workflow.processor, OrmProfilerProcessor)
    suite = test_workflow.processor.config.test_suite

    expected = TestSuite(
        name="My Test Suite",
        tests=[
            TestDef(
                table="service.db.name",
                table_tests=[
                    CreateTableTestRequest(
                        testCase=TableTestCase(
                            config=TableRowCountToEqual(value=100),
                            tableTestType=TableTestType.tableRowCountToEqual,
                        ),
                    )
                ],
                column_tests=[
                    CreateColumnTestRequest(
                        columnName="age",
                        testCase=ColumnTestCase(
                            config=ColumnValuesToBeBetween(minValue=0, maxValue=99),
                            columnTestType=ColumnTestType.columnValuesToBeBetween,
                        ),
                    )
                ],
            )
        ],
    )

    assert suite == expected


def test_service_name_validation_raised():
    """Test the service name validation for the profiler
    workflow is raised correctly
    """
    with raises(ValueError, match="Service name `.*` does not exist"):
        ProfilerWorkflow.create(config)
