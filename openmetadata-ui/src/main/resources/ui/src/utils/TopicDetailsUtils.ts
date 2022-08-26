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

import { TabSpecificField } from '../enums/entity.enum';

export const topicDetailsTabs = [
  {
    name: 'Schema',
    path: 'schema',
  },
  {
    name: 'Activity Feed & Tasks',
    path: 'activity_feed',
    field: TabSpecificField.ACTIVITY_FEED,
  },
  {
    name: 'Sample Data',
    path: 'sample_data',
    field: TabSpecificField.SAMPLE_DATA,
  },
  {
    name: 'Config',
    path: 'config',
  },
  {
    name: 'Lineage',
    path: 'lineage',
    field: TabSpecificField.LINEAGE,
  },
  {
    name: 'Manage',
    path: 'manage',
  },
];

export const getCurrentTopicTab = (tab: string) => {
  let currentTab = 1;
  switch (tab) {
    case 'activity_feed':
      currentTab = 2;

      break;
    case 'sample_data':
      currentTab = 3;

      break;
    case 'config':
      currentTab = 4;

      break;
    case 'lineage':
      currentTab = 5;

      break;
    case 'manage':
      currentTab = 6;

      break;

    case 'schema':
    default:
      currentTab = 1;

      break;
  }

  return currentTab;
};
