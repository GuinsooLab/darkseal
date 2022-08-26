---
title: Run Druid Connector using the CLI
slug: /openmetadata/connectors/database/druid/cli
---

<ConnectorIntro connector="Druid" goal="CLI" hasProfiler="true" hasDBT="true" />

<Requirements />

<MetadataIngestionServiceDev service="database" connector="Druid" goal="CLI"/>

<h4>Source Configuration - Service Connection</h4>

- **username**: Specify the User to connect to Druid. It should have enough privileges to read all the metadata.
- **password**: Password to connect to Druid.
- **hostPort**: Enter the fully qualified hostname and port number for your Druid deployment in the Host and Port field.
- **database**: The database of the data source is an optional parameter, if you would like to restrict the metadata reading to a single database. If left blank, OpenMetadata ingestion attempts to scan all the databases.
- **Connection Options (Optional)**: Enter the details for any additional connection options that can be sent to Druid during the connection. These details must be added as Key-Value pairs.
- **Connection Arguments (Optional)**: Enter the details for any additional connection arguments such as security or protocol configs that can be sent to Druid during the connection. These details must be added as Key-Value pairs. 
  - In case you are using Single-Sign-On (SSO) for authentication, add the `authenticator` details in the Connection Arguments as a Key-Value pair as follows: `"authenticator" : "sso_login_url"`
  - In case you authenticate with SSO using an external browser popup, then add the `authenticator` details in the Connection Arguments as a Key-Value pair as follows: `"authenticator" : "externalbrowser"`

<MetadataIngestionConfig service="database" connector="Druid" goal="CLI" hasProfiler="true" hasDBT="true"/>
