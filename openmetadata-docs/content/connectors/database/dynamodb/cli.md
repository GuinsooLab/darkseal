---
title: Run DynamoDB Connector using the CLI
slug: /connectors/database/dynamodb/cli
---

# Run DynamoDB using the metadata CLI

In this section, we provide guides and references to use the DynamoDB connector.

Configure and schedule DynamoDB metadata and profiler workflows from the OpenMetadata UI:
- [Requirements](#requirements)
- [Metadata Ingestion](#metadata-ingestion)
- [dbt Integration](#dbt-integration)

## Requirements

<InlineCallout color="violet-70" icon="description" bold="OpenMetadata 0.12 or later" href="/deployment">
To deploy OpenMetadata, check the <a href="/deployment">Deployment</a> guides.
</InlineCallout>

To run the Ingestion via the UI you'll need to use the OpenMetadata Ingestion Container, which comes shipped with
custom Airflow plugins to handle the workflow deployment.

### Python Requirements

To run the DynamoDB ingestion, you will need to install:

```bash
pip3 install "openmetadata-ingestion[dynamodb]"
```

## Metadata Ingestion

All connectors are defined as JSON Schemas.
[Here](https://github.com/open-metadata/OpenMetadata/blob/main/openmetadata-spec/src/main/resources/json/schema/entity/services/connections/database/dynamoDBConnection.json)
you can find the structure to create a connection to DynamoDB.

In order to create and run a Metadata Ingestion workflow, we will follow
the steps to create a YAML configuration able to connect to the source,
process the Entities if needed, and reach the OpenMetadata server.

The workflow is modeled around the following
[JSON Schema](https://github.com/open-metadata/OpenMetadata/blob/main/openmetadata-spec/src/main/resources/json/schema/metadataIngestion/workflow.json)

### 1. Define the YAML Config

This is a sample config for DynamoDB:

```yaml
source:
  type: bigquery
  serviceName: "<service name>"
  serviceConnection:
    config:
      type: BigQuery
      credentials:
        gcsConfig:
          type: My Type
          projectId: project ID
          privateKeyId: us-east-2
          privateKey: |
            -----BEGIN PRIVATE KEY-----
            Super secret key
            -----END PRIVATE KEY-----
          clientEmail: client@mail.com
          clientId: 1234
          # authUri: https://accounts.google.com/o/oauth2/auth (default)
          # tokenUri: https://oauth2.googleapis.com/token (default)
          # authProviderX509CertUrl: https://www.googleapis.com/oauth2/v1/certs (default)
          clientX509CertUrl: https://cert.url
  sourceConfig:
    config:
      markDeletedTables: true
      includeTables: true
      includeViews: true
      # includeTags: true
      # databaseFilterPattern:
      #   includes:
      #     - database1
      #     - database2
      #   excludes:
      #     - database3
      #     - database4
      # schemaFilterPattern:
      #   includes:
      #     - schema1
      #     - schema2
      #   excludes:
      #     - schema3
      #     - schema4
      # tableFilterPattern:
      #   includes:
      #     - table1
      #     - table2
      #   excludes:
      #     - table3
      #     - table4
      # For dbt, choose one of Cloud, Local, HTTP, S3 or GCS configurations
      # dbtConfigSource:
      # # For cloud
      #   dbtCloudAuthToken: token
      #   dbtCloudAccountId: ID
      # # For Local
      #   dbtCatalogFilePath: path-to-catalog.json
      #   dbtManifestFilePath: path-to-manifest.json
      # # For HTTP
      #   dbtCatalogHttpPath: http://path-to-catalog.json
      #   dbtManifestHttpPath: http://path-to-manifest.json
      # # For S3
      #   dbtSecurityConfig:  # These are modeled after all AWS credentials
      #     awsAccessKeyId: KEY
      #     awsSecretAccessKey: SECRET
      #     awsRegion: us-east-2
      #   dbtPrefixConfig:
      #     dbtBucketName: bucket
      #     dbtObjectPrefix: "dbt/"
      # # For GCS
      #   dbtSecurityConfig:  # These are modeled after all GCS credentials
      #     type: My Type
      #     projectId: project ID
      #     privateKeyId: us-east-2
      #     privateKey: |
      #       -----BEGIN PRIVATE KEY-----
      #       Super secret key
      #       -----END PRIVATE KEY-----
      #     clientEmail: client@mail.com
      #     clientId: 1234
      #     authUri: https://accounts.google.com/o/oauth2/auth (default)
      #     tokenUri: https://oauth2.googleapis.com/token (default)
      #     authProviderX509CertUrl: https://www.googleapis.com/oauth2/v1/certs (default)
      #     clientX509CertUrl: https://cert.url (URI)
      #   dbtPrefixConfig:
      #     dbtBucketName: bucket
      #     dbtObjectPrefix: "dbt/"
sink:
  type: metadata-rest
  config: {}
workflowConfig:
  # loggerLevel: DEBUG  # DEBUG, INFO, WARN or ERROR
  openMetadataServerConfig:
    hostPort: "<OpenMetadata host and port>"
    authProvider: "<OpenMetadata auth provider>"
```

#### Source Configuration - Service Connection

- **awsAccessKeyId**: Enter your secure access key ID for your DynamoDB connection. The specified key ID should be authorized to read all databases you want to include in the metadata ingestion workflow.
- **awsSecretAccessKey**: Enter the Secret Access Key (the passcode key pair to the key ID from above).
- **awsRegion**: Enter the location of the amazon cluster that your data and account are associated with.
- **awsSessionToken**: The AWS session token is an optional parameter. If you want, enter the details of your temporary session token.
- **endPointURL**: Your DynamoDB connector will automatically determine the AWS DynamoDB endpoint URL based on the region. You may override this behavior by entering a value to the endpoint URL.
- **Connection Options (Optional)**: Enter the details for any additional connection options that can be sent to DynamoDB during the connection. These details must be added as Key-Value pairs.
- **Connection Arguments (Optional)**: Enter the details for any additional connection arguments such as security or protocol configs that can be sent to DynamoDB during the connection. These details must be added as Key-Value pairs.
    - In case you are using Single-Sign-On (SSO) for authentication, add the `authenticator` details in the Connection Arguments as a Key-Value pair as follows: `"authenticator" : "sso_login_url"`
    - In case you authenticate with SSO using an external browser popup, then add the `authenticator` details in the Connection Arguments as a Key-Value pair as follows: `"authenticator" : "externalbrowser"`

#### Source Configuration - Source Config

The `sourceConfig` is defined [here](https://github.com/open-metadata/OpenMetadata/blob/main/openmetadata-spec/src/main/resources/json/schema/metadataIngestion/databaseServiceMetadataPipeline.json):

- `markDeletedTables`: To flag tables as soft-deleted if they are not present anymore in the source system.
- `includeTables`: true or false, to ingest table data. Default is true.
- `includeViews`: true or false, to ingest views definitions.
- `databaseFilterPattern`, `schemaFilterPattern`, `tableFilternPattern`: Note that the they support regex as include or exclude. E.g.,

```yaml
tableFilterPattern:
  includes:
    - users
    - type_test
```

#### Sink Configuration

To send the metadata to OpenMetadata, it needs to be specified as `type: metadata-rest`.

#### Workflow Configuration

The main property here is the `openMetadataServerConfig`, where you can define the host and security provider of your OpenMetadata installation.

For a simple, local installation using our docker containers, this looks like:

```yaml
workflowConfig:
  openMetadataServerConfig:
    hostPort: 'http://localhost:8585/api'
    authProvider: openmetadata
    securityConfig:
      jwtToken: '{bot_jwt_token}'
```

We support different security providers. You can find their definitions [here](https://github.com/open-metadata/OpenMetadata/tree/main/openmetadata-spec/src/main/resources/json/schema/security/client).
You can find the different implementation of the ingestion below.

<Collapse title="Configure SSO in the Ingestion Workflows">

### Openmetadata JWT Auth

```yaml
workflowConfig:
  openMetadataServerConfig:
    hostPort: 'http://localhost:8585/api'
    authProvider: openmetadata
    securityConfig:
      jwtToken: '{bot_jwt_token}'
```

### Auth0 SSO

```yaml
workflowConfig:
  openMetadataServerConfig:
    hostPort: 'http://localhost:8585/api'
    authProvider: auth0
    securityConfig:
      clientId: '{your_client_id}'
      secretKey: '{your_client_secret}'
      domain: '{your_domain}'
```

### Azure SSO

```yaml
workflowConfig:
  openMetadataServerConfig:
    hostPort: 'http://localhost:8585/api'
    authProvider: azure
    securityConfig:
      clientSecret: '{your_client_secret}'
      authority: '{your_authority_url}'
      clientId: '{your_client_id}'
      scopes:
        - your_scopes
```

### Custom OIDC SSO

```yaml
workflowConfig:
  openMetadataServerConfig:
    hostPort: 'http://localhost:8585/api'
    authProvider: custom-oidc
    securityConfig:
      clientId: '{your_client_id}'
      secretKey: '{your_client_secret}'
      domain: '{your_domain}'
```

### Google SSO

```yaml
workflowConfig:
  openMetadataServerConfig:
    hostPort: 'http://localhost:8585/api'
    authProvider: google
    securityConfig:
      secretKey: '{path-to-json-creds}'
```

### Okta SSO

```yaml
workflowConfig:
  openMetadataServerConfig:
    hostPort: http://localhost:8585/api
    authProvider: okta
    securityConfig:
      clientId: "{CLIENT_ID - SPA APP}"
      orgURL: "{ISSUER_URL}/v1/token"
      privateKey: "{public/private keypair}"
      email: "{email}"
      scopes:
        - token
```

### Amazon Cognito SSO

The ingestion can be configured by [Enabling JWT Tokens](https://docs.open-metadata.org/deployment/security/enable-jwt-tokens)

```yaml
workflowConfig:
  openMetadataServerConfig:
    hostPort: 'http://localhost:8585/api'
    authProvider: auth0
    securityConfig:
      clientId: '{your_client_id}'
      secretKey: '{your_client_secret}'
      domain: '{your_domain}'
```

### OneLogin SSO

Which uses Custom OIDC for the ingestion

```yaml
workflowConfig:
  openMetadataServerConfig:
    hostPort: 'http://localhost:8585/api'
    authProvider: custom-oidc
    securityConfig:
      clientId: '{your_client_id}'
      secretKey: '{your_client_secret}'
      domain: '{your_domain}'
```

### KeyCloak SSO

Which uses Custom OIDC for the ingestion

```yaml
workflowConfig:
  openMetadataServerConfig:
    hostPort: 'http://localhost:8585/api'
    authProvider: custom-oidc
    securityConfig:
      clientId: '{your_client_id}'
      secretKey: '{your_client_secret}'
      domain: '{your_domain}'
```

</Collapse>

### 2. Run with the CLI

First, we will need to save the YAML file. Afterward, and with all requirements installed, we can run:

```bash
metadata ingest -c <path-to-yaml>
```

Note that from connector to connector, this recipe will always be the same. By updating the YAML configuration,
you will be able to extract metadata from different sources.

## dbt Integration

You can learn more about how to ingest dbt models' definitions and their lineage [here](https://docs.open-metadata.org/connectors/ingestion/workflows/dbt).
