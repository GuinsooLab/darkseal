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
SUM Metric definition
"""
# pylint: disable=duplicate-code

from sqlalchemy import column

from metadata.orm_profiler.metrics.core import StaticMetric, _label
from metadata.orm_profiler.orm.functions.sum import SumFn
from metadata.orm_profiler.orm.registry import is_quantifiable


class Sum(StaticMetric):
    """
    SUM Metric

    Given a column, return the sum of its values.

    Only works for quantifiable types
    """

    @classmethod
    def name(cls):
        return "sum"

    @_label
    def fn(self):
        if is_quantifiable(self.col.type):
            return SumFn(column(self.col.name))

        return None

    @_label
    def dl_fn(self, data_frame):
        if is_quantifiable(self.col.datatype):
            return (
                data_frame[self.col.name].sum()
                if not isinstance(data_frame[self.col.name].sum(), list)
                else data_frame[self.col.name].sum().tolist()
            )
        return None
