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

import { findByTestId, render } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import DeleteConfirmationModal from './DeleteConfirmationModal';

jest.mock('../../Modals/ConfirmationModal/ConfirmationModal', () => {
  return jest
    .fn()
    .mockReturnValue(
      <div data-testid="confirmation-modal">ConfirmartionModal</div>
    );
});

const mockProp = {
  onDiscard: jest.fn(),
  onDelete: jest.fn(),
  visible: false,
};

describe('Test Delete Confirmation Modal Component', () => {
  it('Should render confirmation component', async () => {
    const { container } = render(
      <DeleteConfirmationModal {...mockProp} visible />,
      {
        wrapper: MemoryRouter,
      }
    );

    const conFirmationModal = await findByTestId(
      container,
      'confirmation-modal'
    );

    expect(conFirmationModal).toBeInTheDocument();
  });
});
