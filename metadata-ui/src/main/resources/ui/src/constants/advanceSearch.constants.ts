/*
 *  Copyright 2021 Collate
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

export const COMMON_DROPDOWN_ITEMS = [
  {
    label: 'Owner',
    key: 'owner.name',
  },
  {
    label: 'Tag',
    key: 'tags',
  },
  {
    label: 'Service',
    key: 'service.name',
  },
];

export const TABLE_DROPDOWN_ITEMS = [
  {
    label: 'Column',
    key: 'columns.name',
  },

  {
    label: 'Schema',
    key: 'databaseSchema.name',
  },
  {
    label: 'Database',
    key: 'database.name',
  },
];

export const DASHBOARD_DROPDOWN_ITEMS = [
  {
    label: 'Chart',
    key: 'charts.displayName',
  },
];

export const PIPELINE_DROPDOWN_ITEMS = [
  {
    label: 'Task',
    key: 'tasks.displayName',
  },
];

export const ALL_DROPDOWN_ITEMS = [
  ...COMMON_DROPDOWN_ITEMS,
  ...TABLE_DROPDOWN_ITEMS,
  ...DASHBOARD_DROPDOWN_ITEMS,
  ...PIPELINE_DROPDOWN_ITEMS,
];

export const MISC_FIELDS = ['owner.name', 'tags'];
