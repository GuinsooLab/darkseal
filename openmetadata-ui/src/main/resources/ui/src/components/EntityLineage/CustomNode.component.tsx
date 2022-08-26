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

import classNames from 'classnames';
import { isEmpty } from 'lodash';
import React, { CSSProperties, Fragment, useEffect } from 'react';
import {
  Handle,
  HandleProps,
  NodeProps,
  Position,
  useUpdateNodeInternals,
} from 'react-flow-renderer';
import { EntityLineageNodeType } from '../../enums/entity.enum';
import { getNodeRemoveButton } from '../../utils/EntityLineageUtils';
import { getConstraintIcon } from '../../utils/TableUtils';
import { ModifiedColumn } from './EntityLineage.interface';

const handleStyles: CSSProperties = {
  width: '8px',
  height: '8px',
  borderRadius: '50%',
  position: 'absolute',
  top: 15,
};

const getHandle = (
  nodeType: string,
  isConnectable: HandleProps['isConnectable'],
  isNewNode = false,
  id?: string
) => {
  if (nodeType === EntityLineageNodeType.OUTPUT) {
    return (
      <Fragment>
        <Handle
          id={id}
          isConnectable={isConnectable}
          position={Position.Left}
          style={handleStyles}
          type="target"
        />
      </Fragment>
    );
  } else if (nodeType === EntityLineageNodeType.INPUT) {
    return (
      <Fragment>
        <Handle
          id={id}
          isConnectable={isConnectable}
          position={Position.Right}
          style={handleStyles}
          type="source"
        />
      </Fragment>
    );
  } else if (nodeType === EntityLineageNodeType.NOT_CONNECTED) {
    return null;
  } else {
    return (
      <Fragment>
        <Handle
          id={id}
          isConnectable={isConnectable}
          position={Position.Left}
          style={{
            ...handleStyles,

            top: isNewNode ? 13 : handleStyles.top,
          }}
          type="target"
        />
        <Handle
          id={id}
          isConnectable={isConnectable}
          position={Position.Right}
          style={{
            ...handleStyles,

            top: isNewNode ? 13 : handleStyles.top,
          }}
          type="source"
        />
      </Fragment>
    );
  }
};

const CustomNode = (props: NodeProps) => {
  const updateNodeInternals = useUpdateNodeInternals();
  const { data, type, isConnectable, selected, id } = props;
  /* eslint-disable-next-line */
  const {
    label,
    columns,
    isNewNode,
    removeNodeHandler,
    isEditMode,
    isExpanded,
  } = data;

  useEffect(() => {
    updateNodeInternals(id);
  }, [isEditMode, isExpanded]);

  return (
    <div className="nowheel">
      {/* Node label could be simple text or reactNode */}
      <div
        className="tw--mx-2 tw--my-0.5 tw-px-2 tw-bg-primary-lite tw-relative tw-border tw-border-primary-hover tw-rounded-md"
        data-testid="node-label">
        {getHandle(type, isConnectable, isNewNode)}
        {label}{' '}
        {selected && isEditMode
          ? getNodeRemoveButton(() => {
              removeNodeHandler?.(props);
            })
          : null}
      </div>

      {isExpanded && (
        <div
          className={classNames('tw-bg-border-lite-60 tw-border', {
            'tw-py-3': !isEmpty(columns),
          })}>
          <section className={classNames('tw-px-3')} id="table-columns">
            <div className="tw-flex tw-flex-col tw-gap-y-1 tw-relative">
              {(Object.values(columns || {}) as ModifiedColumn[])?.map(
                (c, i) => (
                  <div
                    className="tw-p-1 tw-rounded tw-border tw-text-grey-body tw-relative tw-bg-white"
                    data-testid="column"
                    key={i}>
                    {getHandle(
                      c.type,
                      isConnectable,
                      isNewNode,
                      c.fullyQualifiedName
                    )}
                    {getConstraintIcon(c.constraint, 'tw-')}
                    <p className="tw-m-0">{c.name}</p>
                  </div>
                )
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default CustomNode;
