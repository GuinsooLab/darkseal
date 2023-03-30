---
title: dbt Workflow
slug: /connectors/ingestion/workflows/dbt
---

# dbt Workflow

<InlineCalloutContainer>
  <InlineCallout
    color="violet-70"
    icon="celebration"
    bold="dbt Workflow from UI"
    href="/connectors/ingestion/workflows/dbt/ingest-dbt-ui"
  >
    Configure the dbt Workflow from the UI.
  </InlineCallout>
  <InlineCallout
    color="violet-70"
    icon="celebration"
    bold="dbt Workflow from CLI"
    href="/connectors/ingestion/workflows/dbt/ingest-dbt-cli"
  >
    Configure the dbt Workflow from the CLI.
  </InlineCallout>
</InlineCalloutContainer>


# dbt Integration
## OpenMetadata integrates below metadata from dbt

### 1. dbt Queries
Queries used to create the dbt models can be viewed in the dbt tab

<Image src="/images/openmetadata/ingestion/workflows/dbt/dbt-features/dbt-query.png" alt="dbt-query" caption="dbt Query"/>

### 2. dbt Lineage
Lineage from dbt models can be viewed in the Lineage tab

<Image src="/images/openmetadata/ingestion/workflows/dbt/dbt-features/dbt-lineage.png" alt="dbt-lineage" caption="dbt Lineage"/>

### 3. dbt Tags
Table and column level tags can be imported from dbt

Please refer [here](/connectors/ingestion/workflows/dbt/ingest-dbt-tags) for adding dbt tags

<Image src="/images/openmetadata/ingestion/workflows/dbt/dbt-features/dbt-tags.png" alt="dbt-tags" caption="dbt Tags"/>

### 4. dbt Owner
Owner from dbt models can be imported and assigned to respective tables

Please refer [here](/connectors/ingestion/workflows/dbt/ingest-dbt-owner) for adding dbt owner

<Image src="/images/openmetadata/ingestion/workflows/dbt/dbt-features/dbt-owner.png" alt="dbt-owner" caption="dbt Owner"/>

### 5. dbt Descriptions
Descriptions from dbt models can be imported and assigned to respective tables and columns.

By default descriptions from `manifest.json` will be imported. Descriptions from `catalog.json` will only be updated if catalog file is passed.

<Image src="/images/openmetadata/ingestion/workflows/dbt/dbt-features/dbt-descriptions.png" alt="dbt-descriptions" caption="dbt Descriptions"/>

### 6. dbt Tests and Test Results
Tests from dbt will only be imported if the `run_results.json` file is passed.

<Image src="/images/openmetadata/ingestion/workflows/dbt/dbt-features/dbt-tests.png" alt="dbt-tests" caption="dbt Tests"/>