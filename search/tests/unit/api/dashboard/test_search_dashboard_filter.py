# Copyright Contributors to the Darkseal project.
# SPDX-License-Identifier: Apache-2.0

import unittest
from http import HTTPStatus

from mock import MagicMock, patch

from darkseal_search import create_app


class SearchDashboardFilterTest(unittest.TestCase):
    def setUp(self) -> None:
        self.app = create_app(config_module_class='darkseal_search.config.LocalConfig')
        self.app_context = self.app.app_context()
        self.app_context.push()
        self.mock_index = 'dashboard_search_index'
        self.mock_term = 'test'
        self.mock_page_index = 0
        self.mock_search_request = {
            'type': 'AND',
            'filters': {
                'product': ['mode']
            }
        }
        self.url = '/search_dashboard_filter'

    def tear_down(self) -> None:
        self.app_context.pop()

    @patch('darkseal_search.api.dashboard.reqparse.RequestParser')
    @patch('darkseal_search.api.base.get_proxy_client')
    def test_post(self, get_proxy: MagicMock, RequestParser: MagicMock) -> None:
        mock_proxy = get_proxy()
        RequestParser().parse_args.return_value = dict(index=self.mock_index,
                                                       page_index=self.mock_page_index,
                                                       query_term=self.mock_term,
                                                       search_request=self.mock_search_request)

        self.app.test_client().post(self.url)
        mock_proxy.fetch_search_results_with_filter.assert_called_with(index=self.mock_index,
                                                                       page_index=self.mock_page_index,
                                                                       query_term=self.mock_term,
                                                                       search_request=self.mock_search_request)

    @patch('darkseal_search.api.dashboard.reqparse.RequestParser')
    @patch('darkseal_search.api.base.get_proxy_client')
    def test_post_return_400_if_no_search_request(self, get_proxy: MagicMock, RequestParser: MagicMock) -> None:
        RequestParser().parse_args.return_value = dict(index=self.mock_index,
                                                       query_term=self.mock_term)

        response = self.app.test_client().post(self.url)
        self.assertEqual(response.status_code, HTTPStatus.BAD_REQUEST)

    @patch('darkseal_search.api.dashboard.reqparse.RequestParser')
    @patch('darkseal_search.api.base.get_proxy_client')
    def test_post_return_400_if_bad_query_term(self, get_proxy: MagicMock, RequestParser: MagicMock) -> None:
        RequestParser().parse_args.return_value = dict(index=self.mock_index,
                                                       page_index=self.mock_page_index,
                                                       query_term='name:bad_syntax',
                                                       search_request=self.mock_search_request)

        response = self.app.test_client().post(self.url)
        self.assertEqual(response.status_code, HTTPStatus.BAD_REQUEST)
