# Copyright Contributors to the Darkseal project.
# SPDX-License-Identifier: Apache-2.0

import unittest
from http import HTTPStatus

from mock import (
    MagicMock, Mock, patch,
)

from darkseal_search import create_app
from darkseal_search.api.document import DocumentTableAPI


class TestDocumentTableAPI(unittest.TestCase):
    def setUp(self) -> None:
        self.app = create_app(config_module_class='darkseal_search.config.Config')
        self.app_context = self.app.app_context()
        self.app_context.push()

    def tear_down(self) -> None:
        self.app_context.pop()

    @patch('darkseal_search.api.document.reqparse.RequestParser')
    @patch('darkseal_search.api.document.get_proxy_client')
    def test_delete(self, get_proxy: MagicMock, RequestParser: MagicMock) -> None:
        mock_proxy = get_proxy.return_value = Mock()
        RequestParser().parse_args.return_value = dict(data='[]', index='fake_index')

        response = DocumentTableAPI().delete(document_id='fake id')
        self.assertEqual(list(response)[1], HTTPStatus.OK)
        mock_proxy.delete_document.assert_called_with(data=['fake id'], index='fake_index')

    def test_should_not_reach_delete_without_id(self) -> None:
        response = self.app.test_client().delete('/document_table')

        self.assertEqual(response.status_code, 405)
