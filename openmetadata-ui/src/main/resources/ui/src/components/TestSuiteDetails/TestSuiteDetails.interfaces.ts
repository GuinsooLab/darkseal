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

import { ExtraInfo } from 'Models';
import { TestSuite } from '../../generated/tests/testSuite';
import { TitleBreadcrumbProps } from '../common/title-breadcrumb/title-breadcrumb.interface';
import { OperationPermission } from '../PermissionProvider/PermissionProvider.interface';

export interface TestSuiteDetailsProps {
  permissions: OperationPermission;
  extraInfo: ExtraInfo[];
  slashedBreadCrumb: TitleBreadcrumbProps['titleLinks'];
  handleDeleteWidgetVisible: (isVisible: boolean) => void;
  isDeleteWidgetVisible: boolean;
  isTagEditable?: boolean;
  isDescriptionEditable: boolean;
  testSuite: TestSuite | undefined;
  handleRemoveOwner: () => void;
  handleUpdateOwner: (updatedOwner: TestSuite['owner']) => void;
  testSuiteDescription: string | undefined;
  descriptionHandler: (value: boolean) => void;
  handleDescriptionUpdate: (updatedHTML: string) => Promise<void>;
}
