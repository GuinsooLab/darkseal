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

import { Operation } from 'fast-json-patch';

import { Pipeline, Task } from '../../generated/entity/data/pipeline';
import { EntityLineage } from '../../generated/type/entityLineage';
import { EntityReference } from '../../generated/type/entityReference';
import { Paging } from '../../generated/type/paging';
import { TitleBreadcrumbProps } from '../common/title-breadcrumb/title-breadcrumb.interface';
import {
  Edge,
  EdgeData,
  LeafNodes,
  LineagePos,
  LoadingNodeState,
} from '../EntityLineage/EntityLineage.interface';

export interface PipeLineDetailsProp {
  pipelineFQN: string;
  isNodeLoading: LoadingNodeState;
  lineageLeafNodes: LeafNodes;
  pipelineUrl: string;
  entityName: string;
  pipelineDetails: Pipeline;
  followers: Array<EntityReference>;
  slashedPipelineName: TitleBreadcrumbProps['titleLinks'];
  entityLineage: EntityLineage;
  tasks: Task[];
  paging: Paging;
  followPipelineHandler: () => void;
  unfollowPipelineHandler: () => void;
  settingsUpdateHandler: (updatedPipeline: Pipeline) => Promise<void>;
  descriptionUpdateHandler: (updatedPipeline: Pipeline) => Promise<void>;
  tagUpdateHandler: (updatedPipeline: Pipeline) => void;
  taskUpdateHandler: (patch: Array<Operation>) => Promise<void>;
  loadNodeHandler: (node: EntityReference, pos: LineagePos) => void;
  versionHandler: () => void;
  addLineageHandler: (edge: Edge) => Promise<void>;
  removeLineageHandler: (data: EdgeData) => void;
  entityLineageHandler: (lineage: EntityLineage) => void;
  onExtensionUpdate: (updatedPipeline: Pipeline) => Promise<void>;
}
