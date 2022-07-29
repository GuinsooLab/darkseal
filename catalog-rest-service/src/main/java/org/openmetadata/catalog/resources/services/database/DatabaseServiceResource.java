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

package org.openmetadata.catalog.resources.services.database;

import static org.openmetadata.catalog.security.SecurityUtil.ADMIN;
import static org.openmetadata.catalog.security.SecurityUtil.BOT;
import static org.openmetadata.catalog.security.SecurityUtil.OWNER;

import io.swagger.annotations.Api;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import java.io.IOException;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
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
import org.openmetadata.catalog.Entity;
import org.openmetadata.catalog.api.services.CreateDatabaseService;
import org.openmetadata.catalog.entity.services.DatabaseService;
import org.openmetadata.catalog.fernet.Fernet;
import org.openmetadata.catalog.jdbi3.CollectionDAO;
import org.openmetadata.catalog.jdbi3.DatabaseServiceRepository;
import org.openmetadata.catalog.jdbi3.ListFilter;
import org.openmetadata.catalog.resources.Collection;
import org.openmetadata.catalog.resources.EntityResource;
import org.openmetadata.catalog.security.AuthorizationException;
import org.openmetadata.catalog.security.Authorizer;
import org.openmetadata.catalog.security.SecurityUtil;
import org.openmetadata.catalog.type.EntityHistory;
import org.openmetadata.catalog.type.Include;
import org.openmetadata.catalog.util.EntityUtil;
import org.openmetadata.catalog.util.JsonUtils;
import org.openmetadata.catalog.util.RestUtil;
import org.openmetadata.catalog.util.ResultList;

@Slf4j
@Path("/v1/services/databaseServices")
@Api(value = "Database service collection", tags = "Services -> Database service collection")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@Collection(name = "databaseServices")
public class DatabaseServiceResource extends EntityResource<DatabaseService, DatabaseServiceRepository> {
  public static final String COLLECTION_PATH = "v1/services/databaseServices/";
  private final Fernet fernet;

  static final String FIELDS = "pipelines,owner";

  @Override
  public DatabaseService addHref(UriInfo uriInfo, DatabaseService service) {
    service.setHref(RestUtil.getHref(uriInfo, COLLECTION_PATH, service.getId()));
    Entity.withHref(uriInfo, service.getOwner());
    Entity.withHref(uriInfo, service.getPipelines());
    return service;
  }

  public DatabaseServiceResource(CollectionDAO dao, Authorizer authorizer) {
    super(DatabaseService.class, new DatabaseServiceRepository(dao), authorizer);
    this.fernet = Fernet.getInstance();
  }

  public static class DatabaseServiceList extends ResultList<DatabaseService> {
    @SuppressWarnings("unused") /* Required for tests */
    public DatabaseServiceList() {}

    public DatabaseServiceList(List<DatabaseService> data, String beforeCursor, String afterCursor, int total) {
      super(data, beforeCursor, afterCursor, total);
    }
  }

  @GET
  @Operation(
      operationId = "listDatabaseServices",
      summary = "List database services",
      tags = "databaseService",
      description = "Get a list of database services.",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "List of database service instances",
            content =
                @Content(mediaType = "application/json", schema = @Schema(implementation = DatabaseServiceList.class)))
      })
  public ResultList<DatabaseService> list(
      @Context UriInfo uriInfo,
      @Context SecurityContext securityContext,
      @Parameter(
              description = "Fields requested in the returned resource",
              schema = @Schema(type = "string", example = FIELDS))
          @QueryParam("fields")
          String fieldsParam,
      @DefaultValue("10") @Min(0) @Max(1000000) @QueryParam("limit") int limitParam,
      @Parameter(
              description = "Returns list of database services before this cursor",
              schema = @Schema(type = "string"))
          @QueryParam("before")
          String before,
      @Parameter(description = "Returns list of database services after this cursor", schema = @Schema(type = "string"))
          @QueryParam("after")
          String after,
      @Parameter(
              description = "Include all, deleted, or non-deleted entities.",
              schema = @Schema(implementation = Include.class))
          @QueryParam("include")
          @DefaultValue("non-deleted")
          Include include)
      throws IOException {
    RestUtil.validateCursors(before, after);
    EntityUtil.Fields fields = getFields(fieldsParam);
    ResultList<DatabaseService> dbServices;

    ListFilter filter = new ListFilter(include);
    if (before != null) {
      dbServices = dao.listBefore(uriInfo, fields, filter, limitParam, before);
    } else {
      dbServices = dao.listAfter(uriInfo, fields, filter, limitParam, after);
    }
    return addHref(uriInfo, decryptOrNullify(securityContext, dbServices));
  }

  @GET
  @Path("/{id}")
  @Operation(
      operationId = "getDatabaseServiceByID",
      summary = "Get a database service",
      tags = "databaseService",
      description = "Get a database service by `id`.",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "Database service instance",
            content =
                @Content(mediaType = "application/json", schema = @Schema(implementation = DatabaseService.class))),
        @ApiResponse(responseCode = "404", description = "Database service for instance {id} is not found")
      })
  public DatabaseService get(
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
    DatabaseService databaseService = getInternal(uriInfo, securityContext, id, fieldsParam, include);
    return decryptOrNullify(securityContext, databaseService);
  }

  @GET
  @Path("/name/{name}")
  @Operation(
      operationId = "getDatabaseServiceByFQN",
      summary = "Get database service by name",
      tags = "databaseService",
      description = "Get a database service by the service `name`.",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "Database service instance",
            content =
                @Content(mediaType = "application/json", schema = @Schema(implementation = DatabaseService.class))),
        @ApiResponse(responseCode = "404", description = "Database service for instance {id} is not found")
      })
  public DatabaseService getByName(
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
    DatabaseService databaseService = getByNameInternal(uriInfo, securityContext, name, fieldsParam, include);
    return decryptOrNullify(securityContext, databaseService);
  }

  @GET
  @Path("/{id}/versions")
  @Operation(
      operationId = "listAllDatabaseServiceVersion",
      summary = "List database service versions",
      tags = "databaseService",
      description = "Get a list of all the versions of a database service identified by `id`",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "List of database service versions",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = EntityHistory.class)))
      })
  public EntityHistory listVersions(
      @Context UriInfo uriInfo,
      @Context SecurityContext securityContext,
      @Parameter(description = "database service Id", schema = @Schema(type = "string")) @PathParam("id") String id)
      throws IOException {
    EntityHistory entityHistory = dao.listVersions(id);
    List<Object> versions =
        entityHistory.getVersions().stream()
            .map(
                json -> {
                  try {
                    DatabaseService databaseService = JsonUtils.readValue((String) json, DatabaseService.class);
                    return JsonUtils.pojoToJson(decryptOrNullify(securityContext, databaseService));
                  } catch (IOException e) {
                    return json;
                  }
                })
            .collect(Collectors.toList());
    entityHistory.setVersions(versions);
    return entityHistory;
  }

  @GET
  @Path("/{id}/versions/{version}")
  @Operation(
      operationId = "getSpecificDatabaseServiceVersion",
      summary = "Get a version of the database service",
      tags = "databaseService",
      description = "Get a version of the database service by given `id`",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "database service",
            content =
                @Content(mediaType = "application/json", schema = @Schema(implementation = DatabaseService.class))),
        @ApiResponse(
            responseCode = "404",
            description = "Database service for instance {id} and version " + "{version} is not found")
      })
  public DatabaseService getVersion(
      @Context UriInfo uriInfo,
      @Context SecurityContext securityContext,
      @Parameter(description = "database service Id", schema = @Schema(type = "string")) @PathParam("id") String id,
      @Parameter(
              description = "database service version number in the form `major`" + ".`minor`",
              schema = @Schema(type = "string", example = "0.1 or 1.1"))
          @PathParam("version")
          String version)
      throws IOException {
    DatabaseService databaseService = dao.getVersion(id, version);
    return decryptOrNullify(securityContext, databaseService);
  }

  @POST
  @Operation(
      operationId = "createDatabaseService",
      summary = "Create database service",
      tags = "databaseService",
      description = "Create a new database service.",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "Database service instance",
            content =
                @Content(mediaType = "application/json", schema = @Schema(implementation = DatabaseService.class))),
        @ApiResponse(responseCode = "400", description = "Bad request")
      })
  public Response create(
      @Context UriInfo uriInfo, @Context SecurityContext securityContext, @Valid CreateDatabaseService create)
      throws IOException {
    DatabaseService service = getService(create, securityContext.getUserPrincipal().getName());
    Response response = create(uriInfo, securityContext, service, ADMIN | BOT);
    decryptOrNullify(securityContext, (DatabaseService) response.getEntity());
    return response;
  }

  @PUT
  @Operation(
      operationId = "createOrUpdateDatabaseService",
      summary = "Update database service",
      tags = "databaseService",
      description = "Update an existing or create a new database service.",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "Database service instance",
            content =
                @Content(mediaType = "application/json", schema = @Schema(implementation = DatabaseService.class))),
        @ApiResponse(responseCode = "400", description = "Bad request")
      })
  public Response createOrUpdate(
      @Context UriInfo uriInfo, @Context SecurityContext securityContext, @Valid CreateDatabaseService update)
      throws IOException {
    DatabaseService service = getService(update, securityContext.getUserPrincipal().getName());
    Response response = createOrUpdate(uriInfo, securityContext, service, ADMIN | BOT | OWNER);
    decryptOrNullify(securityContext, (DatabaseService) response.getEntity());
    return response;
  }

  @DELETE
  @Path("/{id}")
  @Operation(
      operationId = "deleteDatabaseService",
      summary = "Delete a database service",
      tags = "databaseService",
      description =
          "Delete a database services. If databases (and tables) belong the service, it can't be " + "deleted.",
      responses = {
        @ApiResponse(responseCode = "200", description = "OK"),
        @ApiResponse(responseCode = "404", description = "DatabaseService service for instance {id} " + "is not found")
      })
  public Response delete(
      @Context UriInfo uriInfo,
      @Context SecurityContext securityContext,
      @Parameter(description = "Recursively delete this entity and it's children. (Default `false`)")
          @DefaultValue("false")
          @QueryParam("recursive")
          boolean recursive,
      @Parameter(description = "Hard delete the entity. (Default = `false`)")
          @QueryParam("hardDelete")
          @DefaultValue("false")
          boolean hardDelete,
      @Parameter(description = "Id of the database service", schema = @Schema(type = "string")) @PathParam("id")
          String id)
      throws IOException {
    return delete(uriInfo, securityContext, id, recursive, hardDelete, ADMIN | BOT);
  }

  private DatabaseService getService(CreateDatabaseService create, String user) {
    return copy(new DatabaseService(), create, user)
        .withServiceType(create.getServiceType())
        .withConnection(create.getConnection());
  }

  private ResultList<DatabaseService> decryptOrNullify(
      SecurityContext securityContext, ResultList<DatabaseService> databaseServices) {
    Optional.ofNullable(databaseServices.getData())
        .orElse(Collections.emptyList())
        .forEach(databaseService -> decryptOrNullify(securityContext, databaseService));
    return databaseServices;
  }

  private DatabaseService decryptOrNullify(SecurityContext securityContext, DatabaseService databaseService) {
    try {
      SecurityUtil.authorizeAdmin(authorizer, securityContext, ADMIN | BOT);
    } catch (AuthorizationException e) {
      return databaseService.withConnection(null);
    }
    fernet.encryptOrDecryptDatabaseConnection(databaseService.getConnection(), databaseService.getServiceType(), false);
    return databaseService;
  }
}
