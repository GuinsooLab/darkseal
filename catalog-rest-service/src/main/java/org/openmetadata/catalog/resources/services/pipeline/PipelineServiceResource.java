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

package org.openmetadata.catalog.resources.services.pipeline;

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
import org.openmetadata.catalog.api.services.CreatePipelineService;
import org.openmetadata.catalog.entity.services.PipelineService;
import org.openmetadata.catalog.fernet.Fernet;
import org.openmetadata.catalog.jdbi3.CollectionDAO;
import org.openmetadata.catalog.jdbi3.ListFilter;
import org.openmetadata.catalog.jdbi3.PipelineServiceRepository;
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

@Path("/v1/services/pipelineServices")
@Api(value = "Pipeline service collection", tags = "Services -> Pipeline service collection")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@Collection(name = "pipelineServices")
public class PipelineServiceResource extends EntityResource<PipelineService, PipelineServiceRepository> {
  public static final String COLLECTION_PATH = "v1/services/pipelineServices/";

  static final String FIELDS = "pipelines,owner";
  private final Fernet fernet;

  @Override
  public PipelineService addHref(UriInfo uriInfo, PipelineService service) {
    service.setHref(RestUtil.getHref(uriInfo, COLLECTION_PATH, service.getId()));
    Entity.withHref(uriInfo, service.getOwner());
    Entity.withHref(uriInfo, service.getPipelines());
    return service;
  }

  public PipelineServiceResource(CollectionDAO dao, Authorizer authorizer) {
    super(PipelineService.class, new PipelineServiceRepository(dao), authorizer);
    fernet = Fernet.getInstance();
  }

  public static class PipelineServiceList extends ResultList<PipelineService> {
    @SuppressWarnings("unused") /* Required for tests */
    public PipelineServiceList() {}

    public PipelineServiceList(List<PipelineService> data, String beforeCursor, String afterCursor, int total) {
      super(data, beforeCursor, afterCursor, total);
    }
  }

  @GET
  @Operation(
      operationId = "listPipelineService",
      summary = "List pipeline services",
      tags = "pipelineService",
      description =
          "Get a list of pipeline services. Use cursor-based pagination to limit the number "
              + "entries in the list using `limit` and `before` or `after` query params.",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "List of pipeline services",
            content =
                @Content(mediaType = "application/json", schema = @Schema(implementation = PipelineServiceList.class)))
      })
  public ResultList<PipelineService> list(
      @Context UriInfo uriInfo,
      @Context SecurityContext securityContext,
      @Parameter(
              description = "Fields requested in the returned resource",
              schema = @Schema(type = "string", example = FIELDS))
          @QueryParam("fields")
          String fieldsParam,
      @Parameter(description = "Limit number services returned. (1 to 1000000, " + "default 10)")
          @DefaultValue("10")
          @Min(0)
          @Max(1000000)
          @QueryParam("limit")
          int limitParam,
      @Parameter(description = "Returns list of services before this cursor", schema = @Schema(type = "string"))
          @QueryParam("before")
          String before,
      @Parameter(description = "Returns list of services after this cursor", schema = @Schema(type = "string"))
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
    ResultList<PipelineService> pipelineServices =
        super.listInternal(uriInfo, securityContext, fieldsParam, filter, limitParam, before, after);
    return addHref(uriInfo, decryptOrNullify(securityContext, pipelineServices));
  }

  @GET
  @Path("/{id}")
  @Operation(
      operationId = "getPipelineServiceByID",
      summary = "Get a pipeline service",
      tags = "pipelineService",
      description = "Get a pipeline service by `id`.",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "Pipeline service instance",
            content =
                @Content(mediaType = "application/json", schema = @Schema(implementation = PipelineService.class))),
        @ApiResponse(responseCode = "404", description = "Pipeline service for instance {id} is not found")
      })
  public PipelineService get(
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
    PipelineService pipelineService = getInternal(uriInfo, securityContext, id, fieldsParam, include);
    return decryptOrNullify(securityContext, pipelineService);
  }

  @GET
  @Path("/name/{name}")
  @Operation(
      operationId = "getPipelineServiceByFQN",
      summary = "Get pipeline service by name",
      tags = "pipelineService",
      description = "Get a pipeline service by the service `name`.",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "Pipeline service instance",
            content =
                @Content(mediaType = "application/json", schema = @Schema(implementation = PipelineService.class))),
        @ApiResponse(responseCode = "404", description = "Pipeline service for instance {id} is not found")
      })
  public PipelineService getByName(
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
    PipelineService pipelineService = getByNameInternal(uriInfo, securityContext, name, fieldsParam, include);
    return decryptOrNullify(securityContext, pipelineService);
  }

  @GET
  @Path("/{id}/versions")
  @Operation(
      operationId = "listAllPipelineServiceVersion",
      summary = "List pipeline service versions",
      tags = "pipelineService",
      description = "Get a list of all the versions of a pipeline service identified by `id`",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "List of pipeline service versions",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = EntityHistory.class)))
      })
  public EntityHistory listVersions(
      @Context UriInfo uriInfo,
      @Context SecurityContext securityContext,
      @Parameter(description = "pipeline service Id", schema = @Schema(type = "string")) @PathParam("id") String id)
      throws IOException {
    EntityHistory entityHistory = dao.listVersions(id);
    List<Object> versions =
        entityHistory.getVersions().stream()
            .map(
                json -> {
                  try {
                    PipelineService pipelineService = JsonUtils.readValue((String) json, PipelineService.class);
                    return JsonUtils.pojoToJson(decryptOrNullify(securityContext, pipelineService));
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
      operationId = "getSpecificPipelineService",
      summary = "Get a version of the pipeline service",
      tags = "pipelineService",
      description = "Get a version of the pipeline service by given `id`",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "pipeline service",
            content =
                @Content(mediaType = "application/json", schema = @Schema(implementation = PipelineService.class))),
        @ApiResponse(
            responseCode = "404",
            description = "Pipeline service for instance {id} and version " + "{version} is not found")
      })
  public PipelineService getVersion(
      @Context UriInfo uriInfo,
      @Context SecurityContext securityContext,
      @Parameter(description = "pipeline service Id", schema = @Schema(type = "string")) @PathParam("id") String id,
      @Parameter(
              description = "pipeline service version number in the form `major`" + ".`minor`",
              schema = @Schema(type = "string", example = "0.1 or 1.1"))
          @PathParam("version")
          String version)
      throws IOException {
    PipelineService pipelineService = dao.getVersion(id, version);
    return decryptOrNullify(securityContext, pipelineService);
  }

  @POST
  @Operation(
      operationId = "createPipelineService",
      summary = "Create a pipeline service",
      tags = "pipelineService",
      description = "Create a new pipeline service.",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "Pipeline service instance",
            content =
                @Content(mediaType = "application/json", schema = @Schema(implementation = PipelineService.class))),
        @ApiResponse(responseCode = "400", description = "Bad request")
      })
  public Response create(
      @Context UriInfo uriInfo, @Context SecurityContext securityContext, @Valid CreatePipelineService create)
      throws IOException {
    PipelineService service = getService(create, securityContext.getUserPrincipal().getName());
    Response response = create(uriInfo, securityContext, service, ADMIN | BOT);
    decryptOrNullify(securityContext, (PipelineService) response.getEntity());
    return response;
  }

  @PUT
  @Operation(
      operationId = "createOrUpdatePipelineService",
      summary = "Update pipeline service",
      tags = "pipelineService",
      description = "Create a new pipeline service or update an existing pipeline service identified by `id`.",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "Pipeline service instance",
            content =
                @Content(mediaType = "application/json", schema = @Schema(implementation = PipelineService.class))),
        @ApiResponse(responseCode = "400", description = "Bad request")
      })
  public Response createOrUpdate(
      @Context UriInfo uriInfo, @Context SecurityContext securityContext, @Valid CreatePipelineService update)
      throws IOException {
    PipelineService service = getService(update, securityContext.getUserPrincipal().getName());
    Response response = createOrUpdate(uriInfo, securityContext, service, ADMIN | BOT | OWNER);
    decryptOrNullify(securityContext, (PipelineService) response.getEntity());
    return response;
  }

  @DELETE
  @Path("/{id}")
  @Operation(
      operationId = "deletePipelineService",
      summary = "Delete a pipeline service",
      tags = "pipelineService",
      description =
          "Delete a pipeline services. If pipelines (and tasks) belong to the service, it can't be " + "deleted.",
      responses = {
        @ApiResponse(responseCode = "200", description = "OK"),
        @ApiResponse(responseCode = "404", description = "Pipeline service for instance {id} " + "is not found")
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
      @Parameter(description = "Id of the pipeline service", schema = @Schema(type = "string")) @PathParam("id")
          String id)
      throws IOException {
    return delete(uriInfo, securityContext, id, recursive, hardDelete, ADMIN | BOT);
  }

  private PipelineService getService(CreatePipelineService create, String user) {
    return copy(new PipelineService(), create, user)
        .withServiceType(create.getServiceType())
        .withConnection(create.getConnection());
  }

  private ResultList<PipelineService> decryptOrNullify(
      SecurityContext securityContext, ResultList<PipelineService> pipelineServices) {
    Optional.ofNullable(pipelineServices.getData())
        .orElse(Collections.emptyList())
        .forEach(pipelineService -> decryptOrNullify(securityContext, pipelineService));
    return pipelineServices;
  }

  private PipelineService decryptOrNullify(SecurityContext securityContext, PipelineService pipelineService) {
    try {
      SecurityUtil.authorizeAdmin(authorizer, securityContext, ADMIN | BOT);
    } catch (AuthorizationException e) {
      return pipelineService.withConnection(null);
    }
    fernet.encryptOrDecryptPipelineConnection(pipelineService.getConnection(), pipelineService.getServiceType(), false);
    return pipelineService;
  }
}
