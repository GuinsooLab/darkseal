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

import React, { CSSProperties, Fragment } from 'react';
import { Handle, HandleType, NodeProps, Position } from 'reactflow';
import { EntityLineageNodeType } from '../../enums/entity.enum';

const handleStyles = {
  width: '8px',
  height: '8px',
  borderRadius: '50%',
  position: 'absolute',
  top: 10,
};

const renderHandle = (position: Position, isConnectable: boolean) => {
  const styles = { ...handleStyles } as CSSProperties;
  let type: HandleType;
  if (position === Position.Left) {
    type = 'target';
  } else {
    type = 'source';
  }

  return (
    <Handle
      isConnectable={isConnectable}
      position={position}
      style={styles}
      type={type}
    />
  );
};

const getHandle = (nodeType: string, isConnectable: boolean) => {
  if (nodeType === EntityLineageNodeType.OUTPUT) {
    return renderHandle(Position.Left, isConnectable);
  } else if (nodeType === EntityLineageNodeType.INPUT) {
    return renderHandle(Position.Right, isConnectable);
  } else {
    return (
      <Fragment>
        {renderHandle(Position.Left, isConnectable)}
        {renderHandle(Position.Right, isConnectable)}
      </Fragment>
    );
  }
};

const TaskNode = (props: NodeProps) => {
  const { data, type, isConnectable } = props;
  const { label } = data;

  return (
    <div className="task-node tw-relative nowheel tw-px-2 tw-bg-primary-lite tw-border tw-border-primary-hover tw-rounded-md">
      {getHandle(type, isConnectable)}
      {/* Node label could be simple text or reactNode */}
      <div className="tw-px-2 tw-py-3" data-testid="node-label">
        {label}
      </div>
    </div>
  );
};

export default TaskNode;
