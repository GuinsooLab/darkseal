# Copyright Contributors to the Darkseal project.
# SPDX-License-Identifier: Apache-2.0import json


import logging

from darkseal_medata.proxy.janus_graph_proxy import JanusGraphGremlinProxy

from .roundtrip_gremlin_proxy import RoundtripGremlinProxy

LOGGER = logging.getLogger(__name__)


class RoundtripJanusGraphProxy(JanusGraphGremlinProxy, RoundtripGremlinProxy):
    pass
