/*
 *  Copyright 2022 Collate.
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *  http://www.apache.org/licenses/LICENSE-2.0
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

export enum ConstraintTypes {
  PRIMARY_KEY = 'PRIMARY_KEY',
  NULL = 'NULL',
  NOT_NULL = 'NOT_NULL',
  UNIQUE = 'UNIQUE',
  FOREIGN_KEY = 'FOREIGN_KEY',
}

export enum PrimaryTableDataTypes {
  VARCHAR = 'varchar',
  TIMESTAMP = 'timestamp',
  DATE = 'date',
  NUMERIC = 'numeric',
  BOOLEAN = 'boolean',
}

export enum ProfilerDashboardType {
  TABLE = 'table',
  COLUMN = 'column',
}
