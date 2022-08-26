---
title: Run Tableau Connector using the CLI
slug: /openmetadata/connectors/dashboard/tableau/cli
---

<ConnectorIntro connector="Tableau" goal="CLI"/>

<Requirements />

<MetadataIngestionServiceDev service="dashboard" connector="Tableau" goal="CLI"/>

<h4>Source Configuration - Service Connection</h4>

- **hostPort**: URL to the Tableau instance.
- **username**: Specify the User to connect to Tableau. It should have enough privileges to read all the metadata.
- **password**: Password for Tableau.
- **apiVersion**: Tableau API version.
- **siteName**: Tableau Site Name.
- **personalAccessTokenName**: Access token. To be used if not logging in with user/password.
- **personalAccessTokenSecret**: Access token Secret. To be used if not logging in with user/password.
- **env**: Tableau Environment.

<MetadataIngestionConfig service="dashboard" connector="Tableau" goal="CLI" />
