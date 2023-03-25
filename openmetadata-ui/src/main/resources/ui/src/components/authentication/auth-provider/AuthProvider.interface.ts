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

import { Profile } from 'oidc-client';
import { ComponentType, ReactNode } from 'react';

export interface AuthProviderProps {
  childComponentType: ComponentType;
  children?: ReactNode;
}

export type UserProfile = {
  email: string;
  name: string;
  picture: string;
  locale?: string;
} & Pick<Profile, 'preferred_username' | 'sub'>;

export type OidcUser = {
  id_token: string;
  scope: string;
  profile: UserProfile;
};

export interface AuthenticatorRef {
  invokeLogin: () => void;
  invokeLogout: () => void;
  renewIdToken: () => Promise<string>;
}

export enum JWT_PRINCIPAL_CLAIMS {
  EMAIL = 'email',
  PREFERRED_USERNAME = 'preferred_username',
  SUB = 'sub',
}
