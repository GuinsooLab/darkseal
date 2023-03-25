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

import { findByTestId, findByText, render } from '@testing-library/react';
import React, { forwardRef } from 'react';
import { MemoryRouter } from 'react-router-dom';
import CreateUser from './CreateUser.component';
import { CreateUserProps } from './CreateUser.interface';

jest.mock(
  '../containers/PageLayout',
  () =>
    ({ children }: { children: React.ReactNode }) =>
      <div data-testid="PageLayout">{children}</div>
);

jest.mock('../dropdown/DropDown', () => {
  return jest.fn().mockReturnValue(<p>Dropdown component</p>);
});

jest.mock('../TeamsSelectable/TeamsSelectable', () => {
  return jest.fn().mockReturnValue(<p>TeamsSelectable component</p>);
});

jest.mock('../common/rich-text-editor/RichTextEditor', () => {
  return forwardRef(
    jest.fn().mockImplementation(({ initialValue }, ref) => {
      return <div ref={ref}>{initialValue}MarkdownWithPreview component</div>;
    })
  );
});

const propsValue: CreateUserProps = {
  saveState: 'initial',
  roles: [],
  forceBot: false,
  onSave: jest.fn(),
  onCancel: jest.fn(),
};

describe('Test CreateUser component', () => {
  it('CreateUser component should render properly', async () => {
    const { container } = render(<CreateUser {...propsValue} />, {
      wrapper: MemoryRouter,
    });

    const PageLayout = await findByTestId(container, 'PageLayout');
    const email = await findByTestId(container, 'email');
    const admin = await findByTestId(container, 'admin');
    const cancelButton = await findByTestId(container, 'cancel-user');
    const saveButton = await findByTestId(container, 'save-user');
    const description = await findByText(
      container,
      /MarkdownWithPreview component/i
    );
    const dropdown = await findByText(container, /Dropdown component/i);
    const teamsSelectable = await findByText(
      container,
      /TeamsSelectable component/i
    );

    expect(PageLayout).toBeInTheDocument();
    expect(email).toBeInTheDocument();
    expect(admin).toBeInTheDocument();
    expect(description).toBeInTheDocument();
    expect(dropdown).toBeInTheDocument();
    expect(teamsSelectable).toBeInTheDocument();
    expect(cancelButton).toBeInTheDocument();
    expect(saveButton).toBeInTheDocument();
  });
});
