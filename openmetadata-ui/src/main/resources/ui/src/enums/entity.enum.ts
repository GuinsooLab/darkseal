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

export enum EntityType {
  DATASET = 'dataset',
  TABLE = 'table',
  TOPIC = 'topic',
  DASHBOARD = 'dashboard',
  PIPELINE = 'pipeline',
  DATABASE = 'database',
  DATABASE_SCHEMA = 'databaseSchema',
  GLOSSARY = 'glossary',
  GLOSSARY_TERM = 'glossaryTerm',
  DATABASE_SERVICE = 'databaseService',
  MESSAGING_SERVICE = 'messagingService',
  DASHBOARD_SERVICE = 'dashboardService',
  PIPELINE_SERVICE = 'pipelineService',
  MLMODEL_SERVICE = 'mlmodelService',
  WEBHOOK = 'webhook',
  MLMODEL = 'mlmodel',
  TYPE = 'type',
}

export enum AssetsType {
  TABLE = 'table',
  TOPIC = 'topic',
  DASHBOARD = 'dashboard',
  PIPELINE = 'pipeline',
  MLMODEL = 'mlmodel',
}

export enum ChangeType {
  ADDED = 'Added',
  UPDATED = 'Updated',
  REMOVED = 'Removed',
}

export enum EntityLineageDirection {
  TOP_BOTTOM = 'TB',
  LEFT_RIGHT = 'LR',
}

export enum EntityLineageNodeType {
  INPUT = 'input',
  OUTPUT = 'output',
  DEFAULT = 'default',
  NOT_CONNECTED = 'not-connected',
}

export enum TabSpecificField {
  SAMPLE_DATA = 'sampleData',
  ACTIVITY_FEED = 'activity_feed',
  TABLE_PROFILE = 'tableProfile',
  LINEAGE = 'lineage',
  COLUMNS = 'columns',
  USAGE_SUMMARY = 'usageSummary',
  FOLLOWERS = 'followers',
  JOINS = 'joins',
  TAGS = 'tags',
  OWNER = 'owner',
  DATAMODEL = 'dataModel',
  CHARTS = 'charts',
  TASKS = 'tasks',
  TABLE_QUERIES = 'tableQueries',
  TESTS = 'tests',
  PIPELINE_STATUS = 'pipelineStatus',
  DASHBOARD = 'dashboard',
  TABLE_CONSTRAINTS = 'tableConstraints',
  EXTENSION = 'extension',
}

export enum FqnPart {
  Service,
  Database,
  Schema,
  Table,
  Column,
  NestedColumn,
}
