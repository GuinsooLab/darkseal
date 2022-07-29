---
title: Run DynamoDB Connector using Airflow SDK
slug: /openmetadata/connectors/database/dynamodb/airflow
---

<ConnectorIntro connector="DynamoDB" goal="Airflow" hasDBT="true"/>

<Requirements />

<MetadataIngestionServiceDev service="database" connector="DynamoDB" goal="Airflow"/>

<h4>Source Configuration - Service Connection</h4>

- **awsAccessKeyId**: Enter your secure access key ID for your DynamoDB connection. The specified key ID should be authorized to read all databases you want to include in the metadata ingestion workflow.
- **awsSecretAccessKey**: Enter the Secret Access Key (the passcode key pair to the key ID from above).
- **awsRegion**: Enter the location of the amazon cluster that your data and account are associated with.
- **awsSessionToken**: The AWS session token is an optional parameter. If you want, enter the details of your temporary session token.
- **endPointURL**: Your DynamoDB connector will automatically determine the AWS DynamoDB endpoint URL based on the region. You may override this behavior by entering a value to the endpoint URL.
- **Connection Options (Optional)**: Enter the details for any additional connection options that can be sent to DynamoDB during the connection. These details must be added as Key-Value pairs.
- **Connection Arguments (Optional)**: Enter the details for any additional connection arguments such as security or protocol configs that can be sent to DynamoDB during the connection. These details must be added as Key-Value pairs.
    - In case you are using Single-Sign-On (SSO) for authentication, add the `authenticator` details in the Connection Arguments as a Key-Value pair as follows: `"authenticator" : "sso_login_url"`
    - In case you authenticate with SSO using an external browser popup, then add the `authenticator` details in the Connection Arguments as a Key-Value pair as follows: `"authenticator" : "externalbrowser"`

<MetadataIngestionConfig service="database" connector="DynamoDB" goal="Airflow" hasDBT="true"/>
