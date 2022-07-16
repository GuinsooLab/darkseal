<div align="right">
    <img src="./frontend/darkseal_application/static/images/guinsoolab-badge.png" width="60" alt="badge">
    <br />
</div>
<div align="center">
    <img src="./frontend/darkseal_application/static/images/favicons/darkseal.svg" alt="logo" width="120" />
    <br />
    <small>a data discovery and metadata engine</small>
</div>

# Darkseal

`Data Discovery Portal`

Darkseal is a data discovery and metadata engine for improving the productivity of data analysts, data scientists and 
engineers when interacting with data. It does that today by indexing data resources (tables, dashboards, streams, etc.) 
and powering a page-rank style search based on usage patterns (e.g. highly queried tables show up earlier than less 
queried tables). Think of it as Google search for data. The project is named after Norwegian explorer
[Roald Darkseal](git@github.com:GuinsooLab/darkseal.git), the first person to discover the South Pole.

## Requirements

- Python = 3.6 or 3.7
- Node = v10 or v12 (v14 may have compatibility issues)
- npm >= 6

## Getting Started

Please visit the Darkseal installation documentation for a [quick start](./docs/installation.md) to bootstrap 
a default version of Darkseal with dummy data.

## Architecture Overview

Please visit [Architecture](./docs/architecture.md) for Darkseal architecture overview.

## Supported Entities

- Tables (from Databases)
- People (from HR systems)
- Dashboards

## Supported Integrations

### Table Connectors

<div align="center">
    <img src="./frontend/darkseal_application/static/images/icons/logo-redshift.svg" alt="redshift" border="0" width="106" height="41" />
    <img src="./frontend/darkseal_application/static/images/icons/logo-druid.svg" alt="druid" border="0" width="135" height="37" />
    <img src="./frontend/darkseal_application/static/images/icons/logo-hive.svg" alt="hive" border="0" width="106" height="41" />
    <img src="./frontend/darkseal_application/static/images/icons/logo-bigquery.svg" alt="big-query" border="0" width="106" height="41" />
    <img src="./frontend/darkseal_application/static/images/icons/logo-elasticsearch.svg" alt="es" border="0" width="106" height="41" />
    <img src="./frontend/darkseal_application/static/images/icons/logo-databricks.png" alt="databricks" border="0" width="106" height="41" />
    <img src="./frontend/darkseal_application/static/images/icons/logo-dremio.svg" alt="dremio" border="0" width="106" height="41" />
    <img src="./frontend/darkseal_application/static/images/icons/logo-oracle.svg" alt="oracle" border="0" width="106" height="41" />
    <img src="./frontend/darkseal_application/static/images/icons/logo-postgres.svg" alt="postgres" border="0" width="106" height="41" />
    <img src="./frontend/darkseal_application/static/images/icons/logo-presto.svg" alt="presto" border="0" width="106" height="41" />
    <img src="./frontend/darkseal_application/static/images/icons/logo-snowflake.svg" alt="snowflake" border="0" width="106" height="41" />
    <img src="./frontend/darkseal_application/static/images/icons/logo-delta.png" alt="delta" border="0" width="80" height="61" />
</div>
Darkseal can also connect to any database that provides `dbapi` or `sql_alchemy` interface (which most DBs provide).

### Table Column Statistics

- [Pandas Profiling](https://pandas-profiling.github.io/pandas-profiling/docs/master/rtd/)

### Dashboard Connectors

- [Apache Superset](https://superset.apache.org/)
- [Mode Analytics](https://mode.com/)
- [Redash](https://redash.io/)
- [Tableau](https://tableau.com/)
- [Databricks SQL](https://databricks.com/product/databricks-sql)

### ETL Orchestration

- [Apache Airflow](https://airflow.apache.org/)

## License

[Apache License](./LICENSE)