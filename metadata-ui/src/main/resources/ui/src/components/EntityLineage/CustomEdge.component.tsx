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

import React, { Fragment } from 'react';
import { EdgeProps, getBezierPath, getEdgeCenter } from 'react-flow-renderer';
import { foreignObjectSize } from '../../constants/Lineage.constants';
import SVGIcons from '../../utils/SvgUtils';
import { CustomEdgeData } from './EntityLineage.interface';

export const CustomEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
  selected,
}: EdgeProps) => {
  const { onEdgeClick, ...rest } = data;
  const offset = 4;

  const edgePath = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });
  const invisibleEdgePath = getBezierPath({
    sourceX: sourceX + offset,
    sourceY: sourceY + offset,
    sourcePosition,
    targetX: targetX + offset,
    targetY: targetY + offset,
    targetPosition,
  });
  const invisibleEdgePath1 = getBezierPath({
    sourceX: sourceX - offset,
    sourceY: sourceY - offset,
    sourcePosition,
    targetX: targetX - offset,
    targetY: targetY - offset,
    targetPosition,
  });

  const [edgeCenterX, edgeCenterY] = getEdgeCenter({
    sourceX,
    sourceY,
    targetX,
    targetY,
  });

  const getInvisiblePath = (path: string) => {
    return (
      <path
        className="react-flow__edge-path"
        d={path}
        data-testid="react-flow-edge-path"
        id={id}
        markerEnd={markerEnd}
        style={{ ...style, strokeWidth: '6px', opacity: 0 }}
      />
    );
  };

  return (
    <Fragment>
      <path
        className="react-flow__edge-path"
        d={edgePath}
        data-testid="react-flow-edge-path"
        id={id}
        markerEnd={markerEnd}
        style={style}
      />
      {getInvisiblePath(invisibleEdgePath)}
      {getInvisiblePath(invisibleEdgePath1)}

      {selected ? (
        <foreignObject
          data-testid="delete-button"
          height={foreignObjectSize}
          requiredExtensions="http://www.w3.org/1999/xhtml"
          width={foreignObjectSize}
          x={edgeCenterX - foreignObjectSize / offset}
          y={edgeCenterY - foreignObjectSize / offset}>
          <button
            className="tw-cursor-pointer tw-flex tw-z-9999"
            onClick={(event) => onEdgeClick?.(event, rest as CustomEdgeData)}>
            <SVGIcons
              alt="times-circle"
              icon="icon-times-circle"
              width="16px"
            />
          </button>
        </foreignObject>
      ) : null}
    </Fragment>
  );
};
