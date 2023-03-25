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
test entity link utils
"""

import pytest

from metadata.utils.entity_link import get_decoded_column


@pytest.mark.parametrize(
    "entity_link,expected",
    [
        (
            "<#E::table::rds.dev.dbt_jaffle.column_w_space::columns::first+name>",
            "first name",
        ),
        (
            "<#E::table::rds.dev.dbt_jaffle.column_w_space::columns::last_name>",
            "last_name",
        ),
    ],
)
def test_get_decoded_column(entity_link, expected):
    """test get_decoded_column return expected values"""
    assert get_decoded_column(entity_link) == expected
