<div align="right">
    <img src="./openmetadata-ui/src/main/resources/ui/public/guinsoolab-badge.png" width="60" alt="badge">
    <br />
</div>
<div align="center">
    <img src="./openmetadata-ui/src/main/resources/ui/public/darkseal.svg" alt="logo" width="120" />
    <br />
    <small>A Single place to Discover, Collaborate, and Get your data right</small>
</div>

# Darkseal

Darkseal includes the following:

- **Metadata schemas** - Defines core abstractions and vocabulary for metadata with schemas for Types, Entities, Relationships between entities. This is the foundation of the Open Metadata Standard.
- **Metadata store** - Stores metadata graph that connects data assets, user, and tool generated metadata.
- **Metadata APIs** - For producing and consuming metadata built on schemas for User Interfaces and Integration of tools, systems, and services.
- **Ingestion framework** - A pluggable framework for integrating tools and ingesting metadata to the metadata store. Ingestion framework already supports well know data warehouses - Google BigQuery, Snowflake, Amazon Redshift, and Apache Hive, and databases - MySQL, Postgres, Oracle, MSSQL, and [Guinsoo](https://github.com/ciusji/guinsoo).
- **Metadata User Interface** - One single place for users to discover, and collaborate on all data.

## Snapshots & Gifs

### Welcome

![Welcome](./docs/overview/overview-1.png)

### New Service

![New Service](./docs/overview/overview-2.png)

### Explore Tables

![Explore Tables](./docs/overview/overview-3.png)

### Table Lineage

![Table Lineage](./docs/overview/overview-4.png)

### Table Schema

![Table Schema](./docs/overview/overview-5.png)

## Architecture

Darkseal depends on following components to build a metadata platform:

- JsonSchemas for defining Metadata Schemas
- Dropwizard/Jetty for REST APIs
- MySQL 8.x to store Metadata ([Guinsoo](https://github.com/ciusji/guinsoo) is coming)
- ElasticSearch/OpenElasticsearch 7.x to index Metadata and power

![dgp-darkseal](./openmetadata-ui/src/main/resources/ui/public/gdp-darkseal.svg)


## Build From Source

```bash
# Clone source
git clone git@github.com:GuinsooLab/darkseal.git

# Package 
mvn clean package -DskipTests

# Prepare database and indexes
./bootstrap/bootstrap_storage.sh drop-create-all

# Start Server
./bin/openmetadata.sh start
```

For more information, please referer to [here](https://ciusji.gitbook.io/guinsoolab/products/data-discovery/darkseal).

## Service Integration

### Database Service Support

- Athena
- AzureSQL
- BigQuery
- Clickhouse
- Databricks
- Datalake
- Db2
- DeltaLake
- Druid
- DynamoDB
- Glue
- Hive
- MariaDB
- Mssql
- MySQL
- Oracle
- Pinot
- Postgres
- Presto
- Redshift
- SQLite
- Salesforce
- SingleStore
- Snowflake
- Trino
- Vertica
- [GuinsooLab Stack](https://github.com/GuinsooLab)

### Message Service Support

- Kafka
- Pulsar

### Dashboard Service Support

- Looker
- Metabase
- Mode
- PowerBI
- Redash
- Superset
- Tableau
- [Spotrix](https://github.com/Spotrix/spotrix) 🚀

### Pipeline Service Support

- Airbyte
- Airflow
- Glue
- [Sheenflow](https://github.com/GuinsooLab/sheenflow)

### ML Model Service Support

- Mlflow

## Documentation & Supports

- [Overview](https://ciusji.gitbook.io/guinsoolab/products/data-discovery/darkseal/overview)
- [Install & Deploy](https://ciusji.gitbook.io/guinsoolab/products/data-discovery/darkseal/deployment)
- [Quickstart With Darkseal](https://ciusji.gitbook.io/guinsoolab/products/data-discovery/darkseal/quickstart)
- [Darkseal Main Concepts](https://ciusji.gitbook.io/guinsoolab/products/data-discovery/darkseal/main-concepts)
- [Dearkseal Service Integrates](https://ciusji.gitbook.io/guinsoolab/products/data-discovery/darkseal/integrations)
- [Roadmap](https://ciusji.gitbook.io/guinsoolab/products/data-discovery/darkseal/roadmap)

## Contributors

We ❤️ all contributions, big and small! Check out our [CONTRIBUTING](./CONTRIBUTING.md) guide to get started and let us know how we can help.

Don't want to miss anything? Give the project a ⭐ 🚀

## License

Darkseal is released under [Apache License, Version 2.0](http://www.apache.org/licenses/LICENSE-2.0)
