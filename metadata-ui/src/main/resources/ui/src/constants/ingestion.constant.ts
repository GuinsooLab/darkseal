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

import { StepperStepType } from 'Models';
import { FilterPattern } from '../generated/entity/services/ingestionPipelines/ingestionPipeline';

export const STEPS_FOR_ADD_INGESTION: Array<StepperStepType> = [
  { name: 'Configure Ingestion', step: 1 },
  { name: 'Configure DBT', step: 2 },
  { name: 'Schedule Interval', step: 3 },
];

export const INGESTION_SCHEDULER_INITIAL_VALUE = '0 * * * *';

export const INITIAL_FILTER_PATTERN: FilterPattern = {
  includes: [],
  excludes: [],
};
