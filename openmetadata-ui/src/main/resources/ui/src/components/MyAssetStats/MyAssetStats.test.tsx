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

import { getAllByTestId, getByTestId, render } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router';
import { getTeamAndUserDetailsPath } from '../../constants/constants';
import { UserType } from '../../enums/user.enum';
import MyAssetStats from './MyAssetStats.component';

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

const mockProp = {
  countDashboards: 10,
  countPipelines: 3,
  countServices: 193,
  countTables: 40,
  countTeams: 7,
  countTopics: 13,
  countUsers: 100,
  countMlModal: 2,
};

describe('Test MyDataHeader Component', () => {
  it('Component should render', () => {
    const { container } = render(<MyAssetStats {...mockProp} />, {
      wrapper: MemoryRouter,
    });

    const myDataHeader = getByTestId(container, 'data-summary-container');

    expect(myDataHeader).toBeInTheDocument();
  });

  it('Should have 8 data summary details', () => {
    const { container } = render(<MyAssetStats {...mockProp} />, {
      wrapper: MemoryRouter,
    });

    const dataSummary = getAllByTestId(container, /-summary$/);

    expect(dataSummary.length).toBe(8);
  });

  it('OnClick it should redirect to respective page', () => {
    const { container } = render(
      <MyAssetStats {...mockProp} countServices={4} />,
      {
        wrapper: MemoryRouter,
      }
    );
    const tables = getByTestId(container, 'tables');
    const topics = getByTestId(container, 'topics');
    const dashboards = getByTestId(container, 'dashboards');
    const pipelines = getByTestId(container, 'pipelines');
    const mlmodel = getByTestId(container, 'mlmodels');
    const service = getByTestId(container, 'service');
    const user = getByTestId(container, 'user');
    const terms = getByTestId(container, 'terms');

    expect(tables).toHaveAttribute('href', '/explore/tables/');
    expect(topics).toHaveAttribute('href', '/explore/topics/');
    expect(dashboards).toHaveAttribute('href', '/explore/dashboards/');
    expect(pipelines).toHaveAttribute('href', '/explore/pipelines/');
    expect(mlmodel).toHaveAttribute('href', '/explore/mlmodels/');
    expect(service).toHaveAttribute('href', '/services');
    expect(user).toHaveAttribute(
      'href',
      getTeamAndUserDetailsPath(UserType.USERS)
    );
    expect(terms).toHaveAttribute('href', getTeamAndUserDetailsPath());
  });
});
