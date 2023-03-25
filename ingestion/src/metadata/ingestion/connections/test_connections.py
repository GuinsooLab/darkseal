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
Classes and methods to handle connection testing when
creating a service
"""
import traceback
from typing import Callable, List

from pydantic import BaseModel
from sqlalchemy.engine import Engine
from sqlalchemy.exc import OperationalError

from metadata.profiler.orm.functions.conn_test import ConnTestFn
from metadata.utils.logger import cli_logger
from metadata.utils.timeout import timeout

logger = cli_logger()


class SourceConnectionException(Exception):
    """
    Raised when we cannot connect to the source
    """


class TestConnectionStep(BaseModel):
    """
    Function and step name to test.

    The function should be ready to be called.

    If it needs arguments, use `partial` to send a pre-filled
    Callable. Example

    ```
    def suma(a, b):
        return a + b

    step_1 = TestConnectionStep(
        function=partial(suma, a=1, b=1),
        name="suma"
    )
    ```

    so that we can execute `step_1.function()`
    """

    function: Callable
    name: str
    mandatory: bool = True


class TestConnectionResult(BaseModel):
    failed: List[str] = []
    success: List[str] = []
    warning: List[str] = []


def test_connection_steps(steps: List[TestConnectionStep]) -> TestConnectionResult:
    """
    Run all the function steps and raise any errors
    """

    test_connection_result = TestConnectionResult()
    for step in steps:
        try:
            step.function()
            test_connection_result.success.append(f"'{step.name}': Pass")

        except Exception as exc:
            logger.debug(traceback.format_exc())
            logger.warning(f"{step.name}-{exc}")
            if step.mandatory:
                test_connection_result.failed.append(
                    f"'{step.name}': This is a mandatory step and we won't be able to extract necessary metadata"
                )

            else:
                test_connection_result.warning.append(
                    f"'{step.name}': This is a optional and the ingestion will continue to work as expected"
                )

    return test_connection_result


def test_connection_engine(connection: Engine, steps=None) -> TestConnectionResult:
    try:
        with connection.connect() as conn:
            conn.execute(ConnTestFn())
            if steps:
                return test_connection_steps(steps)
    except SourceConnectionException as exc:
        raise exc
    except OperationalError as err:
        msg = f"Connection error for {connection}: {err}. Check the connection details."
        raise SourceConnectionException(msg) from err
    except Exception as exc:
        msg = f"Unknown error connecting with {connection}: {exc}."
        raise SourceConnectionException(msg) from exc

    return None


def test_connection_db_common(
    connection: Engine, steps=None, timeout_seconds: int = 120
) -> TestConnectionResult:
    """
    Default implementation is the engine to test.

    Test that we can connect to the source using the given engine
    :param connection: Engine to test
    :return: None or raise an exception if we cannot connect
    """
    return timeout(timeout_seconds)(test_connection_engine)(connection, steps)
