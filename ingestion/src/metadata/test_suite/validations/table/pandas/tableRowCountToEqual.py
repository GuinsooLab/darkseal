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
Validator for table row count to be equal test case
"""

from typing import Optional

from metadata.profiler.metrics.registry import Metrics
from metadata.test_suite.validations.mixins.pandas_validator_mixin import (
    PandasValidatorMixin,
)
from metadata.test_suite.validations.table.base.tableRowCountToEqual import (
    BaseTableRowCountToEqualValidator,
)


class TableRowCountToEqualValidator(
    BaseTableRowCountToEqualValidator, PandasValidatorMixin
):
    """Validator for table row count to be equal test case"""

    def _run_results(self, metric: Metrics) -> Optional[int]:
        """compute result of the test case"""
        return self.run_dataframe_results(self.runner, metric)
