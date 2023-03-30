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
  addUser,
  deleteSoftDeletedUser,
  interceptURL,
  restoreUser,
  softDeleteUser,
  uuid,
  verifyResponseStatusCode,
} from '../../common/common';

const userName = `Usercttest${uuid()}`;
const userEmail = `${userName}@gmail.com`;

const adminName = `Admincttest${uuid()}`;
const adminEmail = `${adminName}@gmail.com`;

describe('Users flow should work properly', () => {
  beforeEach(() => {
    cy.login();

    cy.get('[data-testid="appbar-item-settings"]')
      .should('exist')
      .should('be.visible')
      .click();
    interceptURL(
      'GET',
      '/api/v1/users?fields=profile,teams,roles&&isBot=false&limit=15',
      'getUsers'
    );
    cy.get('[data-testid="settings-left-panel"]')
      .contains('Users')
      .should('exist')
      .should('be.visible')
      .click();
  });

  it('Add new User', () => {
    // Clicking on Add user button
    cy.get('[data-testid="add-user"]').click();

    addUser(userName, userEmail);
    verifyResponseStatusCode('@getUsers', 200);

    // Validate if user is added in the User tab

    cy.get('[data-testid="searchbar"]')
      .should('exist')
      .should('be.visible')
      .type(userName);
    cy.get('.ant-table-tbody ').should('contain', userName);
  });

  it('Soft delete user', () => {
    softDeleteUser(userName);
  });

  it('Restore soft deleted user', () => {
    restoreUser(userName);
  });

  it('Permanently Delete Soft Deleted User', () => {
    softDeleteUser(userName);
    deleteSoftDeletedUser(userName);
  });
});

describe('Admin flow should work properly', () => {
  beforeEach(() => {
    cy.login();

    cy.get('[data-testid="appbar-item-settings"]')
      .should('exist')
      .should('be.visible')
      .click();
    interceptURL(
      'GET',
      '/api/v1/users?fields=profile,teams,roles&&isAdmin=true&isBot=false&limit=15',
      'getAdmins'
    );
    cy.get('.ant-menu-title-content')
      .contains('Admins')
      .should('exist')
      .should('be.visible')
      .click();
  });

  it('Add admin user', () => {
    // Clicking on add user button
    cy.get('[data-testid="add-user"]').click();

    // Setting the user to admin before adding user
    cy.get('[data-testid="admin"]')
      .scrollIntoView()
      .should('exist')
      .should('be.visible')
      .click();

    addUser(adminName, adminEmail);
    verifyResponseStatusCode('@getAdmins', 200);

    // Validate if user is added in the User tab

    cy.get('[data-testid="searchbar"]')
      .should('exist')
      .should('be.visible')
      .type(adminName);
    cy.get('.ant-table-tbody ').should('contain', adminName);
  });

  it('Soft delete admin', () => {
    softDeleteUser(adminName);
  });

  it('Restore soft deleted admin', () => {
    restoreUser(adminName);
  });

  it('Permanently Delete Soft Deleted admin', () => {
    softDeleteUser(adminName);
    deleteSoftDeletedUser(adminName);
  });
});
