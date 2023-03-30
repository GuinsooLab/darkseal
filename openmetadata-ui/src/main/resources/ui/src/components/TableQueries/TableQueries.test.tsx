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

import {
  findAllByText,
  findByTestId,
  queryAllByText,
  render,
} from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { MOCK_TABLE } from '../../mocks/TableData.mock';
import TableQueries from './TableQueries';

const mockTableQueriesProp = {
  tableId: 'id',
};

jest.mock('./QueryCard', () => {
  return jest.fn().mockReturnValue(<p>QueryCard</p>);
});
jest.mock('rest/tableAPI', () => ({
  getTableQueryByTableId: jest
    .fn()
    .mockImplementation(() => Promise.resolve(MOCK_TABLE)),
}));

describe('Test TableQueries Component', () => {
  it('Check if TableQueries component has all child elements', async () => {
    const { container } = render(<TableQueries {...mockTableQueriesProp} />, {
      wrapper: MemoryRouter,
    });
    const queriesContainer = await findByTestId(container, 'queries-container');

    expect(queriesContainer).toBeInTheDocument();
  });

  it('Check if TableQueries component has n query card', async () => {
    const queriesLength = MOCK_TABLE.tableQueries?.length || 0;
    const { container } = render(<TableQueries {...mockTableQueriesProp} />, {
      wrapper: MemoryRouter,
    });
    const queriesContainer = await findByTestId(container, 'queries-container');
    const queryCards = await findAllByText(queriesContainer, /QueryCard/i);

    expect(queriesContainer).toBeInTheDocument();
    expect(queryCards).toHaveLength(queriesLength);
  });

  it('Check if TableQueries component has queries as undefined', async () => {
    const { container } = render(
      <TableQueries {...mockTableQueriesProp} queries={undefined} />,
      {
        wrapper: MemoryRouter,
      }
    );
    const queryCards = queryAllByText(container, /QueryCard/i);

    expect(queryCards).toHaveLength(0);
  });

  it('Check if TableQueries component has queries as empty list', async () => {
    const { container } = render(
      <TableQueries {...mockTableQueriesProp} queries={[]} />,
      {
        wrapper: MemoryRouter,
      }
    );
    const queryCards = queryAllByText(container, /QueryCard/i);

    expect(queryCards).toHaveLength(0);
  });
});
