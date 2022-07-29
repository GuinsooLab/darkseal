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
import java.util.UUID;
import javax.json.JsonObject;
import javax.json.JsonPatch;
import javax.json.JsonValue;
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
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.openmetadata.catalog.Entity;
import org.openmetadata.catalog.api.teams.CreateUser;
import org.openmetadata.catalog.entity.teams.AuthenticationMechanism;
import org.openmetadata.catalog.entity.teams.User;
import org.openmetadata.catalog.jdbi3.CollectionDAO;
import org.openmetadata.catalog.jdbi3.ListFilter;
import org.openmetadata.catalog.jdbi3.UserRepository;
import org.openmetadata.catalog.resources.Collection;
import org.openmetadata.catalog.resources.EntityResource;
import org.openmetadata.catalog.security.Authorizer;
import org.openmetadata.catalog.security.SecurityUtil;
import org.openmetadata.catalog.security.jwt.JWTTokenGenerator;
import org.openmetadata.catalog.teams.authn.GenerateTokenRequest;
import org.openmetadata.catalog.teams.authn.JWTAuthMechanism;
import org.openmetadata.catalog.teams.authn.JWTTokenExpiry;
import org.openmetadata.catalog.type.EntityHistory;
import org.openmetadata.catalog.type.Include;
import org.openmetadata.catalog.util.EntityUtil.Fields;
import org.openmetadata.catalog.util.JsonUtils;
import org.openmetadata.catalog.util.RestUtil;
import org.openmetadata.catalog.util.ResultList;

@Slf4j
@Path("/v1/users")
@Api(value = "User collection", tags = "User collection")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@Collection(name = "users")
public class UserResource extends EntityResource<User, UserRepository> {
  public static final String COLLECTION_PATH = "v1/users/";
  public static final String USER_PROTECTED_FIELDS = "authenticationMechanism";
  private final JWTTokenGenerator jwtTokenGenerator;

  @Override
  public User addHref(UriInfo uriInfo, User user) {
    Entity.withHref(uriInfo, user.getTeams());
    Entity.withHref(uriInfo, user.getRoles());
    Entity.withHref(uriInfo, user.getInheritedRoles());
    Entity.withHref(uriInfo, user.getOwns());
    Entity.withHref(uriInfo, user.getFollows());
    return user;
  }

  public UserResource(CollectionDAO dao, Authorizer authorizer) {
    super(User.class, new UserRepository(dao), authorizer);
    jwtTokenGenerator = JWTTokenGenerator.getInstance();
    allowedFields.remove(USER_PROTECTED_FIELDS);
  }

  public static class UserList extends ResultList<User> {
    @SuppressWarnings("unused") // Used for deserialization
    public UserList() {}

    public UserList(List<User> users, String beforeCursor, String afterCursor, int total) {
      super(users, beforeCursor, afterCursor, total);
    }
  }

  static final String FIELDS = "profile,roles,teams,follows,owns";

  @GET
  @Valid
  @Operation(
      operationId = "listUsers",
      summary = "List users",
      tags = "users",
      description =
          "Get a list of users. Use `fields` "
              + "parameter to get only necessary fields. Use cursor-based pagination to limit the number "
              + "entries in the list using `limit` and `before` or `after` query params.",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "The user ",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = UserList.class)))
      })
  public ResultList<User> list(
      @Context UriInfo uriInfo,
      @Context SecurityContext securityContext,
      @Parameter(
              description = "Fields requested in the returned resource",
              schema = @Schema(type = "string", example = FIELDS))
          @QueryParam("fields")
          String fieldsParam,
      @Parameter(description = "Filter users by team", schema = @Schema(type = "string", example = "Legal"))
          @QueryParam("team")
          String teamParam,
      @Parameter(description = "Limit the number users returned. (1 to 1000000, default = 10)")
          @DefaultValue("10")
          @Min(0)
          @Max(1000000)
          @QueryParam("limit")
          int limitParam,
      @Parameter(description = "Returns list of users before this cursor", schema = @Schema(type = "string"))
          @QueryParam("before")
          String before,
      @Parameter(description = "Returns list of users after this cursor", schema = @Schema(type = "string"))
          @QueryParam("after")
          String after,
      @Parameter(description = "Returns list of admin users if set to true", schema = @Schema(type = "boolean"))
          @QueryParam("isAdmin")
          Boolean isAdmin,
      @Parameter(description = "Returns list of bot users if set to true", schema = @Schema(type = "boolean"))
          @QueryParam("isBot")
          Boolean isBot,
      @Parameter(
              description = "Include all, deleted, or non-deleted entities.",
              schema = @Schema(implementation = Include.class))
          @QueryParam("include")
          @DefaultValue("non-deleted")
          Include include)
      throws IOException {
    ListFilter filter = new ListFilter(include).addQueryParam("team", teamParam);
    if (isAdmin != null) {
      filter.addQueryParam("isAdmin", String.valueOf(isAdmin));
    }
    if (isBot != null) {
      filter.addQueryParam("isBot", String.valueOf(isBot));
    }
    return super.listInternal(uriInfo, securityContext, fieldsParam, filter, limitParam, before, after);
  }

  @GET
  @Path("/{id}/versions")
  @Operation(
      operationId = "listAllUserVersion",
      summary = "List user versions",
      tags = "users",
      description = "Get a list of all the versions of a user identified by `id`",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "List of user versions",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = EntityHistory.class)))
      })
  public EntityHistory listVersions(
      @Context UriInfo uriInfo,
      @Context SecurityContext securityContext,
      @Parameter(description = "user Id", schema = @Schema(type = "string")) @PathParam("id") String id)
      throws IOException {
    return dao.listVersions(id);
  }

  @GET
  @Valid
  @Path("/{id}")
  @Operation(
      operationId = "getUserByID",
      summary = "Get a user",
      tags = "users",
      description = "Get a user by `id`",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "The user",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = User.class))),
        @ApiResponse(responseCode = "404", description = "User for instance {id} is not found")
      })
  public User get(
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
      operationId = "getUserByFQN",
      summary = "Get a user by name",
      tags = "users",
      description = "Get a user by `name`.",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "The user",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = User.class))),
        @ApiResponse(responseCode = "404", description = "User for instance {id} is not found")
      })
  public User getByName(
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
  @Valid
  @Path("/loggedInUser")
  @Operation(
      operationId = "getCurrentLoggedInUser",
      summary = "Get current logged in user",
      tags = "users",
      description = "Get the user who is authenticated and is currently logged in.",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "The user",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = User.class))),
        @ApiResponse(responseCode = "404", description = "User not found")
      })
  public User getCurrentLoggedInUser(
      @Context UriInfo uriInfo,
      @Context SecurityContext securityContext,
      @Parameter(
              description = "Fields requested in the returned resource",
              schema = @Schema(type = "string", example = FIELDS))
          @QueryParam("fields")
          String fieldsParam)
      throws IOException {
    Fields fields = getFields(fieldsParam);
    String currentUserName = securityContext.getUserPrincipal().getName();
    User user = dao.getByName(uriInfo, currentUserName, fields);
    return addHref(uriInfo, user);
  }

  @GET
  @Path("/{id}/versions/{version}")
  @Operation(
      operationId = "getSpecificUserVersion",
      summary = "Get a version of the user",
      tags = "users",
      description = "Get a version of the user by given `id`",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "user",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = User.class))),
        @ApiResponse(
            responseCode = "404",
            description = "User for instance {id} and version {version} is " + "not found")
      })
  public User getVersion(
      @Context UriInfo uriInfo,
      @Context SecurityContext securityContext,
      @Parameter(description = "User Id", schema = @Schema(type = "string")) @PathParam("id") String id,
      @Parameter(
              description = "User version number in the form `major`.`minor`",
              schema = @Schema(type = "string", example = "0.1 or 1.1"))
          @PathParam("version")
          String version)
      throws IOException {
    return dao.getVersion(id, version);
  }

  @POST
  @Operation(
      operationId = "createUser",
      summary = "Create a user",
      tags = "users",
      description = "Create a new user.",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "The user ",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = User.class))),
        @ApiResponse(responseCode = "400", description = "Bad request")
      })
  public Response createUser(
      @Context UriInfo uriInfo, @Context SecurityContext securityContext, @Valid CreateUser create) throws IOException {
    User user = getUser(securityContext, create);
    if (Boolean.TRUE.equals(create.getIsAdmin())) {
      SecurityUtil.authorizeAdmin(authorizer, securityContext, ADMIN | BOT);
    }
    // TODO do we need to authenticate user is creating himself?
    addHref(uriInfo, dao.create(uriInfo, user));
    return Response.created(user.getHref()).entity(user).build();
  }

  @PUT
  @Operation(
      summary = "Update user",
      tags = "users",
      description = "Create or Update a user.",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "The user ",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = CreateUser.class))),
        @ApiResponse(responseCode = "400", description = "Bad request")
      })
  public Response createOrUpdateUser(
      @Context UriInfo uriInfo, @Context SecurityContext securityContext, @Valid CreateUser create) throws IOException {
    User user = getUser(securityContext, create);
    if (Boolean.TRUE.equals(create.getIsAdmin()) || Boolean.TRUE.equals(create.getIsBot())) {
      SecurityUtil.authorizeAdmin(authorizer, securityContext, ADMIN | BOT);
    } else {
      SecurityUtil.authorize(authorizer, securityContext, null, user.getEntityReference(), ADMIN | BOT | OWNER);
    }
    RestUtil.PutResponse<User> response = dao.createOrUpdate(uriInfo, user);
    addHref(uriInfo, response.getEntity());
    return response.toResponse();
  }

  @PUT
  @Path("/generateToken/{id}")
  @Operation(
      operationId = "generateJWTTokenForBotUser",
      summary = "Generate JWT Token for a Bot User",
      tags = "users",
      description = "Generate JWT Token for a Bot User.",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "The user ",
            content =
                @Content(mediaType = "application/json", schema = @Schema(implementation = JWTTokenExpiry.class))),
        @ApiResponse(responseCode = "400", description = "Bad request")
      })
  public JWTAuthMechanism generateToken(
      @Context UriInfo uriInfo,
      @Context SecurityContext securityContext,
      @PathParam("id") String id,
      @Valid GenerateTokenRequest generateTokenRequest)
      throws IOException {

    User user = dao.get(uriInfo, id, Fields.EMPTY_FIELDS);
    if (!user.getIsBot()) {
      throw new IllegalArgumentException("Generating JWT token is only supported for bot users");
    }
    SecurityUtil.authorizeAdmin(authorizer, securityContext, ADMIN);
    JWTAuthMechanism jwtAuthMechanism =
        jwtTokenGenerator.generateJWTToken(user, generateTokenRequest.getJWTTokenExpiry());
    AuthenticationMechanism authenticationMechanism =
        new AuthenticationMechanism().withConfig(jwtAuthMechanism).withAuthType(AuthenticationMechanism.AuthType.JWT);
    user.setAuthenticationMechanism(authenticationMechanism);
    User updatedUser = dao.createOrUpdate(uriInfo, user).getEntity();
    jwtAuthMechanism =
        JsonUtils.convertValue(updatedUser.getAuthenticationMechanism().getConfig(), JWTAuthMechanism.class);
    return jwtAuthMechanism;
  }

  @PUT
  @Path("/revokeToken/{id}")
  @Operation(
      operationId = "revokeJWTTokenForBotUser",
      summary = "Revoke JWT Token for a Bot User",
      tags = "users",
      description = "Revoke JWT Token for a Bot User.",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "The user ",
            content =
                @Content(mediaType = "application/json", schema = @Schema(implementation = JWTAuthMechanism.class))),
        @ApiResponse(responseCode = "400", description = "Bad request")
      })
  public Response revokeToken(
      @Context UriInfo uriInfo, @Context SecurityContext securityContext, @PathParam("id") String id)
      throws IOException {

    User user = dao.get(uriInfo, id, Fields.EMPTY_FIELDS);
    if (!user.getIsBot()) {
      throw new IllegalArgumentException("Generating JWT token is only supported for bot users");
    }
    SecurityUtil.authorizeAdmin(authorizer, securityContext, ADMIN);
    JWTAuthMechanism jwtAuthMechanism = new JWTAuthMechanism().withJWTToken(StringUtils.EMPTY);
    AuthenticationMechanism authenticationMechanism =
        new AuthenticationMechanism().withConfig(jwtAuthMechanism).withAuthType(AuthenticationMechanism.AuthType.JWT);
    user.setAuthenticationMechanism(authenticationMechanism);
    RestUtil.PutResponse<User> response = dao.createOrUpdate(uriInfo, user);
    addHref(uriInfo, response.getEntity());
    return response.toResponse();
  }

  @GET
  @Path("/token/{id}")
  @Operation(
      operationId = "getJWTTokenForBotUser",
      summary = "Get JWT Token for a Bot User",
      tags = "users",
      description = "Get JWT Token for a Bot User.",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "The user ",
            content =
                @Content(mediaType = "application/json", schema = @Schema(implementation = JWTAuthMechanism.class))),
        @ApiResponse(responseCode = "400", description = "Bad request")
      })
  public JWTAuthMechanism getToken(
      @Context UriInfo uriInfo, @Context SecurityContext securityContext, @PathParam("id") String id)
      throws IOException {

    User user = dao.get(uriInfo, id, new Fields(List.of("authenticationMechanism")));
    if (!user.getIsBot()) {
      throw new IllegalArgumentException("JWT token is only supported for bot users");
    }
    SecurityUtil.authorizeAdmin(authorizer, securityContext, ADMIN);
    AuthenticationMechanism authenticationMechanism = user.getAuthenticationMechanism();
    if (authenticationMechanism != null
        && authenticationMechanism.getConfig() != null
        && authenticationMechanism.getAuthType() == AuthenticationMechanism.AuthType.JWT) {
      return JsonUtils.convertValue(authenticationMechanism.getConfig(), JWTAuthMechanism.class);
    }
    return new JWTAuthMechanism();
  }

  @PATCH
  @Path("/{id}")
  @Consumes(MediaType.APPLICATION_JSON_PATCH_JSON)
  @Operation(
      operationId = "patchUser",
      summary = "Update a user",
      tags = "users",
      description = "Update an existing user using JsonPatch.",
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
    for (JsonValue patchOp : patch.toJsonArray()) {
      JsonObject patchOpObject = patchOp.asJsonObject();
      if (patchOpObject.containsKey("path") && patchOpObject.containsKey("value")) {
        String path = patchOpObject.getString("path");
        if (path.equals("/isAdmin") || path.equals("/isBot")) {
          SecurityUtil.authorizeAdmin(authorizer, securityContext, ADMIN | BOT);
        }
        // if path contains team, check if team is joinable by any user
        if (patchOpObject.containsKey("op")
            && patchOpObject.getString("op").equals("add")
            && path.startsWith("/teams/")) {
          JsonObject value = null;
          try {
            value = patchOpObject.getJsonObject("value");
          } catch (Exception ex) {
            // ignore exception if value is not an object
          }
          if (value != null) {
            String teamId = value.getString("id");
            dao.validateTeamAddition(id, teamId);
            if (!dao.isTeamJoinable(teamId)) {
              // Only admin can join closed teams
              SecurityUtil.authorizeAdmin(authorizer, securityContext, ADMIN);
            }
          }
        }
      }
    }
    return patchInternal(uriInfo, securityContext, id, patch);
  }

  @DELETE
  @Path("/{id}")
  @Operation(
      operationId = "deleteUser",
      summary = "Delete a user",
      tags = "users",
      description = "Users can't be deleted but are soft-deleted.",
      responses = {
        @ApiResponse(responseCode = "200", description = "OK"),
        @ApiResponse(responseCode = "404", description = "User for instance {id} is not found")
      })
  public Response delete(
      @Context UriInfo uriInfo,
      @Context SecurityContext securityContext,
      @Parameter(description = "Hard delete the entity. (Default = `false`)")
          @QueryParam("hardDelete")
          @DefaultValue("false")
          boolean hardDelete,
      @Parameter(description = "User Id", schema = @Schema(type = "string")) @PathParam("id") String id)
      throws IOException {
    return delete(uriInfo, securityContext, id, false, hardDelete, ADMIN | BOT);
  }

  private User getUser(SecurityContext securityContext, CreateUser create) {
    return new User()
        .withId(UUID.randomUUID())
        .withName(create.getName())
        .withFullyQualifiedName(create.getName())
        .withEmail(create.getEmail())
        .withDescription(create.getDescription())
        .withDisplayName(create.getDisplayName())
        .withIsBot(create.getIsBot())
        .withIsAdmin(create.getIsAdmin())
        .withProfile(create.getProfile())
        .withTimezone(create.getTimezone())
        .withUpdatedBy(securityContext.getUserPrincipal().getName())
        .withUpdatedAt(System.currentTimeMillis())
        .withTeams(dao.toEntityReferences(create.getTeams(), Entity.TEAM))
        .withRoles(dao.toEntityReferences(create.getRoles(), Entity.ROLE));
  }
}
