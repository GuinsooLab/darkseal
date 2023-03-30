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
Abstract BulkSink definition to build a Workflow
"""
from abc import ABCMeta, abstractmethod
from dataclasses import dataclass, field
from typing import Any, List

from .closeable import Closeable
from .status import Status


@dataclass
class BulkSinkStatus(Status):
    records: List[Any] = field(default_factory=list)
    warnings: List[Any] = field(default_factory=list)
    failures: List[Any] = field(default_factory=list)

    def records_written(self, record: Any) -> None:
        self.records.append(record)

    def warning(self, info: Any) -> None:
        self.warnings.append(info)

    def failure(self, info: Any) -> None:
        self.failures.append(info)


@dataclass  # type: ignore[misc]
class BulkSink(Closeable, metaclass=ABCMeta):
    @classmethod
    @abstractmethod
    def create(cls, config_dict: dict, metadata_config: dict) -> "BulkSink":
        pass

    @abstractmethod
    def write_records(self) -> None:
        pass

    @abstractmethod
    def get_status(self) -> BulkSinkStatus:
        pass

    @abstractmethod
    def close(self) -> None:
        pass
