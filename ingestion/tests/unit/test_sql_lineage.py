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
sql lineage utils tests
"""
import uuid
from unittest import TestCase

from metadata.generated.schema.entity.data.table import Table
from metadata.ingestion.lineage.parser import LineageParser
from metadata.ingestion.lineage.sql_lineage import (
    get_column_lineage,
    populate_column_lineage_map,
)

QUERY = [
    "CREATE TABLE MYTABLE2 AS SELECT * FROM MYTABLE1;",
    "CREATE TABLE MYTABLE3 AS SELECT ID, NAME FROM MYTABLE1",
    "CREATE VIEW MYVIEW2 AS SELECT NAME, CITY FROM MYTABLE1;",
    "INSERT INTO MYTABLE5 SELECT ID, NAME, CITY FROM MYTABLE1;",
]
EXPECTED_LINEAGE_MAP = [
    {"<default>.mytable2": {"<default>.mytable1": [("*", "*")]}},
    {"<default>.mytable3": {"<default>.mytable1": [("ID", "ID"), ("NAME", "NAME")]}},
    {"<default>.myview2": {"<default>.mytable1": [("CITY", "CITY"), ("NAME", "NAME")]}},
    {
        "<default>.mytable5": {
            "<default>.mytable1": [("CITY", "CITY"), ("ID", "ID"), ("NAME", "NAME")]
        }
    },
]


class SqlLineageTest(TestCase):
    def test_populate_column_lineage_map(self):

        for i in range(len(QUERY)):
            lineage_parser = LineageParser(QUERY[i])
            raw_column_lineage = lineage_parser.column_lineage
            lineage_map = populate_column_lineage_map(raw_column_lineage)
            self.assertEqual(lineage_map, EXPECTED_LINEAGE_MAP[i])

    def test_get_column_lineage_select_all(self):
        # Given
        column_lineage_map = {
            "testdb.public.target": {"testdb.public.users": [("*", "*")]}
        }
        to_entity = Table(
            id=uuid.uuid4(),
            name="target",
            fullyQualifiedName="testdb.public.target",
            columns=[
                {
                    "name": "id",
                    "dataType": "NUMBER",
                    "fullyQualifiedName": "testdb.public.target.id",
                },
                {
                    "name": "otherCol",
                    "dataType": "NUMBER",
                    "fullyQualifiedName": "testdb.public.target.otherCol",
                },
            ],
        )
        from_entity = Table(
            id=uuid.uuid4(),
            name="users",
            fullyQualifiedName="testdb.public.users",
            columns=[
                {
                    "name": "id",
                    "dataType": "NUMBER",
                    "fullyQualifiedName": "testdb.public.users.id",
                }
            ],
        )
        # When
        col_lineage = get_column_lineage(
            to_entity=to_entity,
            to_table_raw_name="testdb.public.target",
            from_entity=from_entity,
            from_table_raw_name="testdb.public.users",
            column_lineage_map=column_lineage_map,
        )
        # Then
        assert len(col_lineage) == 1

    def test_populate_column_lineage_map_select_all(self):
        # Given
        query = """CREATE TABLE TESTDB.PUBLIC.TARGET AS  
        SELECT * FROM TESTDB.PUBLIC.USERS
        ;
        """
        lineage_parser = LineageParser(query)
        raw_column_lineage = lineage_parser.column_lineage
        # When
        lineage_map = populate_column_lineage_map(raw_column_lineage)
        # Then
        self.assertEqual(
            lineage_map, {"testdb.public.target": {"testdb.public.users": [("*", "*")]}}
        )

    def test_populate_column_lineage_map_ctes(self):
        # Given
        query = """CREATE TABLE TESTDB.PUBLIC.TARGET AS 
         WITH cte_table AS (
           SELECT
             USERS.ID,
             USERS.NAME
           FROM TESTDB.PUBLIC.USERS
        ),
        cte_table2 AS (
           SELECT
              ID,
              NAME
           FROM cte_table
        )        
        SELECT 
          ID,
          NAME
        FROM cte_table2
        ;
        """
        lineage_parser = LineageParser(query)
        raw_column_lineage = lineage_parser.column_lineage
        # When
        lineage_map = populate_column_lineage_map(raw_column_lineage)
        # Then
        self.assertEqual(
            lineage_map,
            {
                "testdb.public.target": {
                    "testdb.public.users": [("ID", "ID"), ("NAME", "NAME")]
                }
            },
        )
