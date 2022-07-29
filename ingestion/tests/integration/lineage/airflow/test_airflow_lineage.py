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
Test airflow lineage backend

These tests should be run with Airflow 2.1.4
Other airflow versions require a different way to
mock the DAG and Task runs.
"""

import os
from datetime import datetime, timedelta
from unittest import TestCase, mock

# The DAG object; we'll need this to instantiate a DAG
from airflow import DAG
from airflow.models import TaskInstance
from airflow.operators.bash import BashOperator
from airflow.operators.dummy import DummyOperator
from airflow.utils.task_group import TaskGroup

from airflow_provider_openmetadata.lineage.openmetadata import (
    OpenMetadataLineageBackend,
)
from airflow_provider_openmetadata.lineage.utils import get_xlets
from metadata.generated.schema.api.data.createDatabase import CreateDatabaseRequest
from metadata.generated.schema.api.data.createDatabaseSchema import (
    CreateDatabaseSchemaRequest,
)
from metadata.generated.schema.api.data.createTable import CreateTableRequest
from metadata.generated.schema.api.services.createDatabaseService import (
    CreateDatabaseServiceRequest,
)
from metadata.generated.schema.entity.data.pipeline import Pipeline
from metadata.generated.schema.entity.data.table import Column, DataType
from metadata.generated.schema.entity.services.connections.database.mysqlConnection import (
    MysqlConnection,
)
from metadata.generated.schema.entity.services.connections.metadata.openMetadataConnection import (
    OpenMetadataConnection,
)
from metadata.generated.schema.entity.services.databaseService import (
    DatabaseConnection,
    DatabaseService,
    DatabaseServiceType,
)
from metadata.generated.schema.type.entityReference import EntityReference
from metadata.ingestion.ometa.ometa_api import OpenMetadata


class AirflowLineageTest(TestCase):
    """
    Run this test installing the necessary airflow version
    """

    server_config = OpenMetadataConnection(hostPort="http://localhost:8585/api")
    metadata = OpenMetadata(server_config)

    assert metadata.health_check()

    service = CreateDatabaseServiceRequest(
        name="test-service-table-lineage",
        serviceType=DatabaseServiceType.Mysql,
        connection=DatabaseConnection(
            config=MysqlConnection(
                username="username",
                password="password",
                hostPort="http://localhost:1234",
            )
        ),
    )
    service_type = "databaseService"

    backend = OpenMetadataLineageBackend()

    @classmethod
    def setUpClass(cls) -> None:
        """
        Prepare ingredients: Table Entity + DAG
        """

        service_entity = cls.metadata.create_or_update(data=cls.service)

        create_db = CreateDatabaseRequest(
            name="test-db",
            service=EntityReference(id=service_entity.id, type="databaseService"),
        )

        create_db_entity = cls.metadata.create_or_update(data=create_db)

        db_reference = EntityReference(
            id=create_db_entity.id, name="test-db", type="database"
        )

        create_schema = CreateDatabaseSchemaRequest(
            name="test-schema", database=db_reference
        )

        create_schema_entity = cls.metadata.create_or_update(data=create_schema)

        schema_reference = EntityReference(
            id=create_schema_entity.id, name="test-schema", type="databaseSchema"
        )

        create = CreateTableRequest(
            name="lineage-test",
            databaseSchema=schema_reference,
            columns=[Column(name="id", dataType=DataType.BIGINT)],
        )

        cls.table = cls.metadata.create_or_update(data=create)

        with DAG(
            "lineage",
            description="A lineage test DAG",
            schedule_interval=timedelta(days=1),
            start_date=datetime(2021, 1, 1),
        ) as dag:

            t1 = BashOperator(  # Using BashOperator as a random example
                task_id="task1",
                bash_command="date",
                outlets={
                    "tables": [
                        "test-service-table-lineage.test-db.test-schema.lineage-test"
                    ]
                },
            )

            t2 = BashOperator(  # Using BashOperator as a random example
                task_id="task2",
                bash_command="sleep 5",
                inlets={
                    "tables": [
                        "test-service-table-lineage.test-db.test-schema.lineage-test"
                    ]
                },
            )

            t3 = BashOperator(
                task_id="task3",
                bash_command="echo",
            )

            t1 >> t2 >> t3

            cls.dag = dag

    @classmethod
    def tearDownClass(cls) -> None:
        """
        Clean up
        """

        service_id = str(
            cls.metadata.get_by_name(
                entity=DatabaseService, fqn="test-service-table-lineage"
            ).id.__root__
        )

        cls.metadata.delete(
            entity=DatabaseService,
            entity_id=service_id,
            recursive=True,
            hard_delete=True,
        )

    def test_xlets(self):
        """
        Verify that we can extract inlets and outlets
        """

        self.assertIsNone(get_xlets(self.dag.get_task("task1"), "_inlets"))
        self.assertEqual(
            ["test-service-table-lineage.test-db.test-schema.lineage-test"],
            get_xlets(self.dag.get_task("task1"), "_outlets"),
        )

        self.assertEqual(
            ["test-service-table-lineage.test-db.test-schema.lineage-test"],
            get_xlets(self.dag.get_task("task2"), "_inlets"),
        )
        self.assertIsNone(get_xlets(self.dag.get_task("task2"), "_outlets"))

        self.assertIsNone(get_xlets(self.dag.get_task("task3"), "_inlets"))
        self.assertIsNone(get_xlets(self.dag.get_task("task3"), "_outlets"))

    @mock.patch.dict(
        os.environ,
        {"AIRFLOW__LINEAGE__AIRFLOW_SERVICE_NAME": "int_airflow"},
        clear=True,
    )
    def test_lineage(self):
        """
        Test end to end
        """

        self.backend.send_lineage(
            operator=self.dag.get_task("task1"),
            context={
                "dag": self.dag,
                "task": self.dag.get_task("task1"),
                "task_instance": TaskInstance(
                    task=self.dag.get_task("task1"),
                    execution_date=datetime.strptime(
                        "2022-03-15T08:13:45", "%Y-%m-%dT%H:%M:%S"
                    ),
                    state="running",
                ),
            },
        )

        self.assertIsNotNone(
            self.metadata.get_by_name(entity=Pipeline, fqn="int_airflow.lineage")
        )

        lineage = self.metadata.get_lineage_by_name(
            entity=Pipeline, fqn="int_airflow.lineage"
        )

        nodes = {node["id"] for node in lineage["nodes"]}
        self.assertIn(str(self.table.id.__root__), nodes)

    @mock.patch.dict(
        os.environ,
        {"AIRFLOW__LINEAGE__AIRFLOW_SERVICE_NAME": "int_airflow"},
        clear=True,
    )
    def test_lineage_task_group(self):
        """
        Test end to end for task groups.

        Run the lineage execution mimicking
        the execution of three tasks
        """

        with DAG(
            "task_group_lineage",
            description="A lineage test DAG",
            schedule_interval=timedelta(days=1),
            start_date=datetime(2021, 1, 1),
        ) as dag:
            t0 = DummyOperator(task_id="start")

            # Start Task Group definition
            with TaskGroup(group_id="group1") as tg1:
                t1 = DummyOperator(task_id="task1")
                t2 = DummyOperator(task_id="task2")

                t1 >> t2
            # End Task Group definition

            t3 = DummyOperator(task_id="end")

            # Set Task Group's (tg1) dependencies
            t0 >> tg1 >> t3

            self.backend.send_lineage(
                operator=dag.get_task("group1.task1"),
                context={
                    "dag": dag,
                    "task": dag.get_task("group1.task1"),
                    "task_instance": TaskInstance(
                        task=dag.get_task("group1.task1"),
                        execution_date=datetime.strptime(
                            "2022-03-15T08:13:45", "%Y-%m-%dT%H:%M:%S"
                        ),
                        state="running",
                    ),
                },
            )

            self.backend.send_lineage(
                operator=dag.get_task("group1.task2"),
                context={
                    "dag": dag,
                    "task": dag.get_task("group1.task2"),
                    "task_instance": TaskInstance(
                        task=dag.get_task("group1.task2"),
                        execution_date=datetime.strptime(
                            "2022-03-15T08:13:45", "%Y-%m-%dT%H:%M:%S"
                        ),
                        state="running",
                    ),
                },
            )

            self.backend.send_lineage(
                operator=dag.get_task("end"),
                context={
                    "dag": dag,
                    "task": dag.get_task("end"),
                    "task_instance": TaskInstance(
                        task=dag.get_task("end"),
                        execution_date=datetime.strptime(
                            "2022-03-15T08:13:45", "%Y-%m-%dT%H:%M:%S"
                        ),
                        state="running",
                    ),
                },
            )

        pipeline: Pipeline = self.metadata.get_by_name(
            entity=Pipeline, fqn="int_airflow.task_group_lineage", fields=["tasks"]
        )
        self.assertIsNotNone(pipeline)
        self.assertIn("group1.task1", {task.name for task in pipeline.tasks})
        self.assertIn("group1.task2", {task.name for task in pipeline.tasks})
        self.assertIn("end", {task.name for task in pipeline.tasks})

        # Validate URL building
        self.assertEqual("/tree?dag_id=task_group_lineage", pipeline.pipelineUrl)
        self.assertIn(
            "/taskinstance/list/?flt1_dag_id_equals=task_group_lineage&_flt_3_task_id=end",
            {task.taskUrl for task in pipeline.tasks},
        )

    @mock.patch.dict(
        os.environ,
        {"AIRFLOW__LINEAGE__AIRFLOW_SERVICE_NAME": "int_airflow"},
        clear=True,
    )
    def test_clean_tasks(self):
        """
        Check that we can safely remove tasks from a Pipeline
        """

        with DAG(
            "clean_test",
            description="A lineage test DAG",
            schedule_interval=timedelta(days=1),
            start_date=datetime(2021, 1, 1),
        ) as dag:
            t1 = BashOperator(  # Using BashOperator as a random example
                task_id="task1",
                bash_command="date",
            )

            t2 = BashOperator(  # Using BashOperator as a random example
                task_id="task2",
                bash_command="sleep 5",
            )

            t1 >> t2

            self.backend.send_lineage(
                operator=dag.get_task("task1"),
                context={
                    "dag": dag,
                    "task": dag.get_task("task1"),
                    "task_instance": TaskInstance(
                        task=dag.get_task("task1"),
                        execution_date=datetime.strptime(
                            "2022-03-15T08:13:45", "%Y-%m-%dT%H:%M:%S"
                        ),
                        state="running",
                    ),
                },
            )

            self.backend.send_lineage(
                operator=dag.get_task("task2"),
                context={
                    "dag": dag,
                    "task": dag.get_task("task2"),
                    "task_instance": TaskInstance(
                        task=dag.get_task("task2"),
                        execution_date=datetime.strptime(
                            "2022-03-15T08:13:45", "%Y-%m-%dT%H:%M:%S"
                        ),
                        state="running",
                    ),
                },
            )

        pipeline = self.metadata.get_by_name(
            entity=Pipeline, fqn="int_airflow.clean_test", fields=["tasks"]
        )
        self.assertIsNotNone(pipeline)
        self.assertIn("task1", {task.name for task in pipeline.tasks})
        self.assertIn("task2", {task.name for task in pipeline.tasks})

        with DAG(
            "clean_test",
            description="A lineage test DAG",
            schedule_interval=timedelta(days=1),
            start_date=datetime(2021, 1, 1),
        ) as dag:
            t1 = BashOperator(
                task_id="task1",
                bash_command="date",
            )

            renamed_task = BashOperator(
                task_id="new_task2",
                bash_command="sleep 5",
            )

            t1 >> renamed_task

            self.backend.send_lineage(
                operator=dag.get_task("task1"),
                context={
                    "dag": dag,
                    "task": dag.get_task("task1"),
                    "task_instance": TaskInstance(
                        task=dag.get_task("task1"),
                        execution_date=datetime.strptime(
                            "2022-03-15T08:13:45", "%Y-%m-%dT%H:%M:%S"
                        ),
                        state="running",
                    ),
                },
            )

            self.backend.send_lineage(
                operator=dag.get_task("new_task2"),
                context={
                    "dag": dag,
                    "task": dag.get_task("new_task2"),
                    "task_instance": TaskInstance(
                        task=dag.get_task("new_task2"),
                        execution_date=datetime.strptime(
                            "2022-03-15T08:13:45", "%Y-%m-%dT%H:%M:%S"
                        ),
                        state="running",
                    ),
                },
            )

        pipeline: Pipeline = self.metadata.get_by_name(
            entity=Pipeline, fqn="int_airflow.clean_test", fields=["tasks"]
        )
        self.assertIsNotNone(pipeline)
        self.assertIn("task1", {task.name for task in pipeline.tasks})
        self.assertIn("new_task2", {task.name for task in pipeline.tasks})
        self.assertNotIn("task2", {task.name for task in pipeline.tasks})

        self.metadata.delete(
            entity=Pipeline,
            entity_id=pipeline.id,
            recursive=True,
            hard_delete=True,
        )
