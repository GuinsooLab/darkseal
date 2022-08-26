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

import { findByText, getByTestId, render } from '@testing-library/react';
import React from 'react';
import { mockedGlossaries } from '../../mocks/Glossary.mock';
import GlossaryDetails from './GlossaryDetails.component';

jest.mock('react-router-dom', () => ({
  useHistory: jest.fn(),
  useParams: jest.fn().mockReturnValue({
    glossaryName: 'GlossaryName',
  }),
}));

jest.mock('../../authentication/auth-provider/AuthProvider', () => {
  return {
    useAuthContext: jest.fn(() => ({
      isAuthDisabled: false,
      isAuthenticated: true,
      isProtectedRoute: jest.fn().mockReturnValue(true),
      isTourRoute: jest.fn().mockReturnValue(false),
      onLogoutHandler: jest.fn(),
    })),
  };
});

jest.mock('../../components/tags-container/tags-container', () => {
  return jest.fn().mockReturnValue(<>Tags-container component</>);
});

jest.mock('../../components/common/description/DescriptionV1', () => {
  return jest.fn().mockReturnValue(<>Description component</>);
});

jest.mock('../../components/common/non-admin-action/NonAdminAction', () => {
  return jest
    .fn()
    .mockImplementation(({ children }: { children: React.ReactNode }) => (
      <>{children}</>
    ));
});

jest.mock('../common/rich-text-editor/RichTextEditorPreviewer', () => {
  return jest.fn().mockReturnValue(<p>RichTextEditorPreviewer</p>);
});

jest.mock('../common/ProfilePicture/ProfilePicture', () => {
  return jest.fn().mockReturnValue(<p>ProfilePicture</p>);
});

const mockProps = {
  glossary: mockedGlossaries[0],
  isHasAccess: true,
  updateGlossary: jest.fn(),
};

describe('Test Glossary-details component', () => {
  it('Should render Glossary-details component', () => {
    const { container } = render(<GlossaryDetails {...mockProps} />);

    const glossaryDetails = getByTestId(container, 'glossary-details');

    expect(glossaryDetails).toBeInTheDocument();
  });

  it('Should render Tags-container', async () => {
    const { container } = render(<GlossaryDetails {...mockProps} />);

    const tagsContainer = await findByText(
      container,
      /Tags-container component/i
    );

    expect(tagsContainer).toBeInTheDocument();
  });

  it('Should render Description', async () => {
    const { container } = render(<GlossaryDetails {...mockProps} />);

    const description = await findByText(container, /Description component/i);

    expect(description).toBeInTheDocument();
  });
});
