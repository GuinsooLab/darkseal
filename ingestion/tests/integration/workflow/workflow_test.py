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

import importlib
import pathlib
from unittest import TestCase

from metadata.config.common import ConfigurationError, load_config_file
from metadata.ingestion.api.workflow import Workflow
from metadata.ingestion.ometa.ometa_api import OpenMetadata


class WorkflowTest(TestCase):
    def test_get_200(self):
        key = "metadata.ingestion.sink.metadata_rest.MetadataRestSink"
        if key.find(".") >= 0:
            module_name, class_name = key.rsplit(".", 1)
            my_class = getattr(importlib.import_module(module_name), class_name)
            self.assertEqual((my_class is not None), True)

    def test_get_4xx(self):
        key = "metadata.ingestion.sink.MYSQL.mysqlSINK"
        try:
            if key.find(".") >= 0:
                module_name, class_name = key.rsplit(".", 1)
                getattr(importlib.import_module(module_name), class_name)
        except ModuleNotFoundError:
            self.assertRaises(ModuleNotFoundError)

    def test_title_typeClassFetch(self):
        is_file = True
        file_type = "query-parser"
        if is_file:
            replace = file_type.replace("-", "_")
        else:
            replace = "".join(
                [i.title() for i in file_type.replace("-", "_").split("_")]
            )
        self.assertEqual(replace, "query_parser")

    def test_title_typeClassFetch_4xx(self):
        is_file = False
        file_type = "query-parser"
        if is_file:
            replace = file_type.replace("-", "_")
        else:
            replace = "".join(
                [i.title() for i in file_type.replace("-", "_").split("_")]
            )
        self.assertEqual(replace, "QueryParser")

    def test_execute_200(self):
        current_dir = pathlib.Path(__file__).resolve().parent
        config_file = current_dir.joinpath("mysql_test.yaml")
        workflow_config = load_config_file(config_file)
        workflow = Workflow.create(workflow_config)
        workflow.execute()
        workflow.stop()
        config = workflow.config.workflowConfig.openMetadataServerConfig
        client = OpenMetadata(config).client

        client.delete(
            f"/services/databaseServices/"
            f"{client.get('/services/databaseServices/name/local_mysql_test')['id']}"
            f"?hardDelete=true&recursive=true"
        )
        file_path = "/tmp/mysql_test"
        with open(file_path) as ingestionFile:
            ingestionData = ingestionFile.read()
        self.assertEqual(ingestionData is not None, True)

    def test_execute_4xx(self):
        config_file = pathlib.Path("/tmp/mysql_test123")
        try:
            load_config_file(config_file)
        except ConfigurationError:
            self.assertRaises(ConfigurationError)
