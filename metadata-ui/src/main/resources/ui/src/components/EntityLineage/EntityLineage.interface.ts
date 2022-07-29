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

import { LeafNodes, LineagePos, LoadingNodeState, LoadingState } from 'Models';
import { Edge as FlowEdge, Node } from 'react-flow-renderer';
import { Column } from '../../generated/entity/data/table';
import {
  EntityLineage,
  EntityReference,
} from '../../generated/type/entityLineage';

export interface SelectedNode {
  name: string;
  type: string;
  fqn: string;
  displayName?: string;
  id?: string;
  entityId: string;
}

export interface EntityLineageProp {
  isNodeLoading: LoadingNodeState;
  lineageLeafNodes: LeafNodes;
  entityLineage: EntityLineage;
  deleted?: boolean;
  isOwner?: boolean;
  isLoading?: boolean;
  loadNodeHandler: (node: EntityReference, pos: LineagePos) => void;
  addLineageHandler: (edge: Edge) => Promise<void>;
  removeLineageHandler: (data: EdgeData) => void;
  entityLineageHandler: (lineage: EntityLineage) => void;
}

export interface Edge {
  edge: {
    fromEntity: {
      id: string;
      type: string;
    };
    toEntity: {
      id: string;
      type: string;
    };
  };
}

export interface EdgeData {
  fromEntity: string;
  fromId: string;
  toEntity: string;
  toId: string;
}

export interface CustomEdgeData {
  id: string;
  source: string;
  target: string;
  sourceType: string;
  targetType: string;
  isColumnLineage: boolean;
  sourceHandle: string;
  targetHandle: string;
}

export interface SelectedEdge {
  id: string;
  source: EntityReference;
  target: EntityReference;
  data?: CustomEdgeData;
}

export type ElementLoadingState = Exclude<LoadingState, 'waiting'>;

export type CustomeElement = { node: Node[]; edge: FlowEdge[] };
export type CustomeFlow = Node | FlowEdge;
export type ModifiedColumn = Column & {
  type: string;
};
