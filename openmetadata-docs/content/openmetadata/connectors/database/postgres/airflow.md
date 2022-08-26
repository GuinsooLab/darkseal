---
title: Run Postgres Connector using Airflow SDK
slug: /openmetadata/connectors/database/postgres/airflow
---

<ConnectorIntro connector="Postgres" goal="Airflow" hasProfiler="true" hasDBT="true" />

<Requirements />

<MetadataIngestionServiceDev service="database" connector="Postgres" goal="Airflow"/>

<h4>Source Configuration - Service Connection</h4>

- **username**: Specify the User to connect to Postgres. It should have enough privileges to read all the metadata.
- **password**: Password to connect to Postgres.
- **hostPort**: Enter the fully qualified hostname and port number for your Postgres deployment in the Host and Port field.
- **Connection Options (Optional)**: Enter the details for any additional connection options that can be sent to Postgres during the connection. These details must be added as Key-Value pairs.
- **Connection Arguments (Optional)**: Enter the details for any additional connection arguments such as security or protocol configs that can be sent to Postgres during the connection. These details must be added as Key-Value pairs. 
  - In case you are using Single-Sign-On (SSO) for authentication, add the `authenticator` details in the Connection Arguments as a Key-Value pair as follows: `"authenticator" : "sso_login_url"`
  - In case you authenticate with SSO using an external browser popup, then add the `authenticator` details in the Connection Arguments as a Key-Value pair as follows: `"authenticator" : "externalbrowser"`

<MetadataIngestionConfig service="database" connector="Postgres" goal="Airflow" hasProfiler="true" hasDBT="true"/>
