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

package org.openmetadata.service.resources.config;

import io.swagger.annotations.Api;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;
import org.openmetadata.schema.api.security.AuthenticationConfiguration;
import org.openmetadata.schema.api.security.AuthorizerConfiguration;
import org.openmetadata.schema.api.slackChat.SlackChatConfiguration;
import org.openmetadata.service.OpenMetadataApplicationConfig;
import org.openmetadata.service.airflow.AirflowConfigurationForAPI;
import org.openmetadata.service.resources.Collection;
import org.openmetadata.service.sandbox.SandboxConfiguration;
import org.openmetadata.service.security.jwt.JWKSResponse;
import org.openmetadata.service.security.jwt.JWTTokenGenerator;

@Path("/v1/config")
@Api(value = "Get configuration")
@Produces(MediaType.APPLICATION_JSON)
@Collection(name = "config")
public class ConfigResource {
  private OpenMetadataApplicationConfig openMetadataApplicationConfig;
  private final JWTTokenGenerator jwtTokenGenerator;

  public ConfigResource() {
    this.jwtTokenGenerator = JWTTokenGenerator.getInstance();
  }

  public void initialize(OpenMetadataApplicationConfig config) {
    this.openMetadataApplicationConfig = config;
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
    if (openMetadataApplicationConfig.getAuthenticationConfiguration() != null) {
      authenticationConfiguration = openMetadataApplicationConfig.getAuthenticationConfiguration();
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
    if (openMetadataApplicationConfig.getAuthorizerConfiguration() != null) {
      authorizerConfiguration = openMetadataApplicationConfig.getAuthorizerConfiguration();
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
    if (openMetadataApplicationConfig.isSandboxModeEnabled()) {
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
    if (openMetadataApplicationConfig.getSlackChatConfiguration() != null) {
      slackChatConfiguration = openMetadataApplicationConfig.getSlackChatConfiguration();
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
    if (openMetadataApplicationConfig.getAirflowConfiguration() != null) {
      airflowConfigurationForAPI.setApiEndpoint(
          openMetadataApplicationConfig.getAirflowConfiguration().getApiEndpoint());
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
