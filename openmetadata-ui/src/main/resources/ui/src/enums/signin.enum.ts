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

export enum AuthTypes {
  GOOGLE = 'google',
  GITHUB = 'github',
  OKTA = 'okta',
  AUTH0 = 'auth0',
  AZURE = 'azure',
  CUSTOM_OIDC = 'custom-oidc',
  AWS_COGNITO = 'aws-cognito',
  BASIC = 'basic',
  LDAP = 'ldap',
  NO_AUTH = 'no-auth',
}
