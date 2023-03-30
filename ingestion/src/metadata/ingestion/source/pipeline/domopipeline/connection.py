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
Source connection handler
"""
from pydomo import Domo

from metadata.clients.domo_client import DomoClient
from metadata.generated.schema.entity.services.connections.pipeline.domoPipelineConnection import (
    DomoPipelineConnection,
)
from metadata.ingestion.connections.test_connections import SourceConnectionException


def get_connection(connection: DomoPipelineConnection) -> Domo:
    """
    Create connection
    """
    try:
        return DomoClient(connection)
    except Exception as exc:
        msg = f"Unknown error connecting with {connection}: {exc}."
        raise SourceConnectionException(msg)


def test_connection(connection: Domo) -> None:
    """
    Test connection
    """
    try:
        connection.get_pipelines()
    except Exception as exc:
        msg = f"Unknown error while extracting pipeline from domo: {exc}."
        raise SourceConnectionException(msg)
