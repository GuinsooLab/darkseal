#  Copyright 2022 Collate
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
TestCase builder
"""

from metadata.generated.schema.api.tests.createColumnTest import CreateColumnTestRequest
from metadata.generated.schema.tests.column import columnValuesToBeNotNull
from metadata.generated.schema.tests.columnTest import ColumnTestType
from metadata.great_expectations.builders.column.base_column_test_builder import (
    BaseColumnTestBuilder,
)


class ColumnValuesToBeNotNullBuilder(BaseColumnTestBuilder):
    """Builder for `expect_column_values_to_not_be_null` GE expectation"""

    def _build_test(self) -> CreateColumnTestRequest:
        """Specific test builder for the test"""
        return self.build_test_request(
            config=columnValuesToBeNotNull.ColumnValuesToBeNotNull(),
            test_type=ColumnTestType.columnValuesToBeNotNull,
        )
