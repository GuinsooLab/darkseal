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
Entrypoint to test the connection to a source
"""
import os

import yaml

from metadata.generated.schema.entity.automations.testServiceConnection import (
    TestServiceConnectionRequest,
)
from metadata.ingestion.source.connections import get_connection, get_test_connection_fn
from metadata.utils.secrets.secrets_manager_factory import SecretsManagerFactory


def main():
    """
    Test Connection entrypoint.

    The expected information is in the shape of `TestServiceConnectionRequest`, e.g.,
    ```
    connection:
      config:
        type: Mysql
        scheme: mysql+pymysql
        username: openmetadata_user
        password: openmetadata_password
        hostPort: 'localhost:3306'
    connectionType: Database
    ```
    """

    config = os.getenv("config")
    if not config:
        raise RuntimeError(
            "Missing environment variable `config` with the TestServiceConnectionRequest dict."
        )

    test_connection_dict = yaml.safe_load(config)
    test_service_connection = TestServiceConnectionRequest.parse_obj(
        test_connection_dict
    )

    # we need to instantiate the secret manager in case secrets are passed
    SecretsManagerFactory(test_service_connection.secretsManagerProvider, None)
    connection = get_connection(test_service_connection.connection.config)

    # We won't wrap the call in a try/catch. If the connection fails, we want to
    # raise the SourceConnectionException as it comes.
    test_connection_fn = get_test_connection_fn(
        test_service_connection.connection.config
    )
    test_connection_fn(connection, test_service_connection.connection.config)


if __name__ == "__main__":
    main()
