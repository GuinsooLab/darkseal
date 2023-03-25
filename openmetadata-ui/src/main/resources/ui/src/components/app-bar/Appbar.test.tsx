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

import { findByText, render } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import Appbar from './Appbar';

jest.mock('../../hooks/authHooks', () => ({
  useAuth: () => {
    return {
      isSignedIn: true,
      isSignedOut: false,
      isAuthenticatedRoute: true,
      isAuthDisabled: true,
    };
  },
}));

jest.mock('../authentication/auth-provider/AuthProvider', () => {
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

jest.mock('../nav-bar/NavBar', () => {
  return jest.fn().mockReturnValue(<p>NavBar</p>);
});

jest.mock('rest/miscAPI', () => ({
  getVersion: jest.fn().mockImplementation(() =>
    Promise.resolve({
      data: {
        version: '0.5.0-SNAPSHOT',
      },
    })
  ),
}));

describe('Test Appbar Component', () => {
  it('Component should render', async () => {
    const { container } = render(<Appbar />, {
      wrapper: MemoryRouter,
    });

    const NavBar = await findByText(container, 'NavBar');

    expect(NavBar).toBeInTheDocument();
  });
});
