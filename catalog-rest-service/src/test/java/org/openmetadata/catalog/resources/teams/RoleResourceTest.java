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

package org.openmetadata.catalog.resources.teams;

import static javax.ws.rs.core.Response.Status.FORBIDDEN;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.fail;
import static org.openmetadata.catalog.exception.CatalogExceptionMessage.noPermission;
import static org.openmetadata.catalog.security.SecurityUtil.getPrincipalName;
import static org.openmetadata.catalog.util.TestUtils.ADMIN_AUTH_HEADERS;
import static org.openmetadata.catalog.util.TestUtils.TEST_AUTH_HEADERS;
import static org.openmetadata.catalog.util.TestUtils.TEST_USER_NAME;
import static org.openmetadata.catalog.util.TestUtils.UpdateType.MINOR_UPDATE;
import static org.openmetadata.catalog.util.TestUtils.assertEntityReferenceList;
import static org.openmetadata.catalog.util.TestUtils.assertListNotNull;
import static org.openmetadata.catalog.util.TestUtils.assertListNull;
import static org.openmetadata.catalog.util.TestUtils.assertResponse;

import com.fasterxml.jackson.core.JsonProcessingException;
import java.io.IOException;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.UUID;
import javax.validation.constraints.Positive;
import lombok.extern.slf4j.Slf4j;
import org.apache.http.client.HttpResponseException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInfo;
import org.openmetadata.catalog.Entity;
import org.openmetadata.catalog.api.teams.CreateRole;
import org.openmetadata.catalog.entity.teams.Role;
import org.openmetadata.catalog.entity.teams.User;
import org.openmetadata.catalog.resources.EntityResourceTest;
import org.openmetadata.catalog.resources.teams.RoleResource.RoleList;
import org.openmetadata.catalog.type.ChangeDescription;
import org.openmetadata.catalog.type.FieldChange;
import org.openmetadata.catalog.util.JsonUtils;
import org.openmetadata.catalog.util.TestUtils;

@Slf4j
public class RoleResourceTest extends EntityResourceTest<Role, CreateRole> {
  public RoleResourceTest() {
    super(Entity.ROLE, Role.class, RoleList.class, "roles", null);
    this.supportsAuthorizedMetadataOperations = false;
  }

  public void setupRoles(TestInfo test) throws HttpResponseException {
    RoleResourceTest roleResourceTest = new RoleResourceTest();
    DATA_CONSUMER_ROLE =
        roleResourceTest.getEntityByName(DATA_CONSUMER_ROLE_NAME, null, RoleResource.FIELDS, ADMIN_AUTH_HEADERS);
    DATA_CONSUMER_ROLE_REFERENCE = DATA_CONSUMER_ROLE.getEntityReference();

    DATA_STEWARD_ROLE =
        roleResourceTest.getEntityByName(DATA_STEWARD_ROLE_NAME, null, RoleResource.FIELDS, ADMIN_AUTH_HEADERS);
    DATA_STEWARD_ROLE_REFERENCE = DATA_STEWARD_ROLE.getEntityReference();

    ROLE1 = roleResourceTest.createEntity(roleResourceTest.createRequest(test), ADMIN_AUTH_HEADERS);
    ROLE1_REFERENCE = ROLE1.getEntityReference();
  }

  @Test
  void defaultRole(TestInfo test) throws IOException {
    // Check if there is a default role in the beginning. DataConsumer is a default role.
    List<Role> defaultRoles = getDefaultRoles();
    assertEquals(1, defaultRoles.size());
    Role prevDefaultRole = defaultRoles.get(0);

    // Update the default role and check the following:
    // - the default role has changed
    // - the previous default role is no longer set as default
    // - all users have roles set correctly (only current default role should exist)
    for (int i = 0; i < 2; i++) { // Run two iterations for this test.
      Role defaultRole = createRolesAndSetDefault(test, 7, i * 10);
      defaultRoles = getDefaultRoles();
      assertEquals(1, defaultRoles.size());
      assertEquals(defaultRole.getId(), defaultRoles.get(0).getId());
      assertNotEquals(defaultRole.getId(), prevDefaultRole.getId());

      List<User> users = new UserResourceTest().listEntities(Map.of("fields", "roles"), ADMIN_AUTH_HEADERS).getData();
      for (User user : users) {
        UUID prevDefaultRoleId = prevDefaultRole.getId();
        boolean prevDefaultRoleExists =
            user.getInheritedRoles().stream().anyMatch(role -> role.getId().equals(prevDefaultRoleId));
        if (prevDefaultRoleExists) {
          fail(
              String.format(
                  "Previous default role %s has not been removed for user %s",
                  prevDefaultRole.getName(), user.getName()));
        }
        boolean defaultRoleExists =
            user.getInheritedRoles().stream().anyMatch(role -> role.getId().equals(defaultRole.getId()));
        if (!defaultRoleExists) {
          fail(String.format("Default role %s was not set for user %s", defaultRole.getName(), user.getName()));
        }
      }
      prevDefaultRole = defaultRole;
    }
  }

  public List<Role> getDefaultRoles() throws HttpResponseException {
    return listEntities(Map.of("default", "true"), ADMIN_AUTH_HEADERS).getData();
  }

  /** Creates the given number of roles and sets one of them as the default role. */
  public Role createRolesAndSetDefault(TestInfo test, @Positive int numberOfRoles, @Positive int offset)
      throws IOException {
    // Create a set of roles.
    for (int i = 0; i < numberOfRoles; i++) {
      CreateRole create = createRequest(test, offset + i);
      createAndCheckEntity(create, ADMIN_AUTH_HEADERS);
    }

    // Set one of the roles as default.
    Role role =
        getEntityByName(
            getEntityName(test, offset + new Random().nextInt(numberOfRoles)),
            Collections.emptyMap(),
            RoleResource.FIELDS,
            ADMIN_AUTH_HEADERS);
    String originalJson = JsonUtils.pojoToJson(role);
    role.setDefaultRole(true);
    ChangeDescription change = getChangeDescription(role.getVersion());
    change.getFieldsUpdated().add(new FieldChange().withName("default").withOldValue(false).withNewValue(true));
    return patchEntityAndCheck(role, originalJson, ADMIN_AUTH_HEADERS, MINOR_UPDATE, change);
  }

  @Test
  void post_validRoles_as_admin_200_OK(TestInfo test) throws IOException {
    // Create role with different optional fields
    CreateRole create = createRequest(test, 1);
    createAndCheckEntity(create, ADMIN_AUTH_HEADERS);

    create = createRequest(test, 2).withDisplayName("displayName");
    createAndCheckEntity(create, ADMIN_AUTH_HEADERS);

    create = createRequest(test, 3).withDescription("description");
    createAndCheckEntity(create, ADMIN_AUTH_HEADERS);

    create = createRequest(test, 4).withDisplayName("displayName").withDescription("description");
    createAndCheckEntity(create, ADMIN_AUTH_HEADERS);
  }

  @Test
  void patch_roleAttributes_as_non_admin_403(TestInfo test) throws HttpResponseException, JsonProcessingException {
    Role role = createEntity(createRequest(test), ADMIN_AUTH_HEADERS);
    // Patching as a non-admin should is disallowed
    String originalJson = JsonUtils.pojoToJson(role);
    role.setDisplayName("newDisplayName");
    assertResponse(
        () -> patchEntity(role.getId(), originalJson, role, TEST_AUTH_HEADERS),
        FORBIDDEN,
        noPermission(TEST_USER_NAME));
  }

  private static void validateRole(
      Role role, String expectedDescription, String expectedDisplayName, String expectedUpdatedBy) {
    assertListNotNull(role.getId(), role.getHref());
    assertEquals(expectedDescription, role.getDescription());
    assertEquals(expectedUpdatedBy, role.getUpdatedBy());
    assertEquals(expectedDisplayName, role.getDisplayName());
  }

  @Override
  public Role validateGetWithDifferentFields(Role role, boolean byName) throws HttpResponseException {
    // Assign two arbitrary users this role for testing.
    if (role.getUsers() == null) {
      UserResourceTest userResourceTest = new UserResourceTest();
      userResourceTest.createEntity(
          userResourceTest.createRequest(role.getName() + "user1", "", "", null).withRoles(List.of(role.getId())),
          ADMIN_AUTH_HEADERS);
      userResourceTest.createEntity(
          userResourceTest.createRequest(role.getName() + "user2", "", "", null).withRoles(List.of(role.getId())),
          ADMIN_AUTH_HEADERS);
    }

    // Assign two arbitrary teams this role for testing.
    if (role.getTeams() == null) {
      TeamResourceTest teamResourceTest = new TeamResourceTest();
      teamResourceTest.createEntity(
          teamResourceTest
              .createRequest(role.getName() + "team1", "", "", null)
              .withDefaultRoles(List.of(role.getId())),
          ADMIN_AUTH_HEADERS);
      teamResourceTest.createEntity(
          teamResourceTest
              .createRequest(role.getName() + "team2", "", "", null)
              .withDefaultRoles(List.of(role.getId())),
          ADMIN_AUTH_HEADERS);
    }

    String updatedBy = getPrincipalName(ADMIN_AUTH_HEADERS);
    role =
        byName
            ? getEntityByName(role.getName(), null, null, ADMIN_AUTH_HEADERS)
            : getEntity(role.getId(), null, ADMIN_AUTH_HEADERS);
    validateRole(role, role.getDescription(), role.getDisplayName(), updatedBy);
    assertListNull(role.getPolicies(), role.getUsers());

    String fields = "policies,teams,users";
    role =
        byName
            ? getEntityByName(role.getName(), null, fields, ADMIN_AUTH_HEADERS)
            : getEntity(role.getId(), fields, ADMIN_AUTH_HEADERS);
    assertListNotNull(role.getPolicies(), role.getUsers());
    validateRole(role, role.getDescription(), role.getDisplayName(), updatedBy);
    TestUtils.validateEntityReferences(role.getPolicies());
    TestUtils.validateEntityReferences(role.getTeams(), true);
    TestUtils.validateEntityReferences(role.getUsers(), true);
    return role;
  }

  @Override
  public CreateRole createRequest(String name) {
    return new CreateRole().withName(name).withPolicies(DATA_CONSUMER_ROLE.getPolicies());
  }

  @Override
  public void validateCreatedEntity(Role role, CreateRole createRequest, Map<String, String> authHeaders) {
    assertEntityReferenceList(role.getPolicies(), createRequest.getPolicies());
  }

  @Override
  public void compareEntities(Role expected, Role updated, Map<String, String> authHeaders) {
    assertEquals(expected.getDisplayName(), updated.getDisplayName());
  }

  @Override
  public void assertFieldChange(String fieldName, Object expected, Object actual) throws IOException {
    assertCommonFieldChange(fieldName, expected, actual);
  }
}
