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
Helper module for test suite functions
"""

from __future__ import annotations

from datetime import datetime
from typing import Callable, List, Optional

from metadata.generated.schema.tests.basic import (
    TestCaseResult,
    TestCaseStatus,
    TestResultValue,
)
from metadata.generated.schema.tests.testCase import TestCaseParameterValue


def get_test_case_param_value(
    test_case_param_vals: list[TestCaseParameterValue],
    name: str,
    type_,
    default=None,
    pre_processor: Optional[Callable] = None,
):
    """Give a column and a type return the value with the appropriate type casting for the
    test case definition.

    Args:
        test_case: the test case
        type_ (Union[float, int, str]): type for the value
        name (str): column name
        default (_type_, optional): Default value to return if column is not found
        pre_processor: pre processor function/type to use against the value before casting to type_
    """
    value = next(
        (param.value for param in test_case_param_vals if param.name == name), None
    )

    if not value:
        return default

    if not pre_processor:
        return type_(value)

    pre_processed_value = pre_processor(value)
    return type_(pre_processed_value)


def build_test_case_result(
    execution_datetime: datetime,
    status: TestCaseStatus,
    result: str,
    test_result_value: List[TestResultValue],
    sample_data: Optional[str] = None,
) -> TestCaseResult:
    """create a test case result object

    Args:
        execution_datetime (datetime): execution datetime of the test
        status (TestCaseStatus): failed, succeed, aborted
        result (str): message to display
        testResultValue (List[TestResultValue]): values for the test result

    Returns:
        TestCaseResult:
    """
    return TestCaseResult(
        timestamp=execution_datetime,
        testCaseStatus=status,
        result=result,
        testResultValue=test_result_value,
        sampleData=sample_data,
    )
