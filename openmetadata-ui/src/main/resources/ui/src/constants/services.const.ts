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

import { ServiceTypes, StepperStepType } from 'Models';
import airbyte from '../assets/img/Airbyte.png';
import noDataFound from '../assets/img/no-data-placeholder.png';
import noService from '../assets/img/no-service.png';
import airflow from '../assets/img/service-icon-airflow.png';
import athena from '../assets/img/service-icon-athena.png';
import azuresql from '../assets/img/service-icon-azuresql.png';
import clickhouse from '../assets/img/service-icon-clickhouse.png';
import databrick from '../assets/img/service-icon-databrick.png';
import deltalake from '../assets/img/service-icon-delta-lake.png';
import druid from '../assets/img/service-icon-druid.png';
import dynamodb from '../assets/img/service-icon-dynamodb.png';
import databaseDefault from '../assets/img/service-icon-generic.png';
import glue from '../assets/img/service-icon-glue.png';
import hive from '../assets/img/service-icon-hive.png';
import ibmdb2 from '../assets/img/service-icon-ibmdb2.png';
import kafka from '../assets/img/service-icon-kafka.png';
import looker from '../assets/img/service-icon-looker.png';
import mariadb from '../assets/img/service-icon-mariadb.png';
import metabase from '../assets/img/service-icon-metabase.png';
import mlflow from '../assets/img/service-icon-mlflow.png';
import mssql from '../assets/img/service-icon-mssql.png';
import oracle from '../assets/img/service-icon-oracle.png';
import postgres from '../assets/img/service-icon-post.png';
import powerbi from '../assets/img/service-icon-power-bi.png';
import prefect from '../assets/img/service-icon-prefect.png';
import presto from '../assets/img/service-icon-presto.png';
import pulsar from '../assets/img/service-icon-pulsar.png';
import query from '../assets/img/service-icon-query.png';
import redash from '../assets/img/service-icon-redash.png';
import redshift from '../assets/img/service-icon-redshift.png';
import salesforce from '../assets/img/service-icon-salesforce.png';
import scikit from '../assets/img/service-icon-scikit.png';
import singlestore from '../assets/img/service-icon-singlestore.png';
import snowflakes from '../assets/img/service-icon-snowflakes.png';
import mysql from '../assets/img/service-icon-sql.png';
import sqlite from '../assets/img/service-icon-sqlite.png';
import superset from '../assets/img/service-icon-superset.png';
import tableau from '../assets/img/service-icon-tableau.png';
import trino from '../assets/img/service-icon-trino.png';
import vertica from '../assets/img/service-icon-vertica.png';
import dashboardDefault from '../assets/svg/dashboard.svg';
import iconDefaultService from '../assets/svg/default-service-icon.svg';
import pipelineDefault from '../assets/svg/pipeline.svg';
import plus from '../assets/svg/plus.svg';
import topicDefault from '../assets/svg/topic.svg';
import { DashboardServiceType } from '../generated/entity/services/dashboardService';
import { DatabaseServiceType } from '../generated/entity/services/databaseService';
import { MessagingServiceType } from '../generated/entity/services/messagingService';
import { MlModelServiceType } from '../generated/entity/services/mlmodelService';
import { PipelineServiceType } from '../generated/entity/services/pipelineService';

export const NoDataFoundPlaceHolder = noDataFound;
export const MYSQL = mysql;
export const SQLITE = sqlite;
export const MSSQL = mssql;
export const REDSHIFT = redshift;
export const BIGQUERY = query;
export const HIVE = hive;
export const POSTGRES = postgres;
export const ORACLE = oracle;
export const SNOWFLAKE = snowflakes;
export const ATHENA = athena;
export const PRESTO = presto;
export const TRINO = trino;
export const GLUE = glue;
export const MARIADB = mariadb;
export const VERTICA = vertica;
export const KAFKA = kafka;
export const PULSAR = pulsar;
export const SUPERSET = superset;
export const LOOKER = looker;
export const TABLEAU = tableau;
export const REDASH = redash;
export const METABASE = metabase;
export const AZURESQL = azuresql;
export const CLICKHOUSE = clickhouse;
export const DATABRICK = databrick;
export const IBMDB2 = ibmdb2;
export const DRUID = druid;
export const DYNAMODB = dynamodb;
export const SINGLESTORE = singlestore;
export const SALESFORCE = salesforce;
export const MLFLOW = mlflow;
export const SCIKIT = scikit;
export const DELTALAKE = deltalake;
export const DEFAULT_SERVICE = iconDefaultService;
export const AIRBYTE = airbyte;

export const AIRFLOW = airflow;
export const PREFECT = prefect;
export const POWERBI = powerbi;
export const DATABASE_DEFAULT = databaseDefault;
export const TOPIC_DEFAULT = topicDefault;
export const DASHBOARD_DEFAULT = dashboardDefault;
export const PIPELINE_DEFAULT = pipelineDefault;

export const PLUS = plus;
export const NOSERVICE = noService;
export const excludedService = [MlModelServiceType.Sklearn];
export const serviceTypes: Record<ServiceTypes, Array<string>> = {
  databaseServices: Object.values(DatabaseServiceType),
  messagingServices: Object.values(MessagingServiceType),
  dashboardServices: Object.values(DashboardServiceType),
  pipelineServices: Object.values(PipelineServiceType),
  mlmodelServices: Object.values(MlModelServiceType),
};

export const arrServiceTypes: Array<ServiceTypes> = [
  'databaseServices',
  'messagingServices',
  'dashboardServices',
  'pipelineServices',
  'mlmodelServices',
];

export const servicesDisplayName = {
  databaseServices: 'Database Service',
  messagingServices: 'Messaging Service',
  dashboardServices: 'Dashboard Service',
  pipelineServices: 'Pipeline Service',
  mlmodelServices: 'ML Model Service',
};

export const STEPS_FOR_ADD_SERVICE: Array<StepperStepType> = [
  { name: 'Select Service Type', step: 1 },
  { name: 'Configure Service', step: 2 },
  { name: 'Connection Details', step: 3 },
];

export const DEF_UI_SCHEMA = {
  supportsMetadataExtraction: { 'ui:widget': 'hidden', 'ui:hideError': true },
  supportsUsageExtraction: { 'ui:widget': 'hidden', 'ui:hideError': true },
  supportsProfiler: { 'ui:widget': 'hidden', 'ui:hideError': true },
  supportsDatabase: { 'ui:widget': 'hidden', 'ui:hideError': true },
  type: { 'ui:widget': 'hidden' },
};

export const COMMON_UI_SCHEMA = {
  ...DEF_UI_SCHEMA,
  connection: {
    ...DEF_UI_SCHEMA,
  },
};
