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

package org.openmetadata.catalog.jdbi3;

import static org.openmetadata.catalog.Entity.FIELD_OWNER;
import static org.openmetadata.catalog.Entity.TEAM;
import static org.openmetadata.common.utils.CommonUtil.listOrEmpty;

import com.fasterxml.jackson.core.JsonProcessingException;
import java.io.IOException;
import java.util.List;
import org.openmetadata.catalog.Entity;
import org.openmetadata.catalog.entity.teams.Team;
import org.openmetadata.catalog.jdbi3.CollectionDAO.EntityRelationshipRecord;
import org.openmetadata.catalog.resources.teams.TeamResource;
import org.openmetadata.catalog.type.EntityReference;
import org.openmetadata.catalog.type.Relationship;
import org.openmetadata.catalog.util.EntityUtil;
import org.openmetadata.catalog.util.EntityUtil.Fields;

public class TeamRepository extends EntityRepository<Team> {
  static final String TEAM_UPDATE_FIELDS = "owner,profile,users,defaultRoles";
  static final String TEAM_PATCH_FIELDS = "owner,profile,users,defaultRoles";

  public TeamRepository(CollectionDAO dao) {
    super(TeamResource.COLLECTION_PATH, TEAM, Team.class, dao.teamDAO(), dao, TEAM_PATCH_FIELDS, TEAM_UPDATE_FIELDS);
  }

  @Override
  public Team setFields(Team team, Fields fields) throws IOException {
    if (!fields.contains("profile")) {
      team.setProfile(null); // Clear the profile attribute, if it was not requested
    }
    team.setUsers(fields.contains("users") ? getUsers(team) : null);
    team.setOwns(fields.contains("owns") ? getOwns(team) : null);
    team.setDefaultRoles(fields.contains("defaultRoles") ? getDefaultRoles(team) : null);
    team.setOwner(fields.contains(FIELD_OWNER) ? getOwner(team) : null);
    return team;
  }

  @Override
  public void restorePatchAttributes(Team original, Team updated) {
    // Patch can't make changes to following fields. Ignore the changes
    updated.withName(original.getName()).withId(original.getId());
  }

  @Override
  public void prepare(Team team) throws IOException {
    setFullyQualifiedName(team);
    populateOwner(team.getOwner()); // Validate owner
    validateUsers(team.getUsers());
    validateRoles(team.getDefaultRoles());
  }

  @Override
  public void storeEntity(Team team, boolean update) throws IOException {
    // Relationships and fields such as href are derived and not stored as part of json
    EntityReference owner = team.getOwner();
    List<EntityReference> users = team.getUsers();
    List<EntityReference> defaultRoles = team.getDefaultRoles();

    // Don't store users, defaultRoles, href as JSON. Build it on the fly based on relationships
    team.withUsers(null).withDefaultRoles(null).withHref(null).withOwner(null);

    store(team.getId(), team, update);

    // Restore the relationships
    team.withUsers(users).withDefaultRoles(defaultRoles).withOwner(owner);
  }

  @Override
  public void storeRelationships(Team team) {
    // Add team owner relationship
    storeOwner(team, team.getOwner());
    for (EntityReference user : listOrEmpty(team.getUsers())) {
      addRelationship(team.getId(), user.getId(), TEAM, Entity.USER, Relationship.HAS);
    }
    for (EntityReference defaultRole : listOrEmpty(team.getDefaultRoles())) {
      addRelationship(team.getId(), defaultRole.getId(), TEAM, Entity.ROLE, Relationship.HAS);
    }
  }

  @Override
  public TeamUpdater getUpdater(Team original, Team updated, Operation operation) {
    return new TeamUpdater(original, updated, operation);
  }

  private List<EntityReference> getUsers(Team team) throws IOException {
    List<EntityRelationshipRecord> userIds = findTo(team.getId(), TEAM, Relationship.HAS, Entity.USER);
    return EntityUtil.populateEntityReferences(userIds, Entity.USER);
  }

  private List<EntityReference> getOwns(Team team) throws IOException {
    // Compile entities owned by the team
    return EntityUtil.getEntityReferences(
        daoCollection.relationshipDAO().findTo(team.getId().toString(), TEAM, Relationship.OWNS.ordinal()));
  }

  private List<EntityReference> getDefaultRoles(Team team) throws IOException {
    List<EntityRelationshipRecord> defaultRoleIds = findTo(team.getId(), TEAM, Relationship.HAS, Entity.ROLE);
    return EntityUtil.populateEntityReferences(defaultRoleIds, Entity.ROLE);
  }

  /** Handles entity updated from PUT and POST operation. */
  public class TeamUpdater extends EntityUpdater {
    public TeamUpdater(Team original, Team updated, Operation operation) {
      super(original, updated, operation);
    }

    @Override
    public void entitySpecificUpdate() throws IOException {
      recordChange("profile", original.getProfile(), updated.getProfile());
      recordChange("isJoinable", original.getIsJoinable(), updated.getIsJoinable());
      updateUsers(original, updated);
      updateDefaultRoles(original, updated);
    }

    private void updateUsers(Team origTeam, Team updatedTeam) throws JsonProcessingException {
      List<EntityReference> origUsers = listOrEmpty(origTeam.getUsers());
      List<EntityReference> updatedUsers = listOrEmpty(updatedTeam.getUsers());
      updateToRelationships(
          "users", TEAM, origTeam.getId(), Relationship.HAS, Entity.USER, origUsers, updatedUsers, false);
    }

    private void updateDefaultRoles(Team origTeam, Team updatedTeam) throws JsonProcessingException {
      List<EntityReference> origDefaultRoles = listOrEmpty(origTeam.getDefaultRoles());
      List<EntityReference> updatedDefaultRoles = listOrEmpty(updatedTeam.getDefaultRoles());
      updateToRelationships(
          "defaultRoles",
          TEAM,
          origTeam.getId(),
          Relationship.HAS,
          Entity.ROLE,
          origDefaultRoles,
          updatedDefaultRoles,
          false);
    }
  }
}
