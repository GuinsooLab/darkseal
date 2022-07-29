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

import { IngestionType, ServiceCategory } from '../../enums/service.enum';
import { DatabaseService } from '../../generated/entity/services/databaseService';
import { IngestionPipeline } from '../../generated/entity/services/ingestionPipelines/ingestionPipeline';
import { EntityReference } from '../../generated/type/entityReference';
import { Paging } from '../../generated/type/paging';
import { ServiceDataObj } from '../../interface/service.interface';

export interface ConnectorConfig {
  username: string;
  password: string;
  host: string;
  database: string;
  includeFilterPattern: Array<string>;
  excludeFilterPattern: Array<string>;
  includeViews: boolean;
  excludeDataProfiler?: boolean;
  enableDataProfiler?: boolean;
}
export interface IngestionData {
  id?: string;
  name: string;
  displayName: string;
  ingestionType: IngestionType;
  service: EntityReference;
  scheduleInterval: string;
  ingestionStatuses?: Array<{
    state: string;
    startDate: string;
    endDate: string;
  }>;
  nextExecutionDate?: string;
  connectorConfig?: ConnectorConfig;
  owner?: { id: string; name?: string; type: string };
  startDate?: string;
  endDate?: string;
}

export interface IngestionProps {
  airflowEndpoint: string;
  serviceDetails: ServiceDataObj;
  serviceName: string;
  serviceCategory: ServiceCategory;
  isRequiredDetailsAvailable: boolean;
  paging: Paging;
  ingestionList: Array<IngestionPipeline>;
  serviceList: Array<DatabaseService>;
  currrentPage: number;
  pagingHandler: (value: string | number, activePage?: number) => void;
  deleteIngestion: (id: string, displayName: string) => Promise<void>;
  deployIngestion: (id: string) => Promise<void>;
  handleEnableDisableIngestion: (id: string) => void;
  triggerIngestion: (id: string, displayName: string) => Promise<void>;
  onIngestionWorkflowsUpdate: () => void;
}
