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
from typing import Any, Dict, Optional

DAG_ID_DESCRIPTION = "The ID of the DAG."

# TODO https://github.com/open-metadata/OpenMetadata/issues/6215
APIS_METADATA = [
    {
        "name": "deploy_dag",
        "description": "Deploy a new DAG File to the DAGs directory",
        "http_method": "POST",
        "form_enctype": "multipart/form-data",
        "arguments": [],
        "post_arguments": [
            {
                "name": "workflow_config",
                "description": "Workflow config to deploy as IngestionPipeline",
                "form_input_type": "file",
                "required": True,
            },
        ],
    },
    {
        "name": "trigger_dag",
        "description": "Trigger a DAG",
        "http_method": "POST",
        "arguments": [],
        "post_arguments": [
            {
                "name": "dag_id",
                "description": DAG_ID_DESCRIPTION,
                "required": True,
            },
        ],
    },
    {
        "name": "test_connection",
        "description": "Test a connection",
        "http_method": "POST",
        "arguments": [],
        "post_arguments": [
            {
                "name": "service_connection",
                "description": "TestServiceConnectionRequest config to test",
                "required": True,
            },
        ],
    },
    {
        "name": "dag_status",
        "description": "Get the status of a dag's latest runs",
        "http_method": "GET",
        "arguments": [
            {
                "name": "dag_id",
                "description": DAG_ID_DESCRIPTION,
                "form_input_type": "text",
                "required": True,
            },
        ],
    },
    {
        "name": "delete_dag",
        "description": "Delete a DAG in the Web Server from Airflow database and filesystem",
        "http_method": "DELETE",
        "arguments": [
            {
                "name": "dag_id",
                "description": DAG_ID_DESCRIPTION,
                "form_input_type": "text",
                "required": True,
            },
        ],
    },
    {
        "name": "last_dag_logs",
        "description": "Retrieve all logs from the task instances of a last DAG run",
        "http_method": "GET",
        "arguments": [
            {
                "name": "dag_id",
                "description": DAG_ID_DESCRIPTION,
                "form_input_type": "text",
                "required": True,
            },
            {
                "name": "compress",
                "description": "Return the logs as gzip",
                "form_input_type": "bool",
                "required": False,
            },
        ],
    },
    {
        "name": "enable_dag",
        "description": "Mark the DAG as enabled to run on the next schedule.",
        "http_method": "POST",
        "arguments": [],
        "post_arguments": [
            {
                "name": "dag_id",
                "description": DAG_ID_DESCRIPTION,
                "form_input_type": "text",
                "required": True,
            },
        ],
    },
    {
        "name": "disable_dag",
        "description": "Mark the DAG as disabled. It will not run on the next schedule.",
        "http_method": "POST",
        "arguments": [],
        "post_arguments": [
            {
                "name": "dag_id",
                "description": DAG_ID_DESCRIPTION,
                "form_input_type": "text",
                "required": True,
            },
        ],
    },
    {
        "name": "kill_all",
        "description": "Mark all not finished tasks of a DAG as failed to kill the execution",
        "http_method": "POST",
        "arguments": [],
        "post_arguments": [
            {
                "name": "dag_id",
                "description": DAG_ID_DESCRIPTION,
                "form_input_type": "text",
                "required": True,
            },
        ],
    },
]


def get_metadata_api(name: str) -> Optional[Dict[str, Any]]:
    """
    Return the APIS_METADATA dict for a
    given name
    """
    return next(iter(api for api in APIS_METADATA if api["name"] == name), None)
