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

import { ServiceCategory } from '../../enums/service.enum';
import { CreateIngestionPipeline } from '../../generated/api/services/ingestionPipelines/createIngestionPipeline';
import { DataObj } from '../../interface/service.interface';
import { TitleBreadcrumbProps } from '../common/title-breadcrumb/title-breadcrumb.interface';

export interface AddServiceProps {
  serviceCategory: ServiceCategory;
  addIngestion: boolean;
  onAddServiceSave: (service: DataObj) => Promise<void>;
  handleAddIngestion: (value: boolean) => void;
  onAddIngestionSave: (ingestion: CreateIngestionPipeline) => Promise<void>;
  newServiceData: DataObj | undefined;
  isIngestionDeployed: boolean;
  isIngestionCreated: boolean;
  ingestionProgress: number;
  ingestionAction: string;
  showDeployButton?: boolean;
  slashedBreadcrumb: TitleBreadcrumbProps['titleLinks'];
  onIngestionDeploy?: () => Promise<void>;
  onAirflowStatusCheck: () => Promise<void>;
}
