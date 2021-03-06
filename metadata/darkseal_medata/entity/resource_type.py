# Copyright Contributors to the Darkseal project.
# SPDX-License-Identifier: Apache-2.0

from enum import Enum, auto


class ResourceType(Enum):
    """
    DEPRECATED, Please use darkseal_common/entity/resource_type.py instead
    """
    Table = auto()
    Dashboard = auto()
    User = auto()
    Column = auto()
    Feature = auto()


def to_resource_type(*, label: str) -> ResourceType:
    return ResourceType[label.title()]
