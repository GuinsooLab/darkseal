---
title: Enable JWT Tokens
slug: /deployment/security/enable-jwt-tokens
---

# Enable JWT Tokens

When we [enable SSO security](/deployment/security) on OpenMetadata, it will restrict access to all the APIs. Users who want to access the UI
will be redirected to configured SSO to log in, and SSO will provide the token to continue to make OpenMetadata REST API
calls. 

However, metadata ingestion or any other services which use OpenMetadata APIs to create entities or update them
requires a token as well to authenticate. Typically, SSO offers service accounts for this very reason. OpenMetadata
supports service accounts that the SSO provider supports. Please read the [docs](/deployment/security) to enable them.

In some cases, either creating a service account is not feasible, or the SSO provider itself doesn't support the service account. To address
this gap, we shipped JWT token generation and authentication within OpenMetadata.

## Create Private / Public key 

To create private/public key use the following commands

```commandline
openssl genrsa -out private_key.pem 2048   
openssl pkcs8 -topk8 -inform PEM -outform DER -in private_key.pem -out private_key.der -nocrypt
openssl rsa -in private_key.pem -pubout -outform DER -out public_key.der 
```

Copy the `private_key.der` and `public_key.der` in OpenMetadata server `conf` directory. Make sure the permissions can only be
readable by the user who is starting OpenMetadata server.

## Configure OpenMetadata Server

To enable JWT token generation. Please add the following to the OpenMetadata server

```yaml
jwtTokenConfiguration:
  rsapublicKeyFilePath: ${RSA_PUBLIC_KEY_FILE_PATH:-"/openmetadata/conf/public_key.der"}
  rsaprivateKeyFilePath: ${RSA_PRIVATE_KEY_FILE_PATH:-"/openmetadata/conf/private_key.der"}
  jwtissuer: ${JWT_ISSUER:-"open-metadata.org"}
  keyId: ${JWT_KEY_ID:-"Gb389a-9f76-gdjs-a92j-0242bk94356"}
```

If you are using helm charts or docker use the env variables to override the configs above.

Please use absolute path for public and private key files that we generated in previous steps.

Update the `JWT_ISSUER` to be the domain where you are running the OpenMetadata server. Generate `UUID64` id to configure
`JWT_KEY_ID`. This should be generated once and keep it static even when you are updating the versions. Any change in this
id will result in all the tokens issued so far to be invalid.

### Add public key URIS

```yaml
authenticationConfiguration:
  provider: ${AUTHENTICATION_PROVIDER:-no-auth}
  # This will only be valid when provider type specified is customOidc
  providerName: ${CUSTOM_OIDC_AUTHENTICATION_PROVIDER_NAME:-""}
  publicKeyUrls: ${AUTHENTICATION_PUBLIC_KEYS:-[https://www.googleapis.com/oauth2/v3/certs]}
  authority: ${AUTHENTICATION_AUTHORITY:-https://accounts.google.com}
  clientId: ${AUTHENTICATION_CLIENT_ID:-""}
  callbackUrl: ${AUTHENTICATION_CALLBACK_URL:-""}
  jwtPrincipalClaims: ${AUTHENTICATION_JWT_PRINCIPAL_CLAIMS:-[email,preferred_username,sub]}
```

add `http://localhost:8585/api/v1/config/jwks` to `publicKeyUrls`. You should append to the existing configuration such that
your SSO and JWTToken auth verification will work. 

Once you configure the above settings, restart OpenMetadata server .

## Generate Token

Once the above configuration is updated, the server is restarted. Admin can go to Settings -> Bots page.

<Image src="/images/deployment/security/enable-jwt/bot.png" alt="bots"/> 

Click on the generate token to create a token for the ingestion bot.

## Configure Ingestion

The generated token from the above page should pass onto the ingestion framework so that the ingestion can make calls
securely to OpenMetadata. Make sure this token is not shared and stored securely. 

### Using Airflow APIs

If you are using OpenMetadata shipped Airflow container with our APIs to deploy ingestion workflows from the
OpenMetadata UIs. Configure the below section to enable JWT Token

```yaml
# For Bare Metal Installations
airflowConfiguration:
  apiEndpoint: ${AIRFLOW_HOST:-http://localhost:8080}
  username: ${AIRFLOW_USERNAME:-admin}
  password: ${AIRFLOW_PASSWORD:-admin}
  metadataApiEndpoint: ${SERVER_HOST_API_URL:-http://localhost:8585/api}
  authProvider: ${AIRFLOW_AUTH_PROVIDER:-"openmetadata"} # Possible values are "no-auth", "azure", "google", "okta", "auth0", "custom-oidc", "openmetadata"
  authConfig:
    openmetadata:
      jwtToken: ${OM_AUTH_JWT_TOKEN:-"<JWT_TOKEN_FROM_UI_SETTINGS_BOTS>"}
```

In the above configuration, you can see we configure `authProvider` to be "openmetadata" and `OM_AUTH_JWT_TOKEN` with the JWT token that was generated in the bots page.

### Using Ingestion Framework

If you are running your own Airflow and using the ingestion framework from OpenMetadata APIs. Add the below
configuration to the workflow configuration you pass onto the ingestion framework

```yaml
source:
  type: bigquery
  serviceName: local_bigquery
  serviceConnection:
    config:
      type: BigQuery
      credentials:
        gcsConfig:
          type: service_account
          projectId: project_id
          privateKeyId: private_key_id
          privateKey: private_key
          clientEmail: gcpuser@project_id.iam.gserviceaccount.com
          clientId: client_id
          authUri: https://accounts.google.com/o/oauth2/auth
          tokenUri: https://oauth2.googleapis.com/token
          authProviderX509CertUrl: https://www.googleapis.com/oauth2/v1/certs
          clientX509CertUrl: clientX509CertUrl
  sourceConfig:
    config:
      type: DatabaseMetadata
sink:
  type: metadata-rest
  config: {}
workflowConfig:
  openMetadataServerConfig:
    hostPort: http://localhost:8585/api
    authProvider: openmetadata
    securityConfig:
       jwtToken:
```

In the above section, under the `workflowConfig`, configure `authProvider` to be "openmetadata" and under `securityConfig`
section, add "jwtToken" and its value from the ingestion bot page.
