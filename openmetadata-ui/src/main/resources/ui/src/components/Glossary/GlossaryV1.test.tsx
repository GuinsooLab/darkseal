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
  act,
  findByText,
  getByTestId,
  queryByText,
  render,
  screen,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoadingState } from 'Models';
import React from 'react';
import {
  mockedGlossaries,
  mockedGlossaryTerms,
} from '../../mocks/Glossary.mock';
import GlossaryV1 from './GlossaryV1.component';
import { GlossaryV1Props } from './GlossaryV1.interfaces';

let params = {
  glossaryName: 'GlossaryName',
  action: '',
};

const mockPush = jest.fn();

jest.mock('../PermissionProvider/PermissionProvider', () => ({
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

jest.mock('../../utils/PermissionsUtils', () => ({
  checkPermission: jest.fn().mockReturnValue(true),
  DEFAULT_ENTITY_PERMISSION: {
    Create: true,
    Delete: true,
    ViewAll: true,
    EditAll: true,
    EditDescription: true,
    EditDisplayName: true,
    EditCustomFields: true,
  },
}));

jest.mock('react-router-dom', () => ({
  useHistory: jest.fn().mockImplementation(() => ({
    push: mockPush,
  })),
  useParams: jest.fn().mockImplementation(() => params),
  Link: jest.fn().mockImplementation(({ children }) => <a>{children}</a>),
}));

jest.mock('components/GlossaryDetails/GlossaryDetails.component', () => {
  return jest.fn().mockReturnValue(<>Glossary-Details component</>);
});

jest.mock('components/GlossaryTerms/GlossaryTermsV1.component', () => {
  return jest.fn().mockReturnValue(<>Glossary-Term component</>);
});

jest.mock('../common/title-breadcrumb/title-breadcrumb.component', () => {
  return jest.fn().mockReturnValue(<>TitleBreadcrumb</>);
});

jest.mock('../common/title-breadcrumb/title-breadcrumb.component', () =>
  jest.fn().mockReturnValue(<div>Breadcrumb</div>)
);

jest.mock('../Modals/EntityDeleteModal/EntityDeleteModal', () =>
  jest.fn().mockReturnValue(<div>Entity Delete Modal</div>)
);
jest.mock('../common/ProfilePicture/ProfilePicture', () =>
  jest.fn().mockReturnValue(<span>U</span>)
);
jest.mock('../../utils/TimeUtils', () => ({
  formatDateTime: jest.fn().mockReturnValue('Jan 15, 1970, 12:26 PM'),
}));

jest.mock('./ExportGlossaryModal/ExportGlossaryModal', () =>
  jest
    .fn()
    .mockReturnValue(
      <div data-testid="export-glossary">ExportGlossaryModal</div>
    )
);

jest.mock('./ImportGlossary/ImportGlossary', () =>
  jest
    .fn()
    .mockReturnValue(<div data-testid="import-glossary">ImportGlossary</div>)
);

const mockProps: GlossaryV1Props = {
  deleteStatus: 'initial' as LoadingState,
  selectedData: mockedGlossaries[0],
  isGlossaryActive: true,
  handleGlossaryTermUpdate: jest.fn(),
  updateGlossary: jest.fn(),
  onGlossaryDelete: jest.fn(),
  onGlossaryTermDelete: jest.fn(),
};

describe('Test Glossary component', () => {
  it('Should render Glossary header', async () => {
    await act(async () => {
      const { container } = render(<GlossaryV1 {...mockProps} />);

      const header = getByTestId(container, 'header');

      expect(header).toBeInTheDocument();
    });
  });

  it('Should render Glossary-details', async () => {
    const { container } = render(<GlossaryV1 {...mockProps} />);

    const glossaryDetails = await findByText(
      container,
      /Glossary-Details component/i
    );

    const glossaryTerm = await queryByText(
      container,
      /Glossary-Term component/i
    );

    expect(glossaryDetails).toBeInTheDocument();
    expect(glossaryTerm).not.toBeInTheDocument();
  });

  it('Should render Glossary-term', async () => {
    const { container } = render(
      <GlossaryV1
        {...mockProps}
        isGlossaryActive={false}
        selectedData={mockedGlossaryTerms[0]}
      />
    );

    const glossaryTerm = await findByText(
      container,
      /Glossary-Term component/i
    );

    const glossaryDetails = await queryByText(
      container,
      /Glossary-Details component/i
    );

    expect(glossaryTerm).toBeInTheDocument();
    expect(glossaryDetails).not.toBeInTheDocument();
  });

  it('Should render import glossary component', async () => {
    params = { ...params, action: 'import' };

    await act(async () => {
      const { container } = render(<GlossaryV1 {...mockProps} />);

      const importGlossary = getByTestId(container, 'import-glossary');

      expect(importGlossary).toBeInTheDocument();
    });
  });

  it('Should render export glossary component', async () => {
    params = { ...params, action: 'export' };
    await act(async () => {
      const { container } = render(<GlossaryV1 {...mockProps} />);

      const exportGlossary = getByTestId(container, 'export-glossary');

      expect(exportGlossary).toBeInTheDocument();
    });
  });

  it('Should render export and import option', async () => {
    await act(async () => {
      const { container } = render(<GlossaryV1 {...mockProps} />);

      const manageButton = getByTestId(container, 'manage-button');

      expect(manageButton).toBeInTheDocument();

      await act(async () => {
        userEvent.click(manageButton);
      });

      const exportOption = await screen.getByTestId('export-button');

      const importOption = await screen.getByTestId('import-button');

      expect(exportOption).toBeInTheDocument();
      expect(importOption).toBeInTheDocument();

      await act(async () => {
        userEvent.click(importOption);
      });

      expect(mockPush).toHaveBeenCalled();
    });
  });
});
