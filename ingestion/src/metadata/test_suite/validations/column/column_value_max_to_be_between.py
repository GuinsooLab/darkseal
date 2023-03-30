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
ColumnValuesToBeBetween validation implementation
"""
# pylint: disable=duplicate-code

import traceback
from datetime import datetime
from functools import singledispatch
from typing import Union

from pandas import DataFrame
from sqlalchemy import inspect

from metadata.generated.schema.tests.basic import (
    TestCaseResult,
    TestCaseStatus,
    TestResultValue,
)
from metadata.generated.schema.tests.testCase import TestCase
from metadata.orm_profiler.metrics.registry import Metrics
from metadata.orm_profiler.profiler.runner import QueryRunner
from metadata.utils.column_base_model import fetch_column_obj
from metadata.utils.entity_link import get_decoded_column
from metadata.utils.logger import test_suite_logger
from metadata.utils.test_suite import get_test_case_param_value

logger = test_suite_logger()


def test_case_status_result(min_bound, max_bound, max_value_res):
    return (
        TestCaseStatus.Success
        if min_bound <= max_value_res <= max_bound
        else TestCaseStatus.Failed,
        f"Found max={max_value_res} vs."
        + f" the expected min={min_bound}, max={max_bound}.",
    )


@singledispatch
def column_value_max_to_be_between(
    runner,
    test_case: TestCase,
    execution_date: Union[datetime, float],
):
    raise NotImplementedError


@column_value_max_to_be_between.register
def _(
    runner: QueryRunner,
    test_case: TestCase,
    execution_date: Union[datetime, float],
) -> TestCaseResult:
    """
    Validate Column Values metric
    :param test_case: columnValueMaxToBeBetween
    :param col_profile: should contain MIN & MAX metrics
    :param execution_date: Datetime when the tests ran
    :return: TestCaseResult with status and results
    """

    try:
        column_name = get_decoded_column(test_case.entityLink.__root__)
        col = next(
            (col for col in inspect(runner.table).c if col.name == column_name),
            None,
        )
        if col is None:
            raise ValueError(
                f"Cannot find the configured column {column_name} for test case {test_case.name}"
            )

        max_value_dict = dict(
            runner.dispatch_query_select_first(Metrics.MAX.value(col).fn())
        )
        max_value_res = max_value_dict.get(Metrics.MAX.name)
        if max_value_res is None:
            raise ValueError(
                f"Query on column {column_name} for test case {test_case.name} returned None"
            )

    except Exception as exc:  # pylint: disable=broad-except
        msg = (
            f"Error computing {test_case.name} for {runner.table.__tablename__}: {exc}"
        )
        logger.debug(traceback.format_exc())
        logger.warning(msg)
        return TestCaseResult(
            timestamp=execution_date,
            testCaseStatus=TestCaseStatus.Aborted,
            result=msg,
            testResultValue=[TestResultValue(name="max", value=None)],
        )

    min_bound = get_test_case_param_value(
        test_case.parameterValues,  # type: ignore
        "minValueForMaxInCol",
        float,
        default=float("-inf"),
    )

    max_bound = get_test_case_param_value(
        test_case.parameterValues,  # type: ignore
        "maxValueForMaxInCol",
        float,
        default=float("inf"),
    )

    status, result = test_case_status_result(min_bound, max_bound, max_value_res)

    return TestCaseResult(
        timestamp=execution_date,
        testCaseStatus=status,
        result=result,
        testResultValue=[TestResultValue(name="max", value=str(max_value_res))],
    )


@column_value_max_to_be_between.register
def _(
    runner: DataFrame,
    test_case: TestCase,
    execution_date: Union[datetime, float],
):
    """
    Validate Column Values metric
    :param test_case: columnValueMaxToBeBetween
    :param col_profile: should contain MIN & MAX metrics
    :param execution_date: Datetime when the tests ran
    :return: TestCaseResult with status and results
    """
    column_obj = fetch_column_obj(test_case.entityLink.__root__, runner)

    min_bound = get_test_case_param_value(
        test_case.parameterValues,  # type: ignore
        "minValueForMaxInCol",
        float,
        default=float("-inf"),
    )

    max_bound = get_test_case_param_value(
        test_case.parameterValues,  # type: ignore
        "maxValueForMaxInCol",
        float,
        default=float("inf"),
    )

    max_value_res = Metrics.MAX.value(column_obj).dl_fn(runner)
    status, result = test_case_status_result(min_bound, max_bound, max_value_res)
    return TestCaseResult(
        timestamp=execution_date,
        testCaseStatus=status,
        result=result,
        testResultValue=[TestResultValue(name="max", value=str(max_value_res))],
    )
