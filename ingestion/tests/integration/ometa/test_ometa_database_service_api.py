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
OpenMetadata high-level API Database Servie tests
"""
import uuid
from unittest import TestCase

from metadata.generated.schema.api.services.createDatabaseService import (
    CreateDatabaseServiceRequest,
)
from metadata.generated.schema.entity.data.database import Database
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
from metadata.ingestion.ometa.ometa_api import OpenMetadata


class OMetaDatabaseServiceTest(TestCase):
    """
    Run this integration test with the local API available
    Install the ingestion package before running the tests
    """

    server_config = OpenMetadataConnection(hostPort="http://localhost:8585/api")
    metadata = OpenMetadata(server_config)

    assert metadata.health_check()

    connection = DatabaseConnection(
        config=MysqlConnection(
            username="username", password="password", hostPort="http://localhost:1234"
        )
    )

    @classmethod
    def setUpClass(cls) -> None:
        """
        Prepare ingredients
        """
        cls.entity = DatabaseService(
            id=uuid.uuid4(),
            name="test-db-service",
            serviceType=DatabaseServiceType.Mysql,
            connection=cls.connection,
            href="http://resource-uri/",  # Dummy value, this is auto-generated by OM
        )

        cls.create = CreateDatabaseServiceRequest(
            name="test-db-service",
            serviceType=DatabaseServiceType.Mysql,
            connection=cls.connection,
        )

    @classmethod
    def tearDownClass(cls) -> None:
        """
        Clean up
        """
        service_db_id = str(
            cls.metadata.get_by_name(
                entity=DatabaseService, fqn="test-db-service"
            ).id.__root__
        )

        cls.metadata.delete(
            entity=DatabaseService,
            entity_id=service_db_id,
            recursive=True,
            hard_delete=True,
        )

    def test_create_database_service(self):
        """
        We can create a DB Service and we receive it back as Entity
        """

        res: DatabaseService = self.metadata.create_or_update(data=self.create)

        self.assertEqual(res.name, self.entity.name)
        self.assertEqual(res.serviceType, self.entity.serviceType)
        self.assertEqual(
            res.connection.config.hostPort, self.entity.connection.config.hostPort
        )

    def test_update_database_service(self):
        """
        Updating a DB Service entity changes its properties
        """

        original_res = self.metadata.create_or_update(data=self.create)

        new_connection = DatabaseConnection(
            config=MysqlConnection(
                username="username",
                password="password",
                hostPort="http://localhost:2000",
            )
        )

        update_request = CreateDatabaseServiceRequest(
            name="test-db-service",
            serviceType=DatabaseServiceType.Mysql,
            connection=new_connection,
        )

        updated_res: DatabaseService = self.metadata.create_or_update(
            data=update_request
        )

        # Same ID, updated owner
        self.assertEqual(updated_res.id, original_res.id)
        self.assertEqual(
            updated_res.connection.config.hostPort, new_connection.config.hostPort
        )

    def test_get_name(self):
        """
        We can fetch a Database Service by name and get it back as Entity
        """

        self.metadata.create_or_update(data=self.create)

        res = self.metadata.get_by_name(entity=DatabaseService, fqn=self.entity.name)
        self.assertEqual(res.name, self.entity.name)

    def test_get_id(self):
        """
        We can fetch a Database by ID and get it back as Entity
        """

        self.metadata.create_or_update(data=self.create)

        # First pick up by name
        res_name = self.metadata.get_by_name(
            entity=DatabaseService, fqn=self.entity.name
        )
        # Then fetch by ID
        res = self.metadata.get_by_id(entity=DatabaseService, entity_id=res_name.id)

        self.assertEqual(res_name.id, res.id)

    def test_list(self):
        """
        We can list all our Database Services
        """

        self.metadata.create_or_update(data=self.create)

        res = self.metadata.list_entities(entity=DatabaseService)

        assert self.entity.name in (ent.name for ent in res.entities)

    def test_delete(self):
        """
        We can delete a Database by ID
        """

        self.metadata.create_or_update(data=self.create)

        # Find by name
        res_name = self.metadata.get_by_name(
            entity=DatabaseService, fqn=self.entity.name
        )
        # Then fetch by ID
        res_id = self.metadata.get_by_id(
            entity=DatabaseService, entity_id=str(res_name.id.__root__)
        )

        # Delete
        self.metadata.delete(
            entity=DatabaseService, entity_id=str(res_id.id.__root__), recursive=True
        )

        # Then we should not find it
        res = self.metadata.list_entities(entity=Database)

        assert self.entity.name not in (ent.name for ent in res.entities)

    def test_list_versions(self):
        """
        We can list the version of a given DB Service entity
        """
        self.metadata.create_or_update(data=self.create)

        # Find by name
        res_name = self.metadata.get_by_name(
            entity=DatabaseService, fqn=self.entity.name
        )

        res = self.metadata.get_list_entity_versions(
            entity=DatabaseService, entity_id=res_name.id.__root__
        )
        assert res
