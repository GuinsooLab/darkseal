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

import React from 'react';
import AppState from '../AppState';
import { CurrentTourPageType } from '../enums/tour.enum';
import { getCurrentDatasetTab } from './DatasetDetailsUtils';

export const getSteps = (value: string, clearSearchTerm: () => void) => {
  return [
    {
      content: () => (
        <p>
          Discover all your data assets in a single place with{' '}
          <strong>Darkseal</strong>, a centralized metadata store. Collaborate
          with your team and get a holistic picture of the data in organization.
        </p>
      ),
      stepInteraction: false,
      selector: '#assetStatsCount',
    },
    {
      content: () => (
        <p>
          <strong>Activity Feeds</strong> help you understand how the data is
          changing in your organization.
        </p>
      ),
      selector: '#feedData',
      stepInteraction: false,
    },
    {
      content: () => (
        <p>
          Search for matching data assets by &quot;name&quot;,
          &quot;description&quot;, &quot;column name&quot;, and so on from the{' '}
          <strong>Search</strong> box.
        </p>
      ),
      selector: '#searchBox',
      stepInteraction: false,
      beforeNext: clearSearchTerm,
    },
    {
      beforePrev: clearSearchTerm,
      content: () => (
        <p>
          In the search box, type <strong>&quot;{value}&quot;</strong>. Hit{' '}
          <strong>Enter.</strong>
        </p>
      ),
      actionType: 'enter',
      userTypeText: value,
      selector: '#searchBox',
      beforeNext: () => {
        clearSearchTerm();
        AppState.currentTourPage = CurrentTourPageType.EXPLORE_PAGE;
      },
    },
    {
      beforePrev: () => {
        AppState.currentTourPage = CurrentTourPageType.MY_DATA_PAGE;
      },
      content: () => (
        <p>
          From the <strong>&quot;Explore&quot;</strong> page, view a summary of
          each asset, including: title, description, owner, tier (importance),
          usage, and location.
        </p>
      ),
      selector: '#tabledatacard0',
      stepInteraction: false,
    },
    {
      content: () => (
        <p>
          Click on the <strong>title of the asset</strong> to view more details.
        </p>
      ),
      actionType: 'click',
      selector: '#tabledatacard0Title',
      beforeNext: () => {
        AppState.currentTourPage = CurrentTourPageType.DATASET_PAGE;
      },
    },
    {
      beforePrev: () => {
        AppState.currentTourPage = CurrentTourPageType.EXPLORE_PAGE;
      },
      content: () => (
        <p>
          {' '}
          Get to know the table <strong>Schema</strong>, including column names
          and data types as well as column descriptions and tags. You can even
          view metadata for complex types such as structs.
        </p>
      ),
      stepInteraction: false,
      selector: '#schemaDetails',
    },
    {
      beforePrev: () => {
        AppState.activeTabforTourDatasetPage = getCurrentDatasetTab('schema');
      },
      actionType: 'click',
      content: () => (
        <p>
          Click on the <strong>&quot;Sample Data&quot;</strong> tab.
        </p>
      ),
      selector: '#sampleData',
      beforeNext: () => {
        AppState.activeTabforTourDatasetPage =
          getCurrentDatasetTab('sample_data');
      },
    },
    {
      content: () => (
        <p>
          Take a look at the <strong>Sample Data</strong> to get a feel for what
          the table contains and how you might use it.
        </p>
      ),
      selector: '#sampleDataDetails',
    },
    {
      beforePrev: () => {
        AppState.activeTabforTourDatasetPage =
          getCurrentDatasetTab('sample_data');
      },
      beforeNext: () => {
        AppState.activeTabforTourDatasetPage = getCurrentDatasetTab('profiler');
      },
      actionType: 'click',
      content: () => (
        <p>
          Click on the <strong>&quot;Profiler&quot;</strong> tab.
        </p>
      ),
      selector: '#profiler',
    },
    {
      content: () => (
        <p>
          Discover assets with the <strong>Data Profiler</strong>. Get to know
          the table usage stats, check for null values and duplicates, and
          understand the column data distributions.
        </p>
      ),
      stepInteraction: false,
      selector: '#profilerDetails',
    },
    {
      beforePrev: () => {
        AppState.activeTabforTourDatasetPage = getCurrentDatasetTab('profiler');
      },
      beforeNext: () => {
        AppState.activeTabforTourDatasetPage = getCurrentDatasetTab('lineage');
      },
      actionType: 'click',
      content: () => (
        <p>
          Click on the <strong>&quot;Lineage&quot;</strong> tab
        </p>
      ),
      selector: '#lineage',
    },
    {
      content: () => (
        <p>
          With <strong>Lineage</strong>, trace the path of data across tables,
          pipelines, & dashboards.
        </p>
      ),
      stepInteraction: false,
      selector: '#lineageDetails',
    },
    {
      beforeNext: () => {
        AppState.activeTabforTourDatasetPage = getCurrentDatasetTab('manage');
      },
      actionType: 'click',
      content: () => (
        <p>
          Click on the <strong>&quot;Manage&quot;</strong> tab
        </p>
      ),
      selector: '#manage',
    },
    {
      beforePrev: () => {
        AppState.activeTabforTourDatasetPage = getCurrentDatasetTab('lineage');
      },
      content: () => (
        <p>
          From <strong>&quot;Manage&quot;</strong>, you can claim ownership, and
          set the tier.
        </p>
      ),
      stepInteraction: false,
      selector: '#manageTabDetails',
    },
  ];
};
