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
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { getUserByName } from 'rest/userAPI';
import UserPage from './UserPage.component';

const mockUserData = {
  id: 'd6764107-e8b4-4748-b256-c86fecc66064',
  name: 'xyz',
  displayName: 'XYZ',
  version: 0.1,
  updatedAt: 1648704499857,
  updatedBy: 'xyz',
  email: 'xyz@gmail.com',
  href: 'http://localhost:8585/api/v1/users/d6764107-e8b4-4748-b256-c86fecc66064',
  isAdmin: false,
  profile: {
    images: {
      image:
        'https://lh3.googleusercontent.com/a-/AOh14Gh8NPux8jEPIuyPWOxAB1od9fGN188Kcp5HeXgc=s96-c',
      image24:
        'https://lh3.googleusercontent.com/a-/AOh14Gh8NPux8jEPIuyPWOxAB1od9fGN188Kcp5HeXgc=s24-c',
      image32:
        'https://lh3.googleusercontent.com/a-/AOh14Gh8NPux8jEPIuyPWOxAB1od9fGN188Kcp5HeXgc=s32-c',
      image48:
        'https://lh3.googleusercontent.com/a-/AOh14Gh8NPux8jEPIuyPWOxAB1od9fGN188Kcp5HeXgc=s48-c',
      image72:
        'https://lh3.googleusercontent.com/a-/AOh14Gh8NPux8jEPIuyPWOxAB1od9fGN188Kcp5HeXgc=s72-c',
      image192:
        'https://lh3.googleusercontent.com/a-/AOh14Gh8NPux8jEPIuyPWOxAB1od9fGN188Kcp5HeXgc=s192-c',
      image512:
        'https://lh3.googleusercontent.com/a-/AOh14Gh8NPux8jEPIuyPWOxAB1od9fGN188Kcp5HeXgc=s512-c',
    },
  },
  teams: [
    {
      id: '3362fe18-05ad-4457-9632-84f22887dda6',
      type: 'team',
      name: 'Finance',
      description: 'This is Finance description.',
      displayName: 'Finance',
      deleted: false,
      href: 'http://localhost:8585/api/v1/teams/3362fe18-05ad-4457-9632-84f22887dda6',
    },
    {
      id: '5069ddd4-d47e-4b2c-a4c4-4c849b97b7f9',
      type: 'team',
      name: 'Data_Platform',
      description: 'This is Data_Platform description.',
      displayName: 'Data_Platform',
      deleted: false,
      href: 'http://localhost:8585/api/v1/teams/5069ddd4-d47e-4b2c-a4c4-4c849b97b7f9',
    },
    {
      id: '7182cc43-aebc-419d-9452-ddbe2fc4e640',
      type: 'team',
      name: 'Customer_Support',
      description: 'This is Customer_Support description.',
      displayName: 'Customer_Support',
      deleted: false,
      href: 'http://localhost:8585/api/v1/teams/7182cc43-aebc-419d-9452-ddbe2fc4e640',
    },
  ],
  owns: [],
  follows: [],
  deleted: false,
  roles: [
    {
      id: 'ce4df2a5-aaf5-4580-8556-254f42574aa7',
      type: 'role',
      name: 'DataConsumer',
      description:
        'Users with Data Consumer role use different data assets for their day to day work.',
      displayName: 'Data Consumer',
      deleted: false,
      href: 'http://localhost:8585/api/v1/roles/ce4df2a5-aaf5-4580-8556-254f42574aa7',
    },
  ],
};

jest.mock('components/authentication/auth-provider/AuthProvider', () => {
  return {
    useAuthContext: jest.fn(() => ({
      isAuthDisabled: true,
    })),
  };
});

jest.mock('react-router-dom', () => ({
  useParams: jest.fn().mockImplementation(() => ({ username: 'xyz' })),
  useLocation: jest.fn().mockImplementation(() => new URLSearchParams()),
}));

jest.mock('components/Loader/Loader', () => {
  return jest.fn().mockReturnValue(<p>Loader</p>);
});

jest.mock('components/Users/Users.component', () => {
  return jest.fn().mockReturnValue(<p>User Component</p>);
});

jest.mock('rest/userAPI', () => ({
  getUserByName: jest
    .fn()
    .mockImplementation(() => Promise.resolve({ data: mockUserData })),
}));

jest.mock('rest/userAPI', () => ({
  getUserByName: jest
    .fn()
    .mockImplementation(() => Promise.resolve({ data: mockUserData })),
  updateUserDetail: jest.fn(),
}));

jest.mock('rest/feedsAPI', () => ({
  getFeedsWithFilter: jest.fn().mockImplementation(() =>
    Promise.resolve({
      data: {
        data: [],
      },
    })
  ),
  postFeedById: jest.fn(),
}));

describe('Test the User Page', () => {
  it('Should render the user component', async () => {
    const { container } = render(<UserPage />, { wrapper: MemoryRouter });

    const userComponent = await findByText(container, /User Component/i);

    expect(userComponent).toBeInTheDocument();
  });

  it('Should render error placeholder if api fails', async () => {
    (getUserByName as jest.Mock).mockImplementationOnce(() =>
      Promise.reject({
        response: {
          data: {
            message: 'Error',
          },
        },
      })
    );
    const { container } = render(<UserPage />, { wrapper: MemoryRouter });

    const errorPlaceholder = await findByTestId(container, 'error');

    expect(errorPlaceholder).toBeInTheDocument();
  });
});
