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
ColumnValuesToBeNotNull validation implementation
"""
# pylint: disable=duplicate-code

from datetime import datetime

from metadata.generated.schema.entity.data.table import ColumnProfile
from metadata.generated.schema.tests.basic import TestCaseResult, TestCaseStatus
from metadata.generated.schema.tests.column.columnValuesToBeNotNull import (
    ColumnValuesToBeNotNull,
)
from metadata.utils.logger import profiler_logger

logger = profiler_logger()


def column_values_to_be_not_null(
    _: ColumnValuesToBeNotNull,
    col_profile: ColumnProfile,
    execution_date: datetime,
    **__,
) -> TestCaseResult:
    """
    Validate Column Values metric
    :param _: ColumnValuesToBeUnique. Just used to trigger singledispatch
    :param col_profile: should contain count and distinct count metrics
    :param execution_date: Datetime when the tests ran
    :return: TestCaseResult with status and results
    """

    if col_profile.nullCount is None:
        msg = "We expect `nullCount` to be informed on the profiler for ColumnValuesToBeNotNull."
        logger.error(msg)
        return TestCaseResult(
            executionTime=execution_date.timestamp(),
            testCaseStatus=TestCaseStatus.Aborted,
            result=msg,
        )

    status = (
        TestCaseStatus.Success if col_profile.nullCount == 0 else TestCaseStatus.Failed
    )
    result = f"Found nullCount={col_profile.nullCount}. It should be 0."

    return TestCaseResult(
        executionTime=execution_date.timestamp(), testCaseStatus=status, result=result
    )
