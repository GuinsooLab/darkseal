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

import { getByTestId, getByText, render } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import {
  Column,
  DataType,
  LabelType,
  State,
  Table,
  TagSource,
} from '../../generated/entity/data/table';
import SchemaTab from './SchemaTab.component';
const mockColumns: Column[] = [
  {
    name: 'testId',
    dataType: DataType.String,
    description: 'string',
    fullyQualifiedName: 'string',
    tags: [
      {
        tagFQN: 'string',
        labelType: LabelType.Manual,
        source: TagSource.Classification,
        state: State.Confirmed,
      },
      {
        tagFQN: 'string2',
        labelType: LabelType.Derived,
        source: TagSource.Classification,
        state: State.Confirmed,
      },
    ],
    ordinalPosition: 2,
  },
];

const mockjoins = [
  {
    columnName: 'testId',
    joinedWith: [{ fullyQualifiedName: 'joinedTable', joinCount: 1 }],
  },
];

const mockUpdate = jest.fn();

const mockSampleData = {
  columns: ['column1', 'column2', 'column3'],
  rows: [
    ['row1', 'row2', 'row3'],
    ['row1', 'row2', 'row3'],
    ['row1', 'row2', 'row3'],
  ],
};

jest.mock('../SampleDataTable/SampleDataTable.component', () => {
  return jest.fn().mockReturnValue(<p>SampleDataTable</p>);
});

jest.mock('../EntityTable/EntityTable.component', () => {
  return jest.fn().mockReturnValue(<p>EntityTableV1</p>);
});

const mockTableConstraints = [
  {
    constraintType: 'PRIMARY_KEY',
    columns: ['address_id', 'shop_id'],
  },
] as Table['tableConstraints'];

describe('Test SchemaTab Component', () => {
  it('Renders all the parts of the schema tab', () => {
    const { queryByTestId, container } = render(
      <SchemaTab
        hasDescriptionEditAccess
        hasTagEditAccess
        columnName="columnName"
        columns={mockColumns}
        joins={mockjoins}
        sampleData={mockSampleData}
        tableConstraints={mockTableConstraints}
        onUpdate={mockUpdate}
      />,
      {
        wrapper: MemoryRouter,
      }
    );
    const searchBar = getByTestId(container, 'search-bar-container');

    expect(searchBar).toBeInTheDocument();

    const schemaTable = getByText(container, /EntityTable/i);

    expect(schemaTable).toBeInTheDocument();
    expect(queryByTestId('sample-data-table')).toBeNull();
  });
});
