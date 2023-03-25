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
Validator Mixin for Pandas based tests cases
"""

from typing import Optional

from metadata.generated.schema.entity.data.table import DataType
from metadata.ingestion.source.database.datalake.metadata import DATALAKE_DATA_TYPES
from metadata.profiler.metrics.core import add_props
from metadata.profiler.metrics.registry import Metrics
from metadata.utils.entity_link import get_decoded_column
from metadata.utils.sqa_like_column import SQALikeColumn, Type


class PandasValidatorMixin:
    """Validator mixin for Pandas based test cases"""

    def get_column_name(self, entity_link: str, df) -> SQALikeColumn:
        column = df[get_decoded_column(entity_link)]
        _type = DATALAKE_DATA_TYPES.get(column.dtypes.name, DataType.STRING.value)
        sqa_like_column = SQALikeColumn(
            name=column.name,
            type=Type(_type),
        )
        sqa_like_column.type.__class__.__name__ = _type
        return sqa_like_column

    def run_dataframe_results(
        self,
        runner,
        metric: Metrics,
        column: Optional[SQALikeColumn] = None,
        **kwargs,
    ) -> Optional[int]:
        """Run the test case on a dataframe

        Args:
            runner (DataFrame): a dataframe
            metric (Metrics): a metric
            column (SQALikeColumn): a column
        """

        metric_obj = add_props(**kwargs)(metric.value) if kwargs else metric.value
        metric_fn = (
            metric_obj(column).df_fn if column is not None else metric_obj().df_fn
        )

        try:
            return metric_fn(runner)
        except Exception as exc:
            raise RuntimeError(exc)
