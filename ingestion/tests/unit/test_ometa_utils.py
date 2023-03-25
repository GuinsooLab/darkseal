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
OpenMetadata utils tests
"""
from unittest import TestCase

from metadata.generated.schema.entity.data.mlmodel import MlModel
from metadata.generated.schema.type import basic
from metadata.ingestion.connections.headers import render_query_header
from metadata.ingestion.ometa.utils import format_name, get_entity_type, model_str


class OMetaUtilsTest(TestCase):
    def test_format_name(self):
        """
        Check we are properly formatting names
        """

        self.assertEqual(format_name("random"), "random")
        self.assertEqual(format_name("ran dom"), "ran_dom")
        self.assertEqual(format_name("ran_(dom"), "ran__dom")

    def test_get_entity_type(self):
        """
        Check that we return a string or the class name
        """

        self.assertEqual(get_entity_type("hello"), "hello")
        self.assertEqual(get_entity_type(MlModel), "mlmodel")

    def test_model_str(self):
        """
        Return Uuid as str
        """

        self.assertEqual(model_str("random"), "random")
        self.assertEqual(
            model_str(basic.Uuid(__root__="9fc58e81-7412-4023-a298-59f2494aab9d")),
            "9fc58e81-7412-4023-a298-59f2494aab9d",
        )

        self.assertEqual(
            model_str(basic.EntityName(__root__="EntityName")), "EntityName"
        )
        self.assertEqual(
            model_str(basic.FullyQualifiedEntityName(__root__="FQDN")), "FQDN"
        )

    def test_render_query_headers_builds_the_right_string(self) -> None:
        assert (
            render_query_header("0.0.1")
            == '/* {"app": "OpenMetadata", "version": "0.0.1"} */'
        )
