# Copyright Contributors to the Darkseal project.
# SPDX-License-Identifier: Apache-2.0

import unittest

from flask import current_app

from darkseal_search import create_app


class AppTest(unittest.TestCase):
    """
    Test the service if it can stand-up
    """

    def setUp(self) -> None:
        config_module_class = 'darkseal_search.config.LocalConfig'
        self.app = create_app(config_module_class=config_module_class)
        self.app_context = self.app.app_context()
        self.app_context.push()

    def tearDown(self) -> None:
        self.app_context.pop()

    def test_app_exists(self) -> None:
        self.assertFalse(current_app is None)
