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

package org.openmetadata.service.resources.charts;

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
import java.util.UUID;
import javax.json.JsonPatch;
import javax.validation.Valid;
import javax.validation.constraints.Max;
import javax.validation.constraints.Min;
import javax.ws.rs.Consumes;
import javax.ws.rs.DELETE;
import javax.ws.rs.DefaultValue;
import javax.ws.rs.GET;
import javax.ws.rs.PATCH;
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
import org.openmetadata.schema.api.data.CreateChart;
import org.openmetadata.schema.api.data.RestoreEntity;
import org.openmetadata.schema.entity.data.Chart;
import org.openmetadata.schema.type.EntityHistory;
import org.openmetadata.schema.type.Include;
import org.openmetadata.service.Entity;
import org.openmetadata.service.jdbi3.ChartRepository;
import org.openmetadata.service.jdbi3.CollectionDAO;
import org.openmetadata.service.jdbi3.ListFilter;
import org.openmetadata.service.resources.Collection;
import org.openmetadata.service.resources.EntityResource;
import org.openmetadata.service.security.Authorizer;
import org.openmetadata.service.util.EntityUtil;
import org.openmetadata.service.util.RestUtil;
import org.openmetadata.service.util.ResultList;

@Path("/v1/charts")
@Api(value = "Chart data asset collection", tags = "Chart data asset collection")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@Collection(name = "charts")
public class ChartResource extends EntityResource<Chart, ChartRepository> {
  public static final String COLLECTION_PATH = "v1/charts/";

  @Override
  public Chart addHref(UriInfo uriInfo, Chart chart) {
    chart.setHref(RestUtil.getHref(uriInfo, COLLECTION_PATH, chart.getId()));
    Entity.withHref(uriInfo, chart.getOwner());
    Entity.withHref(uriInfo, chart.getService());
    Entity.withHref(uriInfo, chart.getFollowers());
    return chart;
  }

  public ChartResource(CollectionDAO dao, Authorizer authorizer) {
    super(Chart.class, new ChartRepository(dao), authorizer);
  }

  public static class ChartList extends ResultList<Chart> {
    @SuppressWarnings("unused")
    ChartList() {
      // Empty constructor needed for deserialization
    }
  }

  static final String FIELDS = "owner,followers,tags";

  @GET
  @Operation(
      operationId = "listCharts",
      summary = "List charts",
      tags = "charts",
      description =
          "Get a list of charts, optionally filtered by `service` it belongs to. Use `fields` "
              + "parameter to get only necessary fields. Use cursor-based pagination to limit the number "
              + "entries in the list using `limit` and `before` or `after` query params.",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "List of charts",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = ChartList.class)))
      })
  public ResultList<Chart> list(
      @Context UriInfo uriInfo,
      @Context SecurityContext securityContext,
      @Parameter(
              description = "Fields requested in the returned resource",
              schema = @Schema(type = "string", example = FIELDS))
          @QueryParam("fields")
          String fieldsParam,
      @Parameter(description = "Filter charts by service name", schema = @Schema(type = "string", example = "superset"))
          @QueryParam("service")
          String serviceParam,
      @Parameter(description = "Limit the number charts returned. (1 to 1000000, default = 10)")
          @DefaultValue("10")
          @QueryParam("limit")
          @Min(0)
          @Max(1000000)
          int limitParam,
      @Parameter(description = "Returns list of charts before this cursor", schema = @Schema(type = "string"))
          @QueryParam("before")
          String before,
      @Parameter(description = "Returns list of charts after this cursor", schema = @Schema(type = "string"))
          @QueryParam("after")
          String after,
      @Parameter(
              description = "Include all, deleted, or non-deleted entities.",
              schema = @Schema(implementation = Include.class))
          @QueryParam("include")
          @DefaultValue("non-deleted")
          Include include)
      throws IOException {
    ListFilter filter = new ListFilter(include).addQueryParam("service", serviceParam);
    return super.listInternal(uriInfo, securityContext, fieldsParam, filter, limitParam, before, after);
  }

  @GET
  @Path("/{id}/versions")
  @Operation(
      operationId = "listAllChartVersions",
      summary = "List chart versions",
      tags = "charts",
      description = "Get a list of all the versions of a chart identified by `id`",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "List of chart versions",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = EntityHistory.class)))
      })
  public EntityHistory listVersions(
      @Context UriInfo uriInfo,
      @Context SecurityContext securityContext,
      @Parameter(description = "Id of the chart", schema = @Schema(type = "UUID")) @PathParam("id") UUID id)
      throws IOException {
    return super.listVersionsInternal(securityContext, id);
  }

  @GET
  @Path("/{id}")
  @Operation(
      operationId = "getChartByID",
      summary = "Get a chart by Id",
      tags = "charts",
      description = "Get a chart by `Id`.",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "The chart",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = Chart.class))),
        @ApiResponse(responseCode = "404", description = "Chart for instance {id} is not found")
      })
  public Chart get(
      @Context UriInfo uriInfo,
      @Context SecurityContext securityContext,
      @Parameter(description = "Id of the chart", schema = @Schema(type = "UUID")) @PathParam("id") UUID id,
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
  @Path("/name/{fqn}")
  @Operation(
      operationId = "getChartByFQN",
      summary = "Get a chart by fully qualified name",
      tags = "charts",
      description = "Get a chart by `fullyQualifiedName`.",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "The chart",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = Chart.class))),
        @ApiResponse(responseCode = "404", description = "Chart for instance {fqn} is not found")
      })
  public Chart getByName(
      @Context UriInfo uriInfo,
      @Parameter(description = "Fully qualified name of the chart", schema = @Schema(type = "string")) @PathParam("fqn")
          String fqn,
      @Context SecurityContext securityContext,
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
    return getByNameInternal(uriInfo, securityContext, fqn, fieldsParam, include);
  }

  @GET
  @Path("/{id}/versions/{version}")
  @Operation(
      operationId = "getSpecificChartVersion",
      summary = "Get a version of the chart",
      tags = "charts",
      description = "Get a version of the chart by given `Id`",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "chart",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = Chart.class))),
        @ApiResponse(
            responseCode = "404",
            description = "Chart for instance {id} and version {version} is " + "not found")
      })
  public Chart getVersion(
      @Context UriInfo uriInfo,
      @Context SecurityContext securityContext,
      @Parameter(description = "Id of the chart", schema = @Schema(type = "UUID")) @PathParam("id") UUID id,
      @Parameter(
              description = "Chart version number in the form `major`.`minor`",
              schema = @Schema(type = "string", example = "0.1 or 1.1"))
          @PathParam("version")
          String version)
      throws IOException {
    return super.getVersionInternal(securityContext, id, version);
  }

  @POST
  @Operation(
      operationId = "createChart",
      summary = "Create a chart",
      tags = "charts",
      description = "Create a chart under an existing `service`.",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "The chart",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = Chart.class))),
        @ApiResponse(responseCode = "400", description = "Bad request")
      })
  public Response create(@Context UriInfo uriInfo, @Context SecurityContext securityContext, @Valid CreateChart create)
      throws IOException {
    Chart chart = getChart(create, securityContext.getUserPrincipal().getName());
    return create(uriInfo, securityContext, chart);
  }

  @PATCH
  @Path("/{id}")
  @Operation(
      operationId = "patchChart",
      summary = "Update a chart",
      tags = "charts",
      description = "Update an existing chart using JsonPatch.",
      externalDocs = @ExternalDocumentation(description = "JsonPatch RFC", url = "https://tools.ietf.org/html/rfc6902"))
  @Consumes(MediaType.APPLICATION_JSON_PATCH_JSON)
  public Response patch(
      @Context UriInfo uriInfo,
      @Context SecurityContext securityContext,
      @Parameter(description = "Id of the chart", schema = @Schema(type = "UUID")) @PathParam("id") UUID id,
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

  @PUT
  @Operation(
      operationId = "createOrUpdateChart",
      summary = "Create or update chart",
      tags = "charts",
      description = "Create a chart, it it does not exist or update an existing chart.",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "The updated chart ",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = Chart.class)))
      })
  public Response createOrUpdate(
      @Context UriInfo uriInfo, @Context SecurityContext securityContext, @Valid CreateChart create)
      throws IOException {
    Chart chart = getChart(create, securityContext.getUserPrincipal().getName());
    return createOrUpdate(uriInfo, securityContext, chart);
  }

  @PUT
  @Path("/{id}/followers")
  @Operation(
      operationId = "addFollowerToChart",
      summary = "Add a follower",
      tags = "charts",
      description = "Add a user identified by `userId` as followed of this chart",
      responses = {
        @ApiResponse(responseCode = "200", description = "OK"),
        @ApiResponse(responseCode = "404", description = "Chart for instance {id} is not found")
      })
  public Response addFollower(
      @Context UriInfo uriInfo,
      @Context SecurityContext securityContext,
      @Parameter(description = "Id of the chart", schema = @Schema(type = "UUID")) @PathParam("id") UUID id,
      @Parameter(description = "Id of the user to be added as follower", schema = @Schema(type = "UUID")) UUID userId)
      throws IOException {
    return dao.addFollower(securityContext.getUserPrincipal().getName(), id, userId).toResponse();
  }

  @DELETE
  @Path("/{id}/followers/{userId}")
  @Operation(
      operationId = "deleteFollowerFromChart",
      summary = "Remove a follower",
      tags = "charts",
      description = "Remove the user identified `userId` as a follower of the chart.")
  public Response deleteFollower(
      @Context UriInfo uriInfo,
      @Context SecurityContext securityContext,
      @Parameter(description = "Id of the chart", schema = @Schema(type = "UUID")) @PathParam("id") UUID id,
      @Parameter(description = "Id of the user being removed as follower", schema = @Schema(type = "UUID"))
          @PathParam("userId")
          UUID userId)
      throws IOException {
    return dao.deleteFollower(securityContext.getUserPrincipal().getName(), id, userId).toResponse();
  }

  @DELETE
  @Path("/{id}")
  @Operation(
      operationId = "deleteChart",
      summary = "Delete a chart by Id",
      tags = "charts",
      description = "Delete a chart by `Id`.",
      responses = {
        @ApiResponse(responseCode = "200", description = "OK"),
        @ApiResponse(responseCode = "404", description = "Chart for instance {id} is not found")
      })
  public Response delete(
      @Context UriInfo uriInfo,
      @Context SecurityContext securityContext,
      @Parameter(description = "Hard delete the entity. (Default = `false`)")
          @QueryParam("hardDelete")
          @DefaultValue("false")
          boolean hardDelete,
      @Parameter(description = "Id of the chart", schema = @Schema(type = "UUID")) @PathParam("id") UUID id)
      throws IOException {
    return delete(uriInfo, securityContext, id, false, hardDelete);
  }

  @DELETE
  @Path("/name/{fqn}")
  @Operation(
      operationId = "deleteChartByFQN",
      summary = "Delete a chart by fully qualified name",
      tags = "charts",
      description = "Delete a chart by `fullyQualifiedName`.",
      responses = {
        @ApiResponse(responseCode = "200", description = "OK"),
        @ApiResponse(responseCode = "404", description = "Chart for instance {fqn} is not found")
      })
  public Response delete(
      @Context UriInfo uriInfo,
      @Context SecurityContext securityContext,
      @Parameter(description = "Hard delete the entity. (Default = `false`)")
          @QueryParam("hardDelete")
          @DefaultValue("false")
          boolean hardDelete,
      @Parameter(description = "Fully qualified name of the chart", schema = @Schema(type = "string")) @PathParam("fqn")
          String fqn)
      throws IOException {
    return deleteByName(uriInfo, securityContext, fqn, false, hardDelete);
  }

  @PUT
  @Path("/restore")
  @Operation(
      operationId = "restore",
      summary = "Restore a soft deleted chart",
      tags = "charts",
      description = "Restore a soft deleted chart.",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "Successfully restored the Chart ",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = Chart.class)))
      })
  public Response restoreChart(
      @Context UriInfo uriInfo, @Context SecurityContext securityContext, @Valid RestoreEntity restore)
      throws IOException {
    return restoreEntity(uriInfo, securityContext, restore.getId());
  }

  private Chart getChart(CreateChart create, String user) throws IOException {
    return copy(new Chart(), create, user)
        .withService(EntityUtil.getEntityReference(Entity.DASHBOARD_SERVICE, create.getService()))
        .withChartType(create.getChartType())
        .withChartUrl(create.getChartUrl())
        .withTables(getEntityReferences(Entity.TABLE, create.getTables()))
        .withTags(create.getTags());
  }
}
