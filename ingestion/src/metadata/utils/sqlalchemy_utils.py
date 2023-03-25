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
Module for sqlalchmey dialect utils
"""

from typing import Dict, Optional, Tuple

from sqlalchemy.engine import Engine, reflection


@reflection.cache
def get_all_table_comments(self, connection, query):
    """
    Method to fetch comment of all available tables
    """
    self.all_table_comments: Dict[Tuple[str, str], str] = {}
    self.current_db: str = connection.engine.url.database
    result = connection.execute(query)
    for table in result:
        self.all_table_comments[(table.table_name, table.schema)] = table.table_comment


def get_table_comment_wrapper(self, connection, query, table_name, schema=None):
    if (
        not hasattr(self, "all_table_comments")
        or self.current_db != connection.engine.url.database
    ):
        self.get_all_table_comments(connection, query)
    return {"text": self.all_table_comments.get((table_name, schema))}


@reflection.cache
def get_all_view_definitions(self, connection, query):
    """
    Method to fetch view definition of all available views
    """
    self.all_view_definitions: Dict[Tuple[str, str], str] = {}
    self.current_db: str = connection.engine.url.database
    result = connection.execute(query)
    for view in result:
        self.all_view_definitions[(view.view_name, view.schema)] = view.view_def


def get_view_definition_wrapper(self, connection, query, table_name, schema=None):
    if (
        not hasattr(self, "all_view_definitions")
        or self.current_db != connection.engine.url.database
    ):
        self.get_all_view_definitions(connection, query)
    return self.all_view_definitions.get((table_name, schema), "")


def get_schema_descriptions(engine: Engine, query: str):
    results = engine.execute(query).all()
    schema_desc_map = {}
    for row in results:
        schema_desc_map[row.schema_name] = row.comment
    return schema_desc_map


def is_complex_type(col_type: str):
    return (
        col_type.lower().startswith("array")
        or col_type.lower().startswith("map")
        or col_type.lower().startswith("struct")
        or col_type.lower().startswith("row")
    )


def get_display_datatype(
    col_type: str,
    char_len: Optional[int],
    precision: Optional[int],
    scale: Optional[int],
):
    if char_len or (precision is not None and scale is None):
        length = char_len or scale
        return f"{col_type}({str(length)})"
    if scale is not None and precision is not None:
        return f"{col_type}({str(precision)},{str(scale)})"
    return col_type
