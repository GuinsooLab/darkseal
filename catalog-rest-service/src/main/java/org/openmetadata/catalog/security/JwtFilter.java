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

package org.openmetadata.catalog.security;

import com.auth0.jwk.Jwk;
import com.auth0.jwk.JwkProvider;
import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.exceptions.JWTDecodeException;
import com.auth0.jwt.interfaces.Claim;
import com.auth0.jwt.interfaces.DecodedJWT;
import com.fasterxml.jackson.databind.node.TextNode;
import com.google.common.annotations.VisibleForTesting;
import com.google.common.collect.ImmutableList;
import io.dropwizard.util.Strings;
import java.io.IOException;
import java.net.URL;
import java.security.interfaces.RSAPublicKey;
import java.util.Calendar;
import java.util.List;
import java.util.Map;
import java.util.TimeZone;
import java.util.TreeMap;
import javax.ws.rs.container.ContainerRequestContext;
import javax.ws.rs.container.ContainerRequestFilter;
import javax.ws.rs.core.MultivaluedMap;
import javax.ws.rs.core.SecurityContext;
import javax.ws.rs.core.UriInfo;
import javax.ws.rs.ext.Provider;
import lombok.SneakyThrows;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang.StringUtils;
import org.openmetadata.catalog.Entity;
import org.openmetadata.catalog.entity.teams.AuthenticationMechanism;
import org.openmetadata.catalog.entity.teams.User;
import org.openmetadata.catalog.jdbi3.EntityRepository;
import org.openmetadata.catalog.security.auth.CatalogSecurityContext;
import org.openmetadata.catalog.teams.authn.JWTAuthMechanism;
import org.openmetadata.catalog.util.EntityUtil;
import org.openmetadata.catalog.util.JsonUtils;

@Slf4j
@Provider
public class JwtFilter implements ContainerRequestFilter {
  public static final String AUTHORIZATION_HEADER = "Authorization";
  public static final String TOKEN_PREFIX = "Bearer";
  public static final String BOT_CLAIM = "isBot";
  private List<String> jwtPrincipalClaims;
  private JwkProvider jwkProvider;
  private String principalDomain;
  private boolean enforcePrincipalDomain;

  @SuppressWarnings("unused")
  private JwtFilter() {}

  @SneakyThrows
  public JwtFilter(
      AuthenticationConfiguration authenticationConfiguration, AuthorizerConfiguration authorizerConfiguration) {
    this.jwtPrincipalClaims = authenticationConfiguration.getJwtPrincipalClaims();

    ImmutableList.Builder<URL> publicKeyUrlsBuilder = ImmutableList.builder();
    for (String publicKeyUrlStr : authenticationConfiguration.getPublicKeyUrls()) {
      publicKeyUrlsBuilder.add(new URL(publicKeyUrlStr));
    }
    this.jwkProvider = new MultiUrlJwkProvider(publicKeyUrlsBuilder.build());
    this.principalDomain = authorizerConfiguration.getPrincipalDomain();
    this.enforcePrincipalDomain = authorizerConfiguration.getEnforcePrincipalDomain();
  }

  @VisibleForTesting
  JwtFilter(
      JwkProvider jwkProvider,
      List<String> jwtPrincipalClaims,
      String principalDomain,
      boolean enforcePrincipalDomain) {
    this.jwkProvider = jwkProvider;
    this.jwtPrincipalClaims = jwtPrincipalClaims;
    this.principalDomain = principalDomain;
    this.enforcePrincipalDomain = enforcePrincipalDomain;
  }

  @SneakyThrows
  @Override
  public void filter(ContainerRequestContext requestContext) {
    UriInfo uriInfo = requestContext.getUriInfo();
    if (uriInfo.getPath().contains("config") || uriInfo.getPath().contains("version")) {
      return;
    }

    // Extract token from the header
    MultivaluedMap<String, String> headers = requestContext.getHeaders();
    String tokenFromHeader = extractToken(headers);
    LOG.debug("Token from header:{}", tokenFromHeader);

    DecodedJWT jwt = validateAndReturnDecodedJwtToken(tokenFromHeader);

    Map<String, Claim> claims = new TreeMap<>(String.CASE_INSENSITIVE_ORDER);
    claims.putAll(jwt.getClaims());

    String userName = validateAndReturnUsername(claims);

    // validate bot token
    if (claims.containsKey(BOT_CLAIM) && claims.get(BOT_CLAIM).asBoolean()) {
      validateBotToken(tokenFromHeader, userName);
    }

    // Setting Security Context
    CatalogPrincipal catalogPrincipal = new CatalogPrincipal(userName);
    String scheme = requestContext.getUriInfo().getRequestUri().getScheme();
    CatalogSecurityContext catalogSecurityContext =
        new CatalogSecurityContext(catalogPrincipal, scheme, SecurityContext.DIGEST_AUTH);
    LOG.debug("SecurityContext {}", catalogSecurityContext);
    requestContext.setSecurityContext(catalogSecurityContext);
  }

  @SneakyThrows
  public DecodedJWT validateAndReturnDecodedJwtToken(String token) {
    // Decode JWT Token
    DecodedJWT jwt;
    try {
      jwt = JWT.decode(token);
    } catch (JWTDecodeException e) {
      throw new AuthenticationException("Invalid token", e);
    }

    // Check if expired
    // If expiresAt is set to null, treat it as never expiring token
    if (jwt.getExpiresAt() != null
        && jwt.getExpiresAt().before(Calendar.getInstance(TimeZone.getTimeZone("UTC")).getTime())) {
      throw new AuthenticationException("Expired token!");
    }

    // Validate JWT with public key
    Jwk jwk = jwkProvider.get(jwt.getKeyId());
    Algorithm algorithm = Algorithm.RSA256((RSAPublicKey) jwk.getPublicKey(), null);
    try {
      algorithm.verify(jwt);
    } catch (RuntimeException runtimeException) {
      throw new AuthenticationException("Invalid token");
    }
    return jwt;
  }

  @SneakyThrows
  public String validateAndReturnUsername(Map<String, Claim> claims) {
    // Get username from JWT token
    String jwtClaim =
        jwtPrincipalClaims.stream()
            .filter(claims::containsKey)
            .findFirst()
            .map(claims::get)
            .map(claim -> claim.as(TextNode.class).asText())
            .orElseThrow(
                () ->
                    new AuthenticationException(
                        "Invalid JWT token, none of the following claims are present " + jwtPrincipalClaims));

    String userName;
    String domain;
    if (jwtClaim.contains("@")) {
      userName = jwtClaim.split("@")[0];
      domain = jwtClaim.split("@")[1];
    } else {
      userName = jwtClaim;
      domain = StringUtils.EMPTY;
    }

    // validate principal domain
    if (enforcePrincipalDomain) {
      if (!domain.equals(principalDomain)) {
        throw new AuthenticationException(
            String.format("Not Authorized! Email does not match the principal domain %s", principalDomain));
      }
    }
    return userName;
  }

  protected static String extractToken(MultivaluedMap<String, String> headers) {
    LOG.debug("Request Headers:{}", headers);
    String source = headers.getFirst(AUTHORIZATION_HEADER);
    if (Strings.isNullOrEmpty(source)) {
      throw new AuthenticationException("Not Authorized! Token not present");
    }
    // Extract the bearer token
    if (source.startsWith(TOKEN_PREFIX)) {
      return source.substring(TOKEN_PREFIX.length() + 1);
    }
    throw new AuthenticationException("Not Authorized! Token not present");
  }

  public static String extractToken(String tokenFromHeader) {
    LOG.debug("Request Token:{}", tokenFromHeader);
    if (Strings.isNullOrEmpty(tokenFromHeader)) {
      throw new AuthenticationException("Not Authorized! Token not present");
    }
    // Extract the bearer token
    if (tokenFromHeader.startsWith(TOKEN_PREFIX)) {
      return tokenFromHeader.substring(TOKEN_PREFIX.length() + 1);
    }
    throw new AuthenticationException("Not Authorized! Token not present");
  }

  private void validateBotToken(String tokenFromHeader, String userName) throws IOException {
    EntityRepository<User> userRepository = Entity.getEntityRepository(Entity.USER);
    User user = userRepository.getByName(null, userName, new EntityUtil.Fields(List.of("authenticationMechanism")));
    AuthenticationMechanism authenticationMechanism = user.getAuthenticationMechanism();
    if (authenticationMechanism != null) {
      JWTAuthMechanism jwtAuthMechanism =
          JsonUtils.convertValue(authenticationMechanism.getConfig(), JWTAuthMechanism.class);
      if (tokenFromHeader.equals(jwtAuthMechanism.getJWTToken())) {
        return;
      }
    }
    throw new AuthenticationException("Not Authorized! Invalid Token");
  }
}
