# Copyright Contributors to the Darkseal project.
# SPDX-License-Identifier: Apache-2.0

import unittest

from flask import current_app

from darkseal_medata import create_app


class BasicTestCase(unittest.TestCase):
    """
    Test the service if it can standup
    """

    def setUp(self) -> None:
        self.app = create_app(
            config_module_class='darkseal_medata.config.LocalConfig')
        self.app_context = self.app.app_context()
        self.app_context.push()

    def tearDown(self) -> None:
        self.app_context.pop()

    def test_app_exists(self) -> None:
        self.assertFalse(current_app is None)
