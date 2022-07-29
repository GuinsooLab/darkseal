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

package org.openmetadata.catalog.resources.config;

import io.swagger.annotations.Api;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;
import org.openmetadata.catalog.CatalogApplicationConfig;
import org.openmetadata.catalog.airflow.AirflowConfigurationForAPI;
import org.openmetadata.catalog.resources.Collection;
import org.openmetadata.catalog.sandbox.SandboxConfiguration;
import org.openmetadata.catalog.security.AuthenticationConfiguration;
import org.openmetadata.catalog.security.AuthorizerConfiguration;
import org.openmetadata.catalog.security.jwt.JWKSResponse;
import org.openmetadata.catalog.security.jwt.JWTTokenGenerator;
import org.openmetadata.catalog.slackChat.SlackChatConfiguration;

@Path("/v1/config")
@Api(value = "Get configuration")
@Produces(MediaType.APPLICATION_JSON)
@Collection(name = "config")
public class ConfigResource {
  private final CatalogApplicationConfig catalogApplicationConfig;
  private final JWTTokenGenerator jwtTokenGenerator;

  public ConfigResource(CatalogApplicationConfig catalogApplicationConfig) {
    this.catalogApplicationConfig = catalogApplicationConfig;
    this.jwtTokenGenerator = JWTTokenGenerator.getInstance();
  }

  @GET
  @Path(("/auth"))
  @Operation(
      operationId = "getAuthConfiguration",
      summary = "Get auth configuration",
      tags = "config",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "Auth configuration",
            content =
                @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = AuthenticationConfiguration.class)))
      })
  public AuthenticationConfiguration getAuthConfig() {
    AuthenticationConfiguration authenticationConfiguration = new AuthenticationConfiguration();
    if (catalogApplicationConfig.getAuthenticationConfiguration() != null) {
      authenticationConfiguration = catalogApplicationConfig.getAuthenticationConfiguration();
    }
    return authenticationConfiguration;
  }

  @GET
  @Path(("/authorizer"))
  @Operation(
      operationId = "getAuthorizerConfig",
      summary = "Get authorizer configuration",
      tags = "config",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "Authorizer configuration",
            content =
                @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = AuthorizerConfiguration.class)))
      })
  public AuthorizerConfiguration getAuthorizerConfig() {
    AuthorizerConfiguration authorizerConfiguration = new AuthorizerConfiguration();
    if (catalogApplicationConfig.getAuthorizerConfiguration() != null) {
      authorizerConfiguration = catalogApplicationConfig.getAuthorizerConfiguration();
    }
    return authorizerConfiguration;
  }

  @GET
  @Path(("/sandbox"))
  @Operation(
      operationId = "getSandboxConfiguration",
      summary = "Get sandbox mode",
      tags = "config",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "Sandbox mode",
            content =
                @Content(mediaType = "application/json", schema = @Schema(implementation = SandboxConfiguration.class)))
      })
  public SandboxConfiguration getSandboxMode() {
    SandboxConfiguration sandboxConfiguration = new SandboxConfiguration();
    if (catalogApplicationConfig.isSandboxModeEnabled()) {
      sandboxConfiguration.setSandboxModeEnabled(true);
    }
    return sandboxConfiguration;
  }

  @GET
  @Path(("/slackChat"))
  @Operation(
      operationId = "getSlackChatConfiguration",
      summary = "Get Slack Chat Configuration",
      tags = "config",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "Get Slack Chat Configuration",
            content =
                @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = SlackChatConfiguration.class)))
      })
  public SlackChatConfiguration getSlackChatConfiguration() {
    SlackChatConfiguration slackChatConfiguration = new SlackChatConfiguration();
    if (catalogApplicationConfig.getSlackChatConfiguration() != null) {
      slackChatConfiguration = catalogApplicationConfig.getSlackChatConfiguration();
    }
    return slackChatConfiguration;
  }

  @GET
  @Path(("/airflow"))
  @Operation(
      operationId = "getAirflowConfiguration",
      summary = "Get airflow configuration",
      tags = "config",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "Airflow configuration",
            content =
                @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = AirflowConfigurationForAPI.class)))
      })
  public AirflowConfigurationForAPI getAirflowConfig() {
    AirflowConfigurationForAPI airflowConfigurationForAPI = new AirflowConfigurationForAPI();
    if (catalogApplicationConfig.getAirflowConfiguration() != null) {
      airflowConfigurationForAPI.setApiEndpoint(catalogApplicationConfig.getAirflowConfiguration().getApiEndpoint());
    }
    return airflowConfigurationForAPI;
  }

  @GET
  @Path(("/jwks"))
  @Operation(
      operationId = "getJWKSResponse",
      summary = "Get JWKS public key",
      tags = "config",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "JWKS public key",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = JWKSResponse.class)))
      })
  public JWKSResponse getJWKSResponse() {
    return jwtTokenGenerator.getJWKSResponse();
  }
}
