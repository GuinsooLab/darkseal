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

import { TableDetail } from 'Models';
import { EntityReference } from '../../generated/type/entityReference';

export interface ManageProps {
  currentTier?: string;
  currentUser?: EntityReference;
  manageSectionType?: string;
  hideTier?: boolean;
  hideOwner?: boolean;
  isJoinable?: boolean;
  allowSoftDelete?: boolean;
  onSave?: (
    owner?: EntityReference,
    tier?: TableDetail['tier'],
    isJoinable?: boolean
  ) => Promise<void>;
  handleIsJoinable?: (bool: boolean) => void;
  afterDeleteAction?: () => void;
  hasEditAccess: boolean;
  allowTeamOwner?: boolean;
  entityId?: string;
  entityName?: string;
  entityType?: string;
  allowDelete?: boolean;
  isRecursiveDelete?: boolean;
  deletEntityMessage?: string;
}

export type Status = 'initial' | 'waiting' | 'success';
