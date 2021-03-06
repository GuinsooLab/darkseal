# Copyright Contributors to the Darkseal project.
# SPDX-License-Identifier: Apache-2.0


import unittest
from typing import Any, Dict  # noqa: F401
from unittest.mock import MagicMock, patch

from flask import Flask

import darkseal_medata
from darkseal_medata.config import PROXY_CLIENTS
from darkseal_medata.proxy import get_proxy_client


class TestCreateProxy(unittest.TestCase):
    proxies = {
        'NEO4J': {'host': 'bolt://neo4j.com', 'port': 7687, 'password': 'neo4j'},
        'ATLAS': {'host': 'http://atlas.com', 'port': 21000, 'password': 'atlas'}
    }

    @patch('neo4j.GraphDatabase.driver', MagicMock())
    def test_proxy_client_creation(self) -> None:
        for proxy, spec in self.proxies.items():
            with self.subTest():
                config = darkseal_medata.config.LocalConfig()
                darkseal_medata.proxy._proxy_client = None

                config.PROXY_CLIENT = PROXY_CLIENTS[proxy]
                config.PROXY_HOST = spec['host']  # type: ignore
                config.PROXY_PORT = spec['port']  # type: ignore

                app = Flask(__name__)

                app.config.from_object(config)

                with app.app_context():
                    try:
                        get_proxy_client()
                        assert True
                    except Exception as e:
                        assert False
