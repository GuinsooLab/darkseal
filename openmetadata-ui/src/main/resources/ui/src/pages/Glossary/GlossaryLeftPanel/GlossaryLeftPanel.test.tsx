/*
 *  Copyright 2023 Collate.
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

import { act, fireEvent, render, screen } from '@testing-library/react';
import { mockedGlossaries } from 'mocks/Glossary.mock';
import React from 'react';
import GlossaryLeftPanel from './GlossaryLeftPanel.component';

const mockHistory = {
  push: jest.fn(),
};

jest.mock('react-router-dom', () => ({
  useHistory: jest.fn().mockImplementation(() => mockHistory),
  useParams: jest.fn().mockReturnValue({
    glossaryName: 'GlossaryName',
  }),
}));
jest.mock('components/PermissionProvider/PermissionProvider', () => ({
  usePermissionProvider: jest.fn().mockReturnValue({
    getEntityPermission: jest.fn().mockReturnValue({
      Create: true,
      Delete: true,
      ViewAll: true,
      EditAll: true,
      EditDescription: true,
      EditDisplayName: true,
      EditCustomFields: true,
    }),
    permissions: {
      glossaryTerm: {
        Create: true,
        Delete: true,
        ViewAll: true,
        EditAll: true,
        EditDescription: true,
        EditDisplayName: true,
        EditCustomFields: true,
      },
      glossary: {
        Create: true,
        Delete: true,
        ViewAll: true,
        EditAll: true,
        EditDescription: true,
        EditDisplayName: true,
        EditCustomFields: true,
      },
    },
  }),
}));

jest.mock('utils/PermissionsUtils', () => ({
  checkPermission: jest.fn().mockReturnValue(true),
}));

jest.mock('components/common/searchbar/Searchbar', () => {
  return jest
    .fn()
    .mockImplementation(({ searchValue, onSearch }) => (
      <input
        data-testid="search-box"
        type="text"
        value={searchValue}
        onChange={(e) => onSearch(e.target.value)}
      />
    ));
});
jest.mock('components/common/LeftPanelCard/LeftPanelCard', () => {
  return jest
    .fn()
    .mockImplementation(({ children }) => (
      <div data-testid="glossary-left-panel-container">{children}</div>
    ));
});

describe('Test GlossaryLeftPanel component', () => {
  it('GlossaryLeftPanel Page Should render', async () => {
    act(() => {
      render(<GlossaryLeftPanel glossaries={mockedGlossaries} />);
    });

    expect(
      await screen.findByTestId('glossary-left-panel-container')
    ).toBeInTheDocument();
    expect(await screen.findByTestId('search-box')).toBeInTheDocument();
    expect(await screen.findByTestId('add-glossary')).toBeInTheDocument();
    expect(
      await screen.findByTestId('glossary-left-panel')
    ).toBeInTheDocument();
    expect(await screen.findByText('label.glossary')).toBeInTheDocument();
    expect(
      await screen.findByText(mockedGlossaries[0].name)
    ).toBeInTheDocument();
  });

  it('Add Glossary button should work properly', async () => {
    act(() => {
      render(<GlossaryLeftPanel glossaries={mockedGlossaries} />);
    });

    const addButton = await screen.findByTestId('add-glossary');

    expect(addButton).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(addButton);
    });

    expect(mockHistory.push).toHaveBeenCalledTimes(1);
  });

  it('Search functionality should work properly', async () => {
    const searchTerm = 'testSearch';
    act(() => {
      render(<GlossaryLeftPanel glossaries={mockedGlossaries} />);
    });

    const searchbox = await screen.findByTestId('search-box');

    expect(searchbox).toBeInTheDocument();

    await act(async () => {
      fireEvent.change(searchbox, { target: { value: searchTerm } });
    });

    expect(
      await screen.findByText('message.no-entity-found-for-name')
    ).toBeInTheDocument();

    await act(async () => {
      fireEvent.change(searchbox, { target: { value: '' } });
    });

    expect(
      await screen.findByText(mockedGlossaries[0].name)
    ).toBeInTheDocument();
  });

  it('Menu click should work properly', async () => {
    act(() => {
      render(<GlossaryLeftPanel glossaries={mockedGlossaries} />);
    });

    const menuItem = await screen.findByText(mockedGlossaries[0].name);

    expect(menuItem).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(menuItem);
    });

    expect(mockHistory.push).toHaveBeenCalledTimes(1);
  });
});
