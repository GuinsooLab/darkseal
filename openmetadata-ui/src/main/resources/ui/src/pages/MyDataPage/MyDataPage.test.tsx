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

import { findByText, queryByText, render } from '@testing-library/react';
import React, { ReactNode } from 'react';
import { getAllEntityCount } from 'rest/miscAPI';
import MyDataPageComponent from './MyDataPage.component';

const mockAuth = {
  isAuthDisabled: true,
};

jest.mock('react', () => {
  const originalReact = jest.requireActual('react');

  return {
    ...originalReact,
    useReducer: jest.fn((_reducer, initialState) => {
      return [initialState, jest.fn()];
    }),
  };
});

jest.mock('components/MyData/MyData.component', () => {
  return jest
    .fn()
    .mockReturnValue(<p data-testid="my-data-component">Mydata component</p>);
});

jest.mock('rest/miscAPI', () => ({
  fetchSandboxConfig: jest.fn().mockImplementation(() =>
    Promise.resolve({
      data: {
        sandboxModeEnabled: false,
      },
    })
  ),
  getAllEntityCount: jest.fn().mockImplementation(() =>
    Promise.resolve({
      data: {
        tableCount: 40,
        topicCount: 13,
        dashboardCount: 10,
        pipelineCount: 3,
        mlmodelCount: 2,
        servicesCount: 193,
        userCount: 100,
        teamCount: 7,
      },
    })
  ),
}));

jest.mock('rest/feedsAPI', () => ({
  getFeedsWithFilter: jest.fn().mockImplementation(() =>
    Promise.resolve({
      data: {
        data: [],
      },
    })
  ),
}));

jest.mock('../../utils/CommonUtils', () => ({
  isSandboxOMD: jest.fn().mockReturnValue(true),
}));

jest.mock('../../hooks/authHooks', () => ({
  useAuth: jest.fn(() => mockAuth),
}));

jest.mock('react-router-dom', () => ({
  useLocation: jest.fn().mockReturnValue({
    pathname: 'pathname',
  }),
}));

jest.mock('../../utils/APIUtils', () => ({
  formatDataResponse: jest.fn(),
}));

jest.mock('components/containers/PageContainerV1', () => {
  return jest
    .fn()
    .mockImplementation(({ children }: { children: ReactNode }) => (
      <div data-testid="PageContainerV1">{children}</div>
    ));
});

jest.mock('components/MyData/MyData.component', () => {
  return jest.fn().mockImplementation(() => <p>MyData.component</p>);
});

jest.mock('components/GithubStarButton/GithubStarButton', () => {
  return jest.fn().mockImplementation(() => <p>GithubStarButton.component</p>);
});

describe('Test MyData page component', () => {
  it('Component should render', async () => {
    const { container } = render(<MyDataPageComponent />);
    const myData = await findByText(container, /MyData.component/i);

    const githubStarButton = await queryByText(
      container,
      /GithubStarButton.component/i
    );

    const slackChat = await queryByText(container, /SlackChat.component/i);

    expect(myData).toBeInTheDocument();
    expect(githubStarButton).not.toBeInTheDocument();
    expect(slackChat).not.toBeInTheDocument();
  });

  it('Component should render in sandbox mode', async () => {
    const { container } = render(<MyDataPageComponent />);
    const myData = await findByText(container, /MyData.component/i);

    expect(myData).toBeInTheDocument();
  });

  describe('render Sad Paths', () => {
    it('show error message on failing of config/sandbox api', async () => {
      const { container } = render(<MyDataPageComponent />);
      const myData = await findByText(container, /MyData.component/i);

      const githubStarButton = await queryByText(
        container,
        /GithubStarButton.component/i
      );

      expect(myData).toBeInTheDocument();
      expect(githubStarButton).not.toBeInTheDocument();
    });

    it('show error message on no data from config/sandbox api', async () => {
      const { container } = render(<MyDataPageComponent />);
      const myData = await findByText(container, /MyData.component/i);

      const githubStarButton = await queryByText(
        container,
        /GithubStarButton.component/i
      );

      expect(myData).toBeInTheDocument();
      expect(githubStarButton).not.toBeInTheDocument();
    });

    it('should render component if table count api fails', async () => {
      (getAllEntityCount as jest.Mock).mockImplementationOnce(() =>
        Promise.reject({
          response: { data: { message: 'Error!' } },
        })
      );

      const { container } = render(<MyDataPageComponent />);
      const myData = await findByText(container, /MyData.component/i);

      expect(myData).toBeInTheDocument();
    });
  });
});
