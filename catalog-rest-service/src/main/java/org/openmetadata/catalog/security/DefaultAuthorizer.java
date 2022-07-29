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

package org.openmetadata.catalog.security;

import static org.openmetadata.catalog.Entity.FIELD_OWNER;
import static org.openmetadata.catalog.security.SecurityUtil.DEFAULT_PRINCIPAL_DOMAIN;
import static org.openmetadata.common.utils.CommonUtil.listOrEmpty;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.exception.ExceptionUtils;
import org.jdbi.v3.core.Jdbi;
import org.openmetadata.catalog.Entity;
import org.openmetadata.catalog.EntityInterface;
import org.openmetadata.catalog.entity.teams.User;
import org.openmetadata.catalog.exception.EntityNotFoundException;
import org.openmetadata.catalog.jdbi3.EntityRepository;
import org.openmetadata.catalog.security.policyevaluator.RoleEvaluator;
import org.openmetadata.catalog.type.EntityReference;
import org.openmetadata.catalog.type.Include;
import org.openmetadata.catalog.type.MetadataOperation;
import org.openmetadata.catalog.util.EntityUtil.Fields;
import org.openmetadata.catalog.util.RestUtil;

@Slf4j
public class DefaultAuthorizer implements Authorizer {
  private Set<String> adminUsers;
  private Set<String> botUsers;
  private String principalDomain;

  @Override
  public void init(AuthorizerConfiguration config, Jdbi dbi) {
    LOG.debug("Initializing DefaultAuthorizer with config {}", config);
    this.adminUsers = new HashSet<>(config.getAdminPrincipals());
    this.botUsers = new HashSet<>(config.getBotPrincipals());
    this.principalDomain = config.getPrincipalDomain();
    LOG.debug("Admin users: {}", adminUsers);
    mayBeAddAdminUsers();
    mayBeAddBotUsers();
  }

  private void mayBeAddAdminUsers() {
    LOG.debug("Checking user entries for admin users");
    for (String adminUser : adminUsers) {
      try {
        EntityRepository<User> userRepository = Entity.getEntityRepository(Entity.USER);
        User user = userRepository.getByName(null, adminUser, Fields.EMPTY_FIELDS);
        if (user != null && (user.getIsAdmin() == null || !user.getIsAdmin())) {
          user.setIsAdmin(true);
        }
        addOrUpdateUser(user);
      } catch (EntityNotFoundException | IOException ex) {
        String domain = principalDomain.isEmpty() ? DEFAULT_PRINCIPAL_DOMAIN : principalDomain;
        User user =
            new User()
                .withId(UUID.randomUUID())
                .withName(adminUser)
                .withEmail(adminUser + "@" + domain)
                .withIsAdmin(true)
                .withUpdatedBy(adminUser)
                .withUpdatedAt(System.currentTimeMillis());
        addOrUpdateUser(user);
      }
    }
  }

  private void mayBeAddBotUsers() {
    LOG.debug("Checking user entries for bot users");
    for (String botUser : botUsers) {
      try {
        EntityRepository<User> userRepository = Entity.getEntityRepository(Entity.USER);
        User user = userRepository.getByName(null, botUser, Fields.EMPTY_FIELDS);
        if (user != null && (user.getIsBot() == null || !user.getIsBot())) {
          user.setIsBot(true);
        }
        addOrUpdateUser(user);
      } catch (EntityNotFoundException | IOException ex) {
        String domain = principalDomain.isEmpty() ? DEFAULT_PRINCIPAL_DOMAIN : principalDomain;
        User user =
            new User()
                .withId(UUID.randomUUID())
                .withName(botUser)
                .withEmail(botUser + "@" + domain)
                .withIsBot(true)
                .withUpdatedBy(botUser)
                .withUpdatedAt(System.currentTimeMillis());
        addOrUpdateUser(user);
      }
    }
  }

  @Override
  public boolean hasPermissions(AuthenticationContext ctx, EntityReference owner) {
    // Since we have roles and operations. An Admin could enable updateDescription, tags, ownership permissions to
    // a role and assign that to the users who can update the entities. With this we can look at the owner as a strict
    // requirement to manage entities. So if owner is null we will not allow users to update entities. They can get a
    // role that allows them to update the entity.
    return isOwner(ctx, owner);
  }

  @Override
  public boolean hasPermissions(
      AuthenticationContext ctx, EntityReference entityReference, MetadataOperation operation) {
    validate(ctx);
    try {
      EntityRepository<User> userRepository = Entity.getEntityRepository(Entity.USER);
      Fields fieldsRolesAndTeams = userRepository.getFields("roles, teams");
      User user = getUserFromAuthenticationContext(ctx, fieldsRolesAndTeams);
      List<EntityReference> allRoles = getAllRoles(user);
      if (entityReference == null) {
        // In some cases there is no specific entity being acted upon. Eg: Lineage.
        return RoleEvaluator.getInstance().hasPermissions(allRoles, null, operation);
      }

      EntityInterface entity =
          Entity.getEntity(entityReference, new Fields(List.of("tags", FIELD_OWNER)), Include.NON_DELETED);
      EntityReference owner = entity.getOwner();

      if (Entity.shouldHaveOwner(entityReference.getType()) && owner != null && isOwnedByUser(user, owner)) {
        return true; // Entity is owned by the user.
      }
      return RoleEvaluator.getInstance().hasPermissions(allRoles, entity, operation);
    } catch (IOException | EntityNotFoundException ex) {
      return false;
    }
  }

  @Override
  public List<MetadataOperation> listPermissions(AuthenticationContext ctx, EntityReference entityReference) {
    validate(ctx);

    if (isAdmin(ctx) || isBot(ctx)) {
      // Admins and bots have permissions to do all operations.
      return Stream.of(MetadataOperation.values()).collect(Collectors.toList());
    }

    try {
      EntityRepository<User> userRepository = Entity.getEntityRepository(Entity.USER);
      Fields fieldsRolesAndTeams = userRepository.getFields("roles, teams");
      User user = getUserFromAuthenticationContext(ctx, fieldsRolesAndTeams);
      List<EntityReference> allRoles = getAllRoles(user);
      if (entityReference == null) {
        return RoleEvaluator.getInstance().getAllowedOperations(allRoles, null);
      }
      EntityInterface entity =
          Entity.getEntity(entityReference, new Fields(List.of("tags", FIELD_OWNER)), Include.NON_DELETED);
      EntityReference owner = entity.getOwner();
      if (owner == null || isOwnedByUser(user, owner)) {
        // Entity does not have an owner or is owned by the user - allow all operations.
        return Stream.of(MetadataOperation.values()).collect(Collectors.toList());
      }
      return RoleEvaluator.getInstance().getAllowedOperations(allRoles, entity);
    } catch (IOException | EntityNotFoundException ex) {
      return Collections.emptyList();
    }
  }

  /** Checks if the user is same as owner or part of the team that is the owner. */
  private boolean isOwnedByUser(User user, EntityReference owner) {
    if (owner.getType().equals(Entity.USER) && owner.getName().equals(user.getName())) {
      return true; // Owner is same as user.
    }
    if (owner.getType().equals(Entity.TEAM)) {
      for (EntityReference userTeam : user.getTeams()) {
        if (userTeam.getName().equals(owner.getName())) {
          return true; // Owner is a team, and the user is part of this team.
        }
      }
    }
    return false;
  }

  @Override
  public boolean isAdmin(AuthenticationContext ctx) {
    validate(ctx);
    try {
      User user = getUserFromAuthenticationContext(ctx, Fields.EMPTY_FIELDS);
      return Boolean.TRUE.equals(user.getIsAdmin());
    } catch (IOException | EntityNotFoundException ex) {
      return false;
    }
  }

  @Override
  public boolean isBot(AuthenticationContext ctx) {
    validate(ctx);
    try {
      User user = getUserFromAuthenticationContext(ctx, Fields.EMPTY_FIELDS);
      return Boolean.TRUE.equals(user.getIsBot());
    } catch (IOException | EntityNotFoundException ex) {
      return false;
    }
  }

  @Override
  public boolean isOwner(AuthenticationContext ctx, EntityReference owner) {
    if (owner == null) {
      return false;
    }
    validate(ctx);
    try {
      EntityRepository<User> userRepository = Entity.getEntityRepository(Entity.USER);
      Fields fieldsTeams = userRepository.getFields("teams");
      User user = getUserFromAuthenticationContext(ctx, fieldsTeams);
      return isOwnedByUser(user, owner);
    } catch (IOException | EntityNotFoundException ex) {
      return false;
    }
  }

  private void validate(AuthenticationContext ctx) {
    if (ctx == null || ctx.getPrincipal() == null) {
      throw new AuthenticationException("No principal in AuthenticationContext");
    }
  }

  private User getUserFromAuthenticationContext(AuthenticationContext ctx, Fields fields) throws IOException {
    EntityRepository<User> userRepository = Entity.getEntityRepository(Entity.USER);
    if (ctx.getUser() != null) {
      // If a requested field is not present in the user, then add it
      for (String field : fields.getFieldList()) {
        if (!ctx.getUserFields().contains(field)) {
          userRepository.setFields(ctx.getUser(), userRepository.getFields(field));
          ctx.getUserFields().add(fields);
        }
      }
      return ctx.getUser();
    }
    String userName = SecurityUtil.getUserName(ctx);
    User user = userRepository.getByName(null, userName, fields);
    ctx.setUser(user);
    ctx.setUserFields(fields);
    return user;
  }

  private void addOrUpdateUser(User user) {
    EntityRepository<User> userRepository = Entity.getEntityRepository(Entity.USER);
    try {
      RestUtil.PutResponse<User> addedUser = userRepository.createOrUpdate(null, user);
      LOG.debug("Added user entry: {}", addedUser);
    } catch (Exception exception) {
      // In HA set up the other server may have already added the user.
      LOG.debug("Caught exception: {}", ExceptionUtils.getStackTrace(exception));
      LOG.debug("User entry: {} already exists.", user);
    }
  }

  private List<EntityReference> getAllRoles(User user) {
    List<EntityReference> allRoles = new ArrayList<>(listOrEmpty(user.getRoles()));
    allRoles.addAll(listOrEmpty(user.getInheritedRoles()));
    return allRoles.stream().distinct().collect(Collectors.toList()); // Remove duplicates
  }
}
