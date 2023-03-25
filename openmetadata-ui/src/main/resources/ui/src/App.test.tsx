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

import { render } from '@testing-library/react';
import { AuthContext } from 'components/authentication/auth-provider/AuthProvider';
import React from 'react';
import App from './App';

const authContext = jest.fn();

jest.mock('components/router/AppRouter', () => {
  return jest.fn().mockReturnValue(<p>AppRouter</p>);
});

jest.mock('components/app-bar/Appbar', () => {
  return jest.fn().mockReturnValue(<p>AppBar</p>);
});

jest.mock('components/authentication/auth-provider/AuthProvider', () => {
  return {
    AuthProvider: jest
      .fn()
      .mockImplementation(({ children }) => <>{children}</>),
    AuthContext: {
      Provider: jest.fn().mockImplementation(({ children }) => <>{children}</>),
    },
  };
});

it('renders learn react link', () => {
  const { getAllByTestId } = render(
    <AuthContext.Provider value={{ authContext }}>
      <App />
    </AuthContext.Provider>
  );
  const linkElement = getAllByTestId(/content-wrapper/i);
  linkElement.map((elm) => expect(elm).toBeInTheDocument());
});
