# Copyright Contributors to the Darkseal project.
# SPDX-License-Identifier: Apache-2.0

from http import HTTPStatus
from unittest.mock import MagicMock

from darkseal_common.entity.resource_type import ResourceType
from flask import current_app

from darkseal_medata import create_app
from darkseal_medata.api.badge import BadgeCommon
from darkseal_medata.entity.badge import Badge
from tests.unit.api.dashboard.dashboard_test_case import DashboardTestCase

BADGE_NAME = 'alpha'
CATEGORY = 'table_status'


class TestBadgeCommon(DashboardTestCase):

    def setUp(self) -> None:
        self.app = create_app(
            config_module_class='darkseal_medata.config.LocalConfig')
        self.app_context = self.app.app_context()
        self.app_context.push()

    def tearDown(self) -> None:
        self.app_context.pop()

    def test_app_exists(self) -> None:
        self.assertFalse(current_app is None)

    def test_badge_on_reserved_badge_name(self) -> None:
        self.app.config['WHITELIST_BADGES'] = [Badge(badge_name='alpha',
                                                     category='table_status')]

        mock_proxy = MagicMock()

        badge_common = BadgeCommon(client=mock_proxy)
        response = badge_common.put(id='',
                                    resource_type=ResourceType.Dashboard,
                                    badge_name=BADGE_NAME,
                                    category=CATEGORY)

        self.assertEqual(response[1], HTTPStatus.OK)

    def test_badge_on_not_reserved_badge_name(self) -> None:
        self.app.config['WHITELIST_BADGES'] = []

        mock_proxy = MagicMock()
        badge_common = BadgeCommon(client=mock_proxy)
        response = badge_common.put(id='',
                                    resource_type=ResourceType.Dashboard,
                                    badge_name=BADGE_NAME,
                                    category=CATEGORY)

        self.assertEqual(response[1], HTTPStatus.NOT_FOUND)
