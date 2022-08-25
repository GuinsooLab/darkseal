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

package org.openmetadata.client.interceptors;

import feign.RequestTemplate;
import java.util.Base64;
import org.openmetadata.catalog.services.connections.metadata.OpenMetadataServerConnection;
import org.openmetadata.client.model.OktaSSOConfig;
import org.openmetadata.client.security.interfaces.AuthenticationProvider;

public class OktaAccessTokenRequestInterceptor implements AuthenticationProvider {
  private OktaSSOConfig securityConfig;
  private String base64Credentials;

  public OktaAccessTokenRequestInterceptor(OktaSSOConfig config) {
    securityConfig = config;
  }

  @Override
  public void apply(RequestTemplate requestTemplate) {
    if (requestTemplate.headers().containsKey("Authorization")) {
      return;
    }
    if (base64Credentials == null) {
      this.authToken();
    }
    requestTemplate.header("Authorization", "Basic " + getAccessToken());
  }

  @Override
  public AuthenticationProvider create(OpenMetadataServerConnection iConfig) {
    return new OktaAccessTokenRequestInterceptor((OktaSSOConfig) iConfig.getSecurityConfig());
  }

  @Override
  public String authToken() {
    base64Credentials =
        Base64.getEncoder()
            .encodeToString((securityConfig.getClientId() + ":" + securityConfig.getClientSecret()).getBytes());
    return base64Credentials;
  }

  @Override
  public String getAccessToken() {
    return base64Credentials;
  }
}
