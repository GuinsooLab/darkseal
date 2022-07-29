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

import io
import json
import os
import pathlib
from abc import ABC, abstractmethod
from typing import IO, Any, Optional

import yaml
from pydantic import BaseModel

from metadata.utils.logger import ingestion_logger

logger = ingestion_logger()


class ConfigModel(BaseModel):
    class Config:
        extra = "forbid"


class DynamicTypedConfig(ConfigModel):
    type: str
    config: Optional[Any]


class WorkflowExecutionError(Exception):
    """An error occurred when executing the workflow"""


class ConfigurationError(Exception):
    """A configuration error has happened"""


class ConfigurationMechanism(ABC):
    @abstractmethod
    def load_config(self, config_fp: IO) -> dict:
        pass


class YamlConfigurationMechanism(ConfigurationMechanism):
    """load configuration from yaml files"""

    def load_config(self, config_fp: IO) -> dict:
        try:
            config = yaml.safe_load(config_fp)
            return config
        except yaml.error.YAMLError:
            msg = "YAML Configuration file is not a valid YAML"
            logger.error(msg)
            raise ConfigurationError(msg)


class JsonConfigurationMechanism(ConfigurationMechanism):
    """load configuration from json files"""

    def load_config(self, config_fp: IO) -> dict:
        try:
            config = json.load(config_fp)
            return config
        except json.decoder.JSONDecodeError:
            msg = "JSON Configuration file is not a valid JSON"
            logger.error(msg)
            raise ConfigurationError(msg)


def load_config_file(config_file: pathlib.Path) -> dict:
    if not config_file.is_file():
        raise ConfigurationError(f"Cannot open config file {config_file}")

    config_mech: ConfigurationMechanism
    if config_file.suffix in [".yaml", ".yml"]:
        config_mech = YamlConfigurationMechanism()
    elif config_file.suffix == ".json":
        config_mech = JsonConfigurationMechanism()
    else:
        raise ConfigurationError(
            "Only .json and .yml are supported. Cannot process file type {}".format(
                config_file.suffix
            )
        )
    with config_file.open() as raw_config_file:
        raw_config = raw_config_file.read()
    expanded_config_file = os.path.expandvars(raw_config)
    config_fp = io.StringIO(expanded_config_file)
    config = config_mech.load_config(config_fp)
    return config
