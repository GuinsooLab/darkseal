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

import {
  findAllByTestId,
  findByTestId,
  queryByTestId,
  render,
} from '@testing-library/react';
import React from 'react';
import { EdgeProps, Position } from 'react-flow-renderer';
import { MemoryRouter } from 'react-router-dom';
import { CustomEdge } from './CustomEdge.component';

jest.mock('../../constants/Lineage.constants', () => ({
  foreignObjectSize: 40,
}));

const mockCustomEdgeProp = {
  id: 'id1',
  sourceX: 20,
  sourceY: 20,
  targetX: 20,
  targetY: 20,
  sourcePosition: Position.Left,
  targetPosition: Position.Right,
  style: {},
  markerEnd: '',
  data: {
    source: 'node1',
    target: 'node2',
    onEdgeClick: jest.fn(),
    selectedNode: {
      id: 'node1',
    },
  },
  selected: true,
} as EdgeProps;

describe('Test CustomEdge Component', () => {
  it('Check if CustomEdge has all child elements', async () => {
    const { container } = render(<CustomEdge {...mockCustomEdgeProp} />, {
      wrapper: MemoryRouter,
    });

    const deleteButton = await findByTestId(container, 'delete-button');
    const edgePathElement = await findAllByTestId(
      container,
      'react-flow-edge-path'
    );

    expect(deleteButton).toBeInTheDocument();
    expect(edgePathElement).toHaveLength(edgePathElement.length);
  });

  it('Check if CustomEdge has selected as false', async () => {
    const { container } = render(
      <CustomEdge {...mockCustomEdgeProp} selected={false} />,
      {
        wrapper: MemoryRouter,
      }
    );

    const edgePathElement = await findAllByTestId(
      container,
      'react-flow-edge-path'
    );

    const deleteButton = queryByTestId(container, 'delete-button');

    expect(deleteButton).not.toBeInTheDocument();
    expect(edgePathElement).toHaveLength(edgePathElement.length);
  });
});
