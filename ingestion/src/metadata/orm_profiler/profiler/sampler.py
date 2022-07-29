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
Helper module to handle data sampling
for the profiler
"""
from typing import Dict, Optional, Union

from sqlalchemy import column, inspect, text
from sqlalchemy.orm import DeclarativeMeta, Query, Session, aliased
from sqlalchemy.orm.util import AliasedClass

from metadata.generated.schema.entity.data.table import TableData
from metadata.orm_profiler.orm.functions.modulo import ModuloFn
from metadata.orm_profiler.orm.functions.random_num import RandomNumFn
from metadata.orm_profiler.profiler.handle_partition import partition_filter_handler

RANDOM_LABEL = "random"


class Sampler:
    """
    Generates a sample of the data to not
    run the query in the whole table.
    """

    def __init__(
        self,
        session: Session,
        table: DeclarativeMeta,
        profile_sample: Optional[float] = None,
        partition_details: Optional[Dict] = None,
        profile_sample_query: Optional[str] = None,
    ):
        self.profile_sample = profile_sample
        self.session = session
        self.table = table
        self._partition_details = partition_details
        self._profile_sample_query = profile_sample_query

        self.sample_limit = 100

    @partition_filter_handler(build_sample=True)
    def get_sample_query(self) -> Query:
        return self.session.query(
            self.table, (ModuloFn(RandomNumFn(), 100)).label(RANDOM_LABEL)
        ).cte(f"{self.table.__tablename__}_rnd")

    def random_sample(self) -> Union[DeclarativeMeta, AliasedClass]:
        """
        Either return a sampled CTE of table, or
        the full table if no sampling is required.
        """

        if not self.profile_sample:
            if self._partition_details:
                return self._random_sample_for_partitioned_tables()

            return self.table

        if self._profile_sample_query:
            return self._fetch_sample_data_with_query_object()

        # Add new RandomNumFn column
        rnd = self.get_sample_query()

        # Prepare sampled CTE
        sampled = (
            self.session.query(rnd)
            .where(rnd.c.random <= self.profile_sample)
            .cte(f"{self.table.__tablename__}_sample")
        )

        # Assign as an alias
        return aliased(self.table, sampled)

    def fetch_sample_data(self) -> TableData:
        """
        Use the sampler to retrieve 100 sample data rows
        :return: TableData to be added to the Table Entity
        """
        if self._profile_sample_query:
            return self._fetch_sample_data_from_user_query()

        # Add new RandomNumFn column
        rnd = self.get_sample_query()
        sqa_columns = [col for col in inspect(rnd).c if col.name != RANDOM_LABEL]

        sqa_sample = (
            self.session.query(*sqa_columns)
            .select_from(rnd)
            .limit(self.sample_limit)
            .all()
        )

        return TableData(
            columns=[column.name for column in sqa_columns],
            rows=[list(row) for row in sqa_sample],
        )

    def _fetch_sample_data_from_user_query(self) -> TableData:
        """Returns a table data object using results from query execution"""
        rnd = self.session.execute(f"{self._profile_sample_query}")
        try:
            columns = [col.name for col in rnd.cursor.description]
        except AttributeError:
            columns = list(rnd.keys())
        return TableData(
            columns=columns,
            rows=[list(row) for row in rnd.fetchmany(100)],
        )

    def _fetch_sample_data_with_query_object(self) -> Query:
        """Returns sql alchemy object to use when running profiling"""
        return self.session.query(self.table).from_statement(
            text(f"{self._profile_sample_query}")
        )

    def _random_sample_for_partitioned_tables(self) -> Query:
        """Return the Query object for partitioned tables"""
        partition_field = self._partition_details["partition_field"]
        if not self._partition_details.get("partition_values"):
            sample = (
                self.session.query(self.table)
                .filter(
                    column(partition_field)
                    >= self._partition_details["partition_start"].strftime("%Y-%m-%d"),
                    column(partition_field)
                    <= self._partition_details["partition_end"].strftime("%Y-%m-%d"),
                )
                .subquery()
            )
            return aliased(self.table, sample)
        sample = (
            self.session.query(self.table)
            .filter(
                column(partition_field).in_(self._partition_details["partition_values"])
            )
            .subquery()
        )
        return aliased(self.table, sample)
