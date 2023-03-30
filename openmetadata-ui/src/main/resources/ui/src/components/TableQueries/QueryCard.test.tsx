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
  findByTestId,
  findByText,
  // getByTestId,
  queryByTestId,
  render,
} from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import QueryCard from './QueryCard';

const mockQueryData = {
  query: 'select products from raw_product_catalog',
  duration: 0.309,
  users: [
    {
      id: 'd4785e53-bbdb-4dbd-b368-009fdb50c2c6',
      type: 'user',
      name: 'aaron_johnson0',
      displayName: 'Aaron Johnson',
      href: 'http://localhost:8585/api/v1/users/d4785e53-bbdb-4dbd-b368-009fdb50c2c6',
    },
  ],
  vote: 1,
  checksum: '0232b0368458aadb29230ccc531462c9',
};

jest.mock('../schema-editor/SchemaEditor', () => {
  return jest.fn().mockReturnValue(<p>SchemaEditor</p>);
});

jest.mock('../buttons/CopyToClipboardButton/CopyToClipboardButton', () => {
  return jest.fn().mockReturnValue(<>CopyToClipboardButton</>);
});

describe('Test QueryCard Component', () => {
  it('Check if QueryCard has all child elements', async () => {
    const { container } = render(<QueryCard query={mockQueryData} />, {
      wrapper: MemoryRouter,
    });
    // const queryHeader = getByTestId(container, 'query-header');
    const query = await findByText(container, /SchemaEditor/i);
    const copyQueryButton = await findByText(
      container,
      /CopyToClipboardButton/i
    );

    const expandButton = await findByTestId(
      container,
      'expand-collapse-button'
    );

    // expect(queryHeader).toBeInTheDocument();
    expect(query).toBeInTheDocument();
    expect(copyQueryButton).toBeInTheDocument();
    expect(expandButton).toBeInTheDocument();
  });

  it('Should not render header if user is undefined', async () => {
    const { container } = render(
      <QueryCard query={{ ...mockQueryData, users: undefined }} />,
      {
        wrapper: MemoryRouter,
      }
    );
    const queryHeader = queryByTestId(container, 'query-header');

    expect(queryHeader).not.toBeInTheDocument();
  });

  it('Should not render header if duration is undefined', async () => {
    const { container } = render(
      <QueryCard query={{ ...mockQueryData, duration: undefined }} />,
      {
        wrapper: MemoryRouter,
      }
    );
    const queryHeader = queryByTestId(container, 'query-header');

    expect(queryHeader).not.toBeInTheDocument();
  });
});
