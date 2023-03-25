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

import { getByText, render } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router';
import DashboardDetailsPage from './DashboardDetailsPage.component';

jest.mock('./DashboardDetailsPage.component', () => {
  return jest.fn().mockReturnValue(<div>DashboardDetails Page</div>);
});

describe('Test DashboardDetails page', () => {
  it('Component should render', async () => {
    const { container } = render(<DashboardDetailsPage />, {
      wrapper: MemoryRouter,
    });
    const ContainerText = getByText(container, 'DashboardDetails Page');

    expect(ContainerText).toBeInTheDocument();
  });
});
