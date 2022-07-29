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

package org.openmetadata.catalog.resources.services.messaging;

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
import org.openmetadata.catalog.api.services.CreateMessagingService;
import org.openmetadata.catalog.entity.services.MessagingService;
import org.openmetadata.catalog.jdbi3.CollectionDAO;
import org.openmetadata.catalog.jdbi3.ListFilter;
import org.openmetadata.catalog.jdbi3.MessagingServiceRepository;
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

@Path("/v1/services/messagingServices")
@Api(value = "Messaging service collection", tags = "Services -> Messaging service collection")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@Collection(name = "messagingServices")
public class MessagingServiceResource extends EntityResource<MessagingService, MessagingServiceRepository> {
  public static final String COLLECTION_PATH = "v1/services/messagingServices/";

  public static final String FIELDS = FIELD_OWNER;

  @Override
  public MessagingService addHref(UriInfo uriInfo, MessagingService service) {
    service.setHref(RestUtil.getHref(uriInfo, COLLECTION_PATH, service.getId()));
    Entity.withHref(uriInfo, service.getOwner());
    return service;
  }

  public MessagingServiceResource(CollectionDAO dao, Authorizer authorizer) {
    super(MessagingService.class, new MessagingServiceRepository(dao), authorizer);
  }

  public static class MessagingServiceList extends ResultList<MessagingService> {
    @SuppressWarnings("unused") /* Required for tests */
    public MessagingServiceList() {}

    public MessagingServiceList(List<MessagingService> data, String beforeCursor, String afterCursor, int total) {
      super(data, beforeCursor, afterCursor, total);
    }
  }

  @GET
  @Operation(
      operationId = "listMessagingService",
      summary = "List messaging services",
      tags = "MessagingService",
      description =
          "Get a list of messaging services. Use cursor-based pagination to limit the number "
              + "entries in the list using `limit` and `before` or `after` query params.",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "List of messaging services",
            content =
                @Content(mediaType = "application/json", schema = @Schema(implementation = MessagingServiceList.class)))
      })
  public ResultList<MessagingService> list(
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
    ResultList<MessagingService> messagingServices =
        super.listInternal(uriInfo, null, fieldsParam, filter, limitParam, before, after);
    return addHref(uriInfo, decryptOrNullify(securityContext, messagingServices));
  }

  @GET
  @Path("/{id}")
  @Operation(
      operationId = "getMessagingServiceByID",
      summary = "Get a messaging service",
      tags = "MessagingService",
      description = "Get a messaging service by `id`.",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "Messaging service instance",
            content =
                @Content(mediaType = "application/json", schema = @Schema(implementation = MessagingService.class))),
        @ApiResponse(responseCode = "404", description = "Messaging service for instance {id} is not found")
      })
  public MessagingService get(
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
    MessagingService messagingService = getInternal(uriInfo, securityContext, id, fieldsParam, include);
    return decryptOrNullify(securityContext, messagingService);
  }

  @GET
  @Path("/name/{name}")
  @Operation(
      operationId = "getMessagingServiceByFQN",
      summary = "Get messaging service by name",
      tags = "MessagingService",
      description = "Get a messaging service by the service `name`.",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "Messaging service instance",
            content =
                @Content(mediaType = "application/json", schema = @Schema(implementation = MessagingService.class))),
        @ApiResponse(responseCode = "404", description = "Messaging service for instance {id} is not found")
      })
  public MessagingService getByName(
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
    MessagingService messagingService = getByNameInternal(uriInfo, securityContext, name, fieldsParam, include);
    return decryptOrNullify(securityContext, messagingService);
  }

  @GET
  @Path("/{id}/versions")
  @Operation(
      operationId = "listAllMessagingServiceVersion",
      summary = "List messaging service versions",
      tags = "MessagingService",
      description = "Get a list of all the versions of a messaging service identified by `id`",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "List of messaging service versions",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = EntityHistory.class)))
      })
  public EntityHistory listVersions(
      @Context UriInfo uriInfo,
      @Context SecurityContext securityContext,
      @Parameter(description = "messaging service Id", schema = @Schema(type = "string")) @PathParam("id") String id)
      throws IOException {
    EntityHistory entityHistory = dao.listVersions(id);
    List<Object> versions =
        entityHistory.getVersions().stream()
            .map(
                json -> {
                  try {
                    MessagingService messagingService = JsonUtils.readValue((String) json, MessagingService.class);
                    return JsonUtils.pojoToJson(decryptOrNullify(securityContext, messagingService));
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
      operationId = "getSpecificMessagingServiceVersion",
      summary = "Get a version of the messaging service",
      tags = "MessagingService",
      description = "Get a version of the messaging service by given `id`",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "messaging service",
            content =
                @Content(mediaType = "application/json", schema = @Schema(implementation = MessagingService.class))),
        @ApiResponse(
            responseCode = "404",
            description = "Messaging service for instance {id} and version " + "{version} is not found")
      })
  public MessagingService getVersion(
      @Context UriInfo uriInfo,
      @Context SecurityContext securityContext,
      @Parameter(description = "messaging service Id", schema = @Schema(type = "string")) @PathParam("id") String id,
      @Parameter(
              description = "messaging service version number in the form `major`" + ".`minor`",
              schema = @Schema(type = "string", example = "0.1 or 1.1"))
          @PathParam("version")
          String version)
      throws IOException {
    MessagingService messagingService = dao.getVersion(id, version);
    return decryptOrNullify(securityContext, messagingService);
  }

  @POST
  @Operation(
      operationId = "createMessagingService",
      summary = "Create a messaging service",
      tags = "MessagingService",
      description = "Create a new messaging service.",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "Messaging service instance",
            content =
                @Content(mediaType = "application/json", schema = @Schema(implementation = MessagingService.class))),
        @ApiResponse(responseCode = "400", description = "Bad request")
      })
  public Response create(
      @Context UriInfo uriInfo, @Context SecurityContext securityContext, @Valid CreateMessagingService create)
      throws IOException {
    MessagingService service = getService(create, securityContext.getUserPrincipal().getName());
    return create(uriInfo, securityContext, service, ADMIN | BOT);
  }

  @PUT
  @Operation(
      operationId = "createOrUpdateMessagingService",
      summary = "Update messaging service",
      tags = "MessagingService",
      description = "Create a new messaging service or Update an existing messaging service identified by `id`.",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "Messaging service instance",
            content =
                @Content(mediaType = "application/json", schema = @Schema(implementation = MessagingService.class))),
        @ApiResponse(responseCode = "400", description = "Bad request")
      })
  public Response createOrUpdate(
      @Context UriInfo uriInfo,
      @Context SecurityContext securityContext,
      @Parameter(description = "Id of the messaging service", schema = @Schema(type = "string")) @PathParam("id")
          String id,
      @Valid CreateMessagingService update)
      throws IOException {
    MessagingService service = getService(update, securityContext.getUserPrincipal().getName());
    return createOrUpdate(uriInfo, securityContext, service, ADMIN | BOT | OWNER);
  }

  @DELETE
  @Path("/{id}")
  @Operation(
      operationId = "deleteMessagingService",
      summary = "Delete a messaging service",
      tags = "MessagingService",
      description = "Delete a messaging service. If topics belong the service, it can't be " + "deleted.",
      responses = {
        @ApiResponse(responseCode = "200", description = "OK"),
        @ApiResponse(responseCode = "404", description = "MessagingService service for instance {id} " + "is not found")
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
      @Parameter(description = "Id of the messaging service", schema = @Schema(type = "string")) @PathParam("id")
          String id)
      throws IOException {
    return delete(uriInfo, securityContext, id, recursive, hardDelete, ADMIN | BOT);
  }

  private MessagingService getService(CreateMessagingService create, String user) {
    return copy(new MessagingService(), create, user)
        .withConnection(create.getConnection())
        .withServiceType(create.getServiceType());
  }

  private ResultList<MessagingService> decryptOrNullify(
      SecurityContext securityContext, ResultList<MessagingService> messagingServices) {
    Optional.ofNullable(messagingServices.getData())
        .orElse(Collections.emptyList())
        .forEach(messagingService -> decryptOrNullify(securityContext, messagingService));
    return messagingServices;
  }

  private MessagingService decryptOrNullify(SecurityContext securityContext, MessagingService messagingService) {
    try {
      SecurityUtil.authorizeAdmin(authorizer, securityContext, ADMIN | BOT);
    } catch (AuthorizationException e) {
      return messagingService.withConnection(null);
    }
    return messagingService;
  }
}
