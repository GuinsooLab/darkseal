package org.openmetadata.service.resources.analytics;

import com.google.inject.Inject;
import io.swagger.annotations.Api;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import java.io.IOException;
import javax.validation.Valid;
import javax.ws.rs.Consumes;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.SecurityContext;
import javax.ws.rs.core.UriInfo;
import lombok.Getter;
import lombok.NonNull;
import lombok.extern.slf4j.Slf4j;
import org.openmetadata.schema.analytics.ReportData;
import org.openmetadata.schema.analytics.ReportData.ReportDataType;
import org.openmetadata.service.jdbi3.CollectionDAO;
import org.openmetadata.service.jdbi3.ReportDataRepository;
import org.openmetadata.service.resources.Collection;
import org.openmetadata.service.security.Authorizer;
import org.openmetadata.service.util.ResultList;

@Slf4j
@Path("/v1/analytic/reportData")
@Api(value = "ReportData collection", tags = "ReportData collection")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@Collection(name = "reportData")
public class ReportDataResource {
  public static final String COLLECTION_PATH = "v1/analytic/reportData";
  @Getter protected final ReportDataRepository dao;
  protected final Authorizer authorizer;

  @Inject
  public ReportDataResource(CollectionDAO dao, Authorizer authorizer) {
    this.authorizer = authorizer;
    this.dao = new ReportDataRepository(dao);
  }

  public static class ReportDataResultList extends ResultList<ReportData> {
    @SuppressWarnings("unused")
    public ReportDataResultList() {
      /* Required for serde */
    }
  }

  @GET
  @Operation(
      operationId = "getReportData",
      summary = "List the report data",
      tags = "reportData",
      description =
          "Get a list of all the report data for a given reportDataType, optionally filtered by  `startTs` and `endTs` of the result. "
              + "Use cursor-based pagination to limit the number of "
              + "entries in the list using `limit` and `before` or `after` query params.",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "List of report data",
            content =
                @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = ReportDataResource.ReportDataResultList.class)))
      })
  public ResultList<ReportData> list(
      @Context SecurityContext securityContext,
      @Parameter(description = "report data type", schema = @Schema(implementation = ReportDataType.class))
          @NonNull
          @QueryParam("reportDataType")
          ReportDataType reportDataType,
      @Parameter(
              description = "Filter reportData results after the given start timestamp",
              schema = @Schema(type = "number"))
          @NonNull
          @QueryParam("startTs")
          Long startTs,
      @Parameter(
              description = "Filter reportData results before the given end timestamp",
              schema = @Schema(type = "number"))
          @NonNull
          @QueryParam("endTs")
          Long endTs)
      throws IOException {
    return dao.getReportData(reportDataType, startTs, endTs);
  }

  @POST
  @Operation(
      operationId = "addReportData",
      summary = "Add report data",
      tags = "reportData",
      description = "Add report data",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "Successfully added reportData.",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = ReportData.class)))
      })
  public Response addReportData(
      @Context UriInfo uriInfo, @Context SecurityContext securityContext, @Valid ReportData reportData)
      throws IOException {
    return dao.addReportData(reportData);
  }
}
