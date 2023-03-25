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

package org.openmetadata.service.resources.metrics;

import io.swagger.annotations.Api;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import java.io.IOException;
import java.util.List;
import java.util.UUID;
import javax.validation.Valid;
import javax.validation.constraints.Max;
import javax.validation.constraints.Min;
import javax.ws.rs.Consumes;
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
import org.openmetadata.schema.entity.data.Metrics;
import org.openmetadata.schema.type.Include;
import org.openmetadata.service.jdbi3.CollectionDAO;
import org.openmetadata.service.jdbi3.ListFilter;
import org.openmetadata.service.jdbi3.MetricsRepository;
import org.openmetadata.service.resources.Collection;
import org.openmetadata.service.resources.EntityResource;
import org.openmetadata.service.security.Authorizer;
import org.openmetadata.service.util.ResultList;

@Path("/v1/metrics")
@Api(value = "Metrics collection", tags = "Metrics collection")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@Collection(name = "metrics")
public class MetricsResource extends EntityResource<Metrics, MetricsRepository> {
  public static final String COLLECTION_PATH = "/v1/metrics/";

  public MetricsResource(CollectionDAO dao, Authorizer authorizer) {
    super(Metrics.class, new MetricsRepository(dao), authorizer);
  }

  @Override
  public Metrics addHref(UriInfo uriInfo, Metrics entity) {
    return entity;
  }

  public static class MetricsList extends ResultList<Metrics> {
    public MetricsList(List<Metrics> data) {
      super(data);
    }
  }

  static final String FIELDS = "owner,usageSummary";

  @GET
  @Operation(
      operationId = "listMetrics",
      summary = "List metrics",
      tags = "metrics",
      description = "Get a list of metrics. Use `fields` parameter to get only necessary fields.",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "List of metrics",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = MetricsList.class)))
      })
  public ResultList<Metrics> list(
      @Context UriInfo uriInfo,
      @Context SecurityContext securityContext,
      @Parameter(
              description = "Fields requested in the returned resource",
              schema = @Schema(type = "string", example = FIELDS))
          @QueryParam("fields")
          String fieldsParam,
      @DefaultValue("10") @Min(0) @Max(1000000) @QueryParam("limit") int limitParam,
      @Parameter(description = "Returns list of metrics before this cursor", schema = @Schema(type = "string"))
          @QueryParam("before")
          String before,
      @Parameter(description = "Returns list of metrics after this cursor", schema = @Schema(type = "string"))
          @QueryParam("after")
          String after)
      throws IOException {
    ListFilter filter = new ListFilter();
    return super.listInternal(uriInfo, securityContext, fieldsParam, filter, limitParam, before, after);
  }

  @GET
  @Path("/{id}")
  @Operation(
      operationId = "getMetricByID",
      summary = "Get a metric by Id",
      tags = "metrics",
      description = "Get a metric by `Id`.",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "The metrics",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = Metrics.class))),
        @ApiResponse(responseCode = "404", description = "Metrics for instance {id} is not found")
      })
  public Metrics get(
      @Context UriInfo uriInfo,
      @Context SecurityContext securityContext,
      @Parameter(description = "Id of the metric", schema = @Schema(type = "UUID")) @PathParam("id") UUID id,
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

  @POST
  @Operation(
      operationId = "createMetric",
      summary = "Create a metric",
      tags = "metrics",
      description = "Create a new metric.",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "The metric",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = Metrics.class))),
        @ApiResponse(responseCode = "400", description = "Bad request")
      })
  public Response create(@Context UriInfo uriInfo, @Context SecurityContext securityContext, @Valid Metrics metrics)
      throws IOException {
    addToMetrics(securityContext, metrics);
    return super.create(uriInfo, securityContext, metrics);
  }

  @PUT
  @Operation(
      operationId = "createOrUpdateMetric",
      summary = "Create or update a metric",
      tags = "metrics",
      description = "Create a new metric, if it does not exist or update an existing metric.",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "The metric",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = Metrics.class))),
        @ApiResponse(responseCode = "400", description = "Bad request")
      })
  public Response createOrUpdate(
      @Context UriInfo uriInfo, @Context SecurityContext securityContext, @Valid Metrics metrics) throws IOException {
    addToMetrics(securityContext, metrics);
    return super.createOrUpdate(uriInfo, securityContext, metrics);
  }

  private void addToMetrics(SecurityContext securityContext, Metrics metrics) {
    metrics
        .withId(UUID.randomUUID())
        .withUpdatedBy(securityContext.getUserPrincipal().getName())
        .withUpdatedAt(System.currentTimeMillis());
  }
}
