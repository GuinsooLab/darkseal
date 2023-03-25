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
Population Standard deviation Metric definition
"""

# Keep SQA docs style defining custom constructs
# pylint: disable=consider-using-f-string,duplicate-code
from typing import cast

from sqlalchemy import column
from sqlalchemy.ext.compiler import compiles
from sqlalchemy.sql.functions import FunctionElement

from metadata.profiler.metrics.core import CACHE, StaticMetric, _label
from metadata.profiler.orm.registry import Dialects, is_quantifiable
from metadata.utils.logger import profiler_logger

logger = profiler_logger()


class StdDevFn(FunctionElement):
    name = __qualname__
    inherit_cache = CACHE


@compiles(StdDevFn)
def _(element, compiler, **kw):
    return "STDDEV_POP(%s)" % compiler.process(element.clauses, **kw)


@compiles(StdDevFn, Dialects.MSSQL)
def _(element, compiler, **kw):
    return "STDEVP(%s)" % compiler.process(element.clauses, **kw)


@compiles(StdDevFn, Dialects.SQLite)  # Needed for unit tests
def _(element, compiler, **kw):
    """
    This actually returns the squared STD, but as
    it is only required for tests we can live with it.
    """

    proc = compiler.process(element.clauses, **kw)
    return "AVG(%s * %s) - AVG(%s) * AVG(%s)" % ((proc,) * 4)


@compiles(StdDevFn, Dialects.ClickHouse)
def _(element, compiler, **kw):
    """Returns stdv for clickhouse database and handle empty tables.
    If table is empty, clickhouse returns NaN.
    """
    proc = compiler.process(element.clauses, **kw)
    return "if(isNaN(stddevPop(%s)), null, stddevPop(%s))" % ((proc,) * 2)


class StdDev(StaticMetric):
    """
    STD Metric

    Given a column, return the Standard Deviation value.
    """

    @classmethod
    def name(cls):
        return "stddev"

    @property
    def metric_type(self):
        return float

    @_label
    def fn(self):
        """sqlalchemy function"""
        if is_quantifiable(self.col.type):
            return StdDevFn(column(self.col.name))

        logger.debug(
            f"{self.col} has type {self.col.type}, which is not listed as quantifiable."
            + " We won't compute STDDEV for it."
        )
        return None

    def df_fn(self, df=None):
        """pandas function"""
        import pandas as pd  # pylint: disable=import-outside-toplevel

        df = cast(pd.DataFrame, df)

        if is_quantifiable(self.col.type):
            stddev = df[self.col.name].std()
            if pd.isnull(stddev):
                return None
            return stddev
        logger.debug(
            f"{self.col.name} has type {self.col.type}, which is not listed as quantifiable."
            + " We won't compute STDDEV for it."
        )
        return None
