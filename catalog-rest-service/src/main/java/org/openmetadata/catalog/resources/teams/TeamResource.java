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

import static org.openmetadata.catalog.security.SecurityUtil.ADMIN;
import static org.openmetadata.catalog.security.SecurityUtil.BOT;
import static org.openmetadata.catalog.security.SecurityUtil.OWNER;

import io.dropwizard.jersey.PATCH;
import io.swagger.annotations.Api;
import io.swagger.v3.oas.annotations.ExternalDocumentation;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.parameters.RequestBody;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import java.io.IOException;
import java.util.List;
import javax.json.JsonPatch;
import javax.validation.Valid;
import javax.validation.constraints.Max;
import javax.validation.constraints.Min;
import javax.ws.rs.Consumes;
import javax.ws.rs.DELETE;
import javax.ws.rs.DefaultValue;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.PUT;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.SecurityContext;
import javax.ws.rs.core.UriInfo;
import org.openmetadata.catalog.Entity;
import org.openmetadata.catalog.api.teams.CreateTeam;
import org.openmetadata.catalog.entity.teams.Team;
import org.openmetadata.catalog.jdbi3.CollectionDAO;
import org.openmetadata.catalog.jdbi3.ListFilter;
import org.openmetadata.catalog.jdbi3.TeamRepository;
import org.openmetadata.catalog.resources.Collection;
import org.openmetadata.catalog.resources.EntityResource;
import org.openmetadata.catalog.security.Authorizer;
import org.openmetadata.catalog.type.EntityHistory;
import org.openmetadata.catalog.type.Include;
import org.openmetadata.catalog.util.ResultList;

@Path("/v1/teams")
@Api(value = "Teams collection", tags = "Teams collection")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@Collection(name = "teams")
public class TeamResource extends EntityResource<Team, TeamRepository> {
  public static final String COLLECTION_PATH = "/v1/teams/";

  @Override
  public Team addHref(UriInfo uriInfo, Team team) {
    Entity.withHref(uriInfo, team.getOwner());
    Entity.withHref(uriInfo, team.getUsers());
    Entity.withHref(uriInfo, team.getDefaultRoles());
    Entity.withHref(uriInfo, team.getOwns());
    return team;
  }

  public TeamResource(CollectionDAO dao, Authorizer authorizer) {
    super(Team.class, new TeamRepository(dao), authorizer);
  }

  public static class TeamList extends ResultList<Team> {
    @SuppressWarnings("unused") /* Required for tests */
    TeamList() {}

    public TeamList(List<Team> teams, String beforeCursor, String afterCursor, int total) {
      super(teams, beforeCursor, afterCursor, total);
    }
  }

  static final String FIELDS = "owner,profile,users,owns,defaultRoles";

  @GET
  @Valid
  @Operation(
      operationId = "listTeams",
      summary = "List teams",
      tags = "teams",
      description =
          "Get a list of teams. Use `fields` "
              + "parameter to get only necessary fields. Use cursor-based pagination to limit the number "
              + "entries in the list using `limit` and `before` or `after` query params.",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "List of teams",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = TeamList.class)))
      })
  public ResultList<Team> list(
      @Context UriInfo uriInfo,
      @Context SecurityContext securityContext,
      @Parameter(
              description = "Fields requested in the returned resource",
              schema = @Schema(type = "string", example = FIELDS))
          @QueryParam("fields")
          String fieldsParam,
      @Parameter(description = "Limit the number of teams returned. (1 to 1000000, default = 10)")
          @DefaultValue("10")
          @Min(0)
          @Max(1000000)
          @QueryParam("limit")
          int limitParam,
      @Parameter(description = "Returns list of teams before this cursor", schema = @Schema(type = "string"))
          @QueryParam("before")
          String before,
      @Parameter(description = "Returns list of teams after this cursor", schema = @Schema(type = "string"))
          @QueryParam("after")
          String after,
      @Parameter(
              description = "Include all, deleted, or non-deleted entities.",
              schema = @Schema(implementation = Include.class))
          @QueryParam("include")
          @DefaultValue("non-deleted")
          Include include)
      throws IOException {
    ListFilter filter = new ListFilter(include);
    return super.listInternal(uriInfo, securityContext, fieldsParam, filter, limitParam, before, after);
  }

  @GET
  @Path("/{id}/versions")
  @Operation(
      operationId = "listAllTeamVersion",
      summary = "List team versions",
      tags = "teams",
      description = "Get a list of all the versions of a team identified by `id`",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "List of team versions",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = EntityHistory.class)))
      })
  public EntityHistory listVersions(
      @Context UriInfo uriInfo,
      @Context SecurityContext securityContext,
      @Parameter(description = "team Id", schema = @Schema(type = "string")) @PathParam("id") String id)
      throws IOException {
    return dao.listVersions(id);
  }

  @GET
  @Valid
  @Path("/{id}")
  @Operation(
      operationId = "getTeamByID",
      summary = "Get a team",
      tags = "teams",
      description = "Get a team by `id`.",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "The team",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = Team.class))),
        @ApiResponse(responseCode = "404", description = "Team for instance {id} is not found")
      })
  public Team get(
      @Context UriInfo uriInfo,
      @Context SecurityContext securityContext,
      @PathParam("id") String id,
      @Parameter(
              description = "Fields requested in the returned resource",
              schema = @Schema(type = "string", example = FIELDS))
          @QueryParam("fields")
          String fieldsParam,
      @Parameter(
              description = "Include all, deleted, or non-deleted entities.",
              schema = @Schema(implementation = Include.class))
          @QueryParam("include")
          @DefaultValue("non-deleted")
          Include include)
      throws IOException {
    return getInternal(uriInfo, securityContext, id, fieldsParam, include);
  }

  @GET
  @Valid
  @Path("/name/{name}")
  @Operation(
      operationId = "getTeamByFQN",
      summary = "Get a team by name",
      tags = "teams",
      description = "Get a team by `name`.",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "The team",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = Team.class))),
        @ApiResponse(responseCode = "404", description = "Team for instance {name} is not found")
      })
  public Team getByName(
      @Context UriInfo uriInfo,
      @Context SecurityContext securityContext,
      @PathParam("name") String name,
      @Parameter(
              description = "Fields requested in the returned resource",
              schema = @Schema(type = "string", example = FIELDS))
          @QueryParam("fields")
          String fieldsParam,
      @Parameter(
              description = "Include all, deleted, or non-deleted entities.",
              schema = @Schema(implementation = Include.class))
          @QueryParam("include")
          @DefaultValue("non-deleted")
          Include include)
      throws IOException {
    return getByNameInternal(uriInfo, securityContext, name, fieldsParam, include);
  }

  @GET
  @Path("/{id}/versions/{version}")
  @Operation(
      operationId = "getSpecificRoleVersion",
      summary = "Get a version of the team",
      tags = "teams",
      description = "Get a version of the team by given `id`",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "team",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = Team.class))),
        @ApiResponse(
            responseCode = "404",
            description = "Team for instance {id} and version {version} is " + "not found")
      })
  public Team getVersion(
      @Context UriInfo uriInfo,
      @Context SecurityContext securityContext,
      @Parameter(description = "Team Id", schema = @Schema(type = "string")) @PathParam("id") String id,
      @Parameter(
              description = "Team version number in the form `major`.`minor`",
              schema = @Schema(type = "string", example = "0.1 or 1.1"))
          @PathParam("version")
          String version)
      throws IOException {
    return dao.getVersion(id, version);
  }

  @POST
  @Operation(
      operationId = "createTeam",
      summary = "Create a team",
      tags = "teams",
      description = "Create a new team.",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "The team",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = Team.class))),
        @ApiResponse(responseCode = "400", description = "Bad request")
      })
  public Response create(@Context UriInfo uriInfo, @Context SecurityContext securityContext, @Valid CreateTeam ct)
      throws IOException {
    Team team = getTeam(ct, securityContext.getUserPrincipal().getName());
    return create(uriInfo, securityContext, team, ADMIN | BOT);
  }

  @PUT
  @Operation(
      operationId = "createOrUpdateTeam",
      summary = "Update team",
      tags = "teams",
      description = "Create or Update a team.",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "The team ",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = Team.class))),
        @ApiResponse(responseCode = "400", description = "Bad request")
      })
  public Response createOrUpdate(
      @Context UriInfo uriInfo, @Context SecurityContext securityContext, @Valid CreateTeam ct) throws IOException {
    Team team = getTeam(ct, securityContext.getUserPrincipal().getName());
    return createOrUpdate(uriInfo, securityContext, team, ADMIN | BOT | OWNER);
  }

  @PATCH
  @Path("/{id}")
  @Consumes(MediaType.APPLICATION_JSON_PATCH_JSON)
  @Operation(
      operationId = "patchTeam",
      summary = "Update a team",
      tags = "teams",
      description = "Update an existing team with JsonPatch.",
      externalDocs = @ExternalDocumentation(description = "JsonPatch RFC", url = "https://tools.ietf.org/html/rfc6902"))
  public Response patch(
      @Context UriInfo uriInfo,
      @Context SecurityContext securityContext,
      @PathParam("id") String id,
      @RequestBody(
              description = "JsonPatch with array of operations",
              content =
                  @Content(
                      mediaType = MediaType.APPLICATION_JSON_PATCH_JSON,
                      examples = {
                        @ExampleObject("[" + "{op:remove, path:/a}," + "{op:add, path: /b, value: val}" + "]")
                      }))
          JsonPatch patch)
      throws IOException {
    return patchInternal(uriInfo, securityContext, id, patch);
  }

  @DELETE
  @Path("/{id}")
  @Operation(
      operationId = "deleteTeam",
      summary = "Delete a team",
      tags = "teams",
      description = "Delete a team by given `id`.",
      responses = {
        @ApiResponse(responseCode = "200", description = "OK"),
        @ApiResponse(responseCode = "404", description = "Team for instance {id} is not found")
      })
  public Response delete(
      @Context UriInfo uriInfo,
      @Context SecurityContext securityContext,
      @Parameter(description = "Hard delete the entity. (Default = `false`)")
          @QueryParam("hardDelete")
          @DefaultValue("false")
          boolean hardDelete,
      @Parameter(description = "Team Id", schema = @Schema(type = "string")) @PathParam("id") String id)
      throws IOException {
    return delete(uriInfo, securityContext, id, false, hardDelete, ADMIN | BOT);
  }

  private Team getTeam(CreateTeam ct, String user) {
    return copy(new Team(), ct, user)
        .withProfile(ct.getProfile())
        .withIsJoinable(ct.getIsJoinable())
        .withUsers(dao.toEntityReferences(ct.getUsers(), Entity.USER))
        .withDefaultRoles(dao.toEntityReferences(ct.getDefaultRoles(), Entity.ROLE));
  }
}
