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

package org.openmetadata.catalog.resources.services.dashboard;

import static org.openmetadata.catalog.Entity.FIELD_OWNER;
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
import org.openmetadata.catalog.Entity;
import org.openmetadata.catalog.api.services.CreateDashboardService;
import org.openmetadata.catalog.entity.services.DashboardService;
import org.openmetadata.catalog.fernet.Fernet;
import org.openmetadata.catalog.jdbi3.CollectionDAO;
import org.openmetadata.catalog.jdbi3.DashboardServiceRepository;
import org.openmetadata.catalog.jdbi3.ListFilter;
import org.openmetadata.catalog.resources.Collection;
import org.openmetadata.catalog.resources.EntityResource;
import org.openmetadata.catalog.security.AuthorizationException;
import org.openmetadata.catalog.security.Authorizer;
import org.openmetadata.catalog.security.SecurityUtil;
import org.openmetadata.catalog.type.EntityHistory;
import org.openmetadata.catalog.type.Include;
import org.openmetadata.catalog.util.JsonUtils;
import org.openmetadata.catalog.util.RestUtil;
import org.openmetadata.catalog.util.ResultList;

@Path("/v1/services/dashboardServices")
@Api(value = "Dashboard service collection", tags = "Services -> Dashboard service collection")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@Collection(name = "dashboardServices")
public class DashboardServiceResource extends EntityResource<DashboardService, DashboardServiceRepository> {
  public static final String COLLECTION_PATH = "v1/services/dashboardServices";

  static final String FIELDS = FIELD_OWNER;
  private final Fernet fernet;

  @Override
  public DashboardService addHref(UriInfo uriInfo, DashboardService service) {
    service.setHref(RestUtil.getHref(uriInfo, COLLECTION_PATH, service.getId()));
    Entity.withHref(uriInfo, service.getOwner());
    return service;
  }

  public DashboardServiceResource(CollectionDAO dao, Authorizer authorizer) {
    super(DashboardService.class, new DashboardServiceRepository(dao), authorizer);
    this.fernet = Fernet.getInstance();
  }

  public static class DashboardServiceList extends ResultList<DashboardService> {
    @SuppressWarnings("unused") /* Required for tests */
    public DashboardServiceList() {}

    public DashboardServiceList(List<DashboardService> data, String beforeCursor, String afterCursor, int total) {
      super(data, beforeCursor, afterCursor, total);
    }
  }

  @GET
  @Operation(
      operationId = "listDashboardsService",
      summary = "List dashboard services",
      tags = "dashboardServices",
      description = "Get a list of dashboard services.",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "List of dashboard service instances",
            content =
                @Content(mediaType = "application/json", schema = @Schema(implementation = DashboardServiceList.class)))
      })
  public ResultList<DashboardService> list(
      @Context UriInfo uriInfo,
      @Context SecurityContext securityContext,
      @QueryParam("name") String name,
      @Parameter(
              description = "Fields requested in the returned resource",
              schema = @Schema(type = "string", example = FIELDS))
          @QueryParam("fields")
          String fieldsParam,
      @DefaultValue("10") @Min(0) @Max(1000000) @QueryParam("limit") int limitParam,
      @Parameter(
              description = "Returns list of dashboard services before this cursor",
              schema = @Schema(type = "string"))
          @QueryParam("before")
          String before,
      @Parameter(
              description = "Returns list of dashboard services after this cursor",
              schema = @Schema(type = "string"))
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
    ResultList<DashboardService> dashboardServices =
        super.listInternal(uriInfo, null, fieldsParam, filter, limitParam, before, after);
    return addHref(uriInfo, decryptOrNullify(securityContext, dashboardServices));
  }

  @GET
  @Path("/{id}")
  @Operation(
      operationId = "getDashboardServiceByID",
      summary = "Get a dashboard service",
      tags = "dashboardServices",
      description = "Get a dashboard service by `id`.",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "Dashboard service instance",
            content =
                @Content(mediaType = "application/json", schema = @Schema(implementation = DashboardService.class))),
        @ApiResponse(responseCode = "404", description = "Dashboard service for instance {id} is not found")
      })
  public DashboardService get(
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
    DashboardService dashboardService = getInternal(uriInfo, securityContext, id, fieldsParam, include);
    return decryptOrNullify(securityContext, dashboardService);
  }

  @GET
  @Path("/name/{name}")
  @Operation(
      operationId = "getDashboardServiceByFQN",
      summary = "Get dashboard service by name",
      tags = "dashboardServices",
      description = "Get a dashboard service by the service `name`.",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "Dashboard service instance",
            content =
                @Content(mediaType = "application/json", schema = @Schema(implementation = DashboardService.class))),
        @ApiResponse(responseCode = "404", description = "Dashboard service for instance {id} is not found")
      })
  public DashboardService getByName(
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
    DashboardService dashboardService = getByNameInternal(uriInfo, securityContext, name, fieldsParam, include);
    return decryptOrNullify(securityContext, dashboardService);
  }

  @GET
  @Path("/{id}/versions")
  @Operation(
      operationId = "listAllDashboardServiceVersion",
      summary = "List dashboard service versions",
      tags = "dashboardServices",
      description = "Get a list of all the versions of a dashboard service identified by `id`",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "List of dashboard service versions",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = EntityHistory.class)))
      })
  public EntityHistory listVersions(
      @Context UriInfo uriInfo,
      @Context SecurityContext securityContext,
      @Parameter(description = "dashboard service Id", schema = @Schema(type = "string")) @PathParam("id") String id)
      throws IOException {
    EntityHistory entityHistory = dao.listVersions(id);
    List<Object> versions =
        entityHistory.getVersions().stream()
            .map(
                json -> {
                  try {
                    DashboardService dashboardService = JsonUtils.readValue((String) json, DashboardService.class);
                    return JsonUtils.pojoToJson(decryptOrNullify(securityContext, dashboardService));
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
      operationId = "getSpecificDashboardServiceVersion",
      summary = "Get a version of the dashboard service",
      tags = "dashboardServices",
      description = "Get a version of the dashboard service by given `id`",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "dashboard service",
            content =
                @Content(mediaType = "application/json", schema = @Schema(implementation = DashboardService.class))),
        @ApiResponse(
            responseCode = "404",
            description = "Dashboard service for instance {id} and version " + "{version} is not found")
      })
  public DashboardService getVersion(
      @Context UriInfo uriInfo,
      @Context SecurityContext securityContext,
      @Parameter(description = "dashboard service Id", schema = @Schema(type = "string")) @PathParam("id") String id,
      @Parameter(
              description = "dashboard service version number in the form `major`" + ".`minor`",
              schema = @Schema(type = "string", example = "0.1 or 1.1"))
          @PathParam("version")
          String version)
      throws IOException {
    DashboardService dashboardService = dao.getVersion(id, version);
    return decryptOrNullify(securityContext, dashboardService);
  }

  @POST
  @Operation(
      operationId = "createDashboardService",
      summary = "Create a dashboard service",
      tags = "dashboardServices",
      description = "Create a new dashboard service.",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "Dashboard service instance",
            content =
                @Content(mediaType = "application/json", schema = @Schema(implementation = DashboardService.class))),
        @ApiResponse(responseCode = "400", description = "Bad request")
      })
  public Response create(
      @Context UriInfo uriInfo, @Context SecurityContext securityContext, @Valid CreateDashboardService create)
      throws IOException {
    DashboardService service = getService(create, securityContext.getUserPrincipal().getName());
    Response response = create(uriInfo, securityContext, service, ADMIN | BOT);
    decryptOrNullify(securityContext, (DashboardService) response.getEntity());
    return response;
  }

  @PUT
  @Operation(
      operationId = "createOrUpdateDashboardService",
      summary = "Update a Dashboard service",
      tags = "dashboardServices",
      description = "Update an existing dashboard service identified by `id`.",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "Dashboard service instance",
            content =
                @Content(mediaType = "application/json", schema = @Schema(implementation = DashboardService.class))),
        @ApiResponse(responseCode = "400", description = "Bad request")
      })
  public Response createOrUpdate(
      @Context UriInfo uriInfo, @Context SecurityContext securityContext, @Valid CreateDashboardService update)
      throws IOException {
    DashboardService service = getService(update, securityContext.getUserPrincipal().getName());
    Response response = createOrUpdate(uriInfo, securityContext, service, ADMIN | BOT | OWNER);
    decryptOrNullify(securityContext, (DashboardService) response.getEntity());
    return response;
  }

  @DELETE
  @Path("/{id}")
  @Operation(
      operationId = "deleteDashboardService",
      summary = "Delete a Dashboard service",
      tags = "dashboardServices",
      description =
          "Delete a Dashboard services. If dashboard (and charts) belong to the service, it can't be " + "deleted.",
      responses = {
        @ApiResponse(responseCode = "200", description = "OK"),
        @ApiResponse(responseCode = "404", description = "DashboardService service for instance {id} " + "is not found")
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
      @Parameter(description = "Id of the dashboard service", schema = @Schema(type = "string")) @PathParam("id")
          String id)
      throws IOException {
    return delete(uriInfo, securityContext, id, recursive, hardDelete, ADMIN | BOT);
  }

  private DashboardService getService(CreateDashboardService create, String user) {
    return copy(new DashboardService(), create, user)
        .withServiceType(create.getServiceType())
        .withConnection(create.getConnection());
  }

  private ResultList<DashboardService> decryptOrNullify(
      SecurityContext securityContext, ResultList<DashboardService> dashboardServices) {
    Optional.ofNullable(dashboardServices.getData())
        .orElse(Collections.emptyList())
        .forEach(dashboardService -> decryptOrNullify(securityContext, dashboardService));
    return dashboardServices;
  }

  private DashboardService decryptOrNullify(SecurityContext securityContext, DashboardService dashboardService) {
    try {
      SecurityUtil.authorizeAdmin(authorizer, securityContext, ADMIN | BOT);
    } catch (AuthorizationException e) {
      return dashboardService.withConnection(null);
    }
    fernet.encryptOrDecryptDashboardConnection(
        dashboardService.getConnection(), dashboardService.getServiceType(), false);
    return dashboardService;
  }
}
