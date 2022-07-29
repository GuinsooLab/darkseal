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

import { toLower } from 'lodash';
import { AggregationType, Bucket, FilterObject } from 'Models';
import { SearchIndex } from '../enums/search.enum';
import { getFilterKey } from '../utils/FilterUtils';
import { Icons } from '../utils/SvgUtils';
import { tiers } from './constants';

export const INITIAL_SORT_FIELD = 'updatedAt';
export const INITIAL_SORT_ORDER = 'desc';
export const INITIAL_FROM = 1;
export const ZERO_SIZE = 0;
export const emptyValue = '';
export const initialFilterQS = 'initialFilter';
export const searchFilterQS = 'searchFilter';
export const MAX_RESULT_HITS = 10000;

export const UPDATABLE_AGGREGATION = ['Service', 'Tier', 'Tags'];

export const FACET_FILTER_SORTING_ORDER = [
  'Service',
  'Tier',
  'Tags',
  'ServiceName',
  'Database',
  'DatabaseSchema',
];

export const INITIAL_FILTERS = {
  tags: [],
  service: [],
  tier: [],
  database: [],
  databaseschema: [],
  servicename: [],
};

export const tableSortingFields = [
  {
    name: 'Last Updated',
    value: INITIAL_SORT_FIELD,
  },
  { name: 'Weekly Usage', value: 'usageSummary.weeklyStats.count' },
  { name: 'Relevance', value: '' },
];

export const entitySortingFields = [
  {
    name: 'Last Updated',
    value: INITIAL_SORT_FIELD,
  },
  { name: 'Relevance', value: '' },
];

export const sortingOrder = [
  { name: 'Ascending', value: 'asc' },
  { name: 'Descending', value: 'desc' },
];

export const getBucketList = (buckets: Array<Bucket>) => {
  let bucketList: Array<Bucket> = [...tiers];
  buckets.forEach((el) => {
    bucketList = bucketList.map((tier) => {
      if (tier.key === el.key) {
        return el;
      } else {
        return tier;
      }
    });
  });

  return bucketList ?? [];
};

/**
 *
 * @param urlSearchQuery filter query params
 * @returns
 */
export const getInitialFilter = (urlSearchQuery = ''): string => {
  let initFilter = '';
  const urlSearchParams = new URLSearchParams(urlSearchQuery);

  // Loop over to get all params to get initial filters
  for (const [key, value] of urlSearchParams.entries()) {
    if (key === initialFilterQS) {
      initFilter = decodeURIComponent(value);

      break;
    }
  }

  return initFilter;
};

/**
 *
 * @param urlSearchQuery filter query params
 * @returns
 */
export const getSearchFilter = (urlSearchQuery = ''): string => {
  let srchFilter = '';
  const urlSearchParams = new URLSearchParams(urlSearchQuery);

  // Loop over to get all params to get searched filters
  for (const [key, value] of urlSearchParams.entries()) {
    if (key === searchFilterQS) {
      srchFilter = decodeURIComponent(value);

      break;
    }
  }

  return srchFilter;
};

export const getQueryParam = (urlSearchQuery = ''): FilterObject => {
  const arrSearchQuery = urlSearchQuery
    ? urlSearchQuery.startsWith('?')
      ? urlSearchQuery.substring(1).split('&')
      : urlSearchQuery.split('&')
    : [];

  return arrSearchQuery
    .map((filter) => {
      const arrFilter = filter.split('=');

      return {
        [getFilterKey(arrFilter[0])]: [arrFilter[1]]
          .map((r) => r.split(','))
          .flat(1),
      };
    })
    .reduce((prev, curr) => {
      return Object.assign(prev, curr);
    }, {}) as FilterObject;
};

export const getAggrWithDefaultValue = (
  aggregations: Array<AggregationType>,
  visibleAgg: Array<string> = []
): Array<AggregationType> => {
  const aggregation = aggregations.find(
    (aggregation) => aggregation.title === 'Tier'
  );

  const allowedAgg = visibleAgg.map((item) => toLower(item));

  if (aggregation) {
    const index = aggregations.indexOf(aggregation);
    aggregations[index].buckets = getBucketList(aggregations[index].buckets);
  }

  const visibleAggregations = !allowedAgg.length
    ? aggregations
    : aggregations.filter((item) => allowedAgg.includes(toLower(item.title)));

  const sortedAgg = allowedAgg
    .map((agg) => {
      const aggregation = visibleAggregations.find(
        (a) => toLower(a.title) === agg
      );

      return aggregation;
    })
    .filter(Boolean)
    .sort((aggA, aggB) => {
      if (
        FACET_FILTER_SORTING_ORDER.indexOf(aggA?.title as string) >
        FACET_FILTER_SORTING_ORDER.indexOf(aggB?.title as string)
      ) {
        return 1;
      } else {
        return -1;
      }
    });

  return sortedAgg as Array<AggregationType>;
};

export const getCurrentIndex = (tab: string) => {
  let currentIndex = SearchIndex.TABLE;
  switch (tab) {
    case 'topics':
      currentIndex = SearchIndex.TOPIC;

      break;
    case 'dashboards':
      currentIndex = SearchIndex.DASHBOARD;

      break;
    case 'pipelines':
      currentIndex = SearchIndex.PIPELINE;

      break;
    case 'mlmodels':
      currentIndex = SearchIndex.MLMODEL;

      break;
    case 'tables':
    default:
      currentIndex = SearchIndex.TABLE;

      break;
  }

  return currentIndex;
};

export const getCurrentTab = (tab: string) => {
  let currentTab = 1;
  switch (tab) {
    case 'topics':
      currentTab = 2;

      break;
    case 'dashboards':
      currentTab = 3;

      break;
    case 'pipelines':
      currentTab = 4;

      break;
    case 'mlmodels':
      currentTab = 5;

      break;

    case 'tables':
    default:
      currentTab = 1;

      break;
  }

  return currentTab;
};

export const tabsInfo = [
  {
    label: 'Tables',
    index: SearchIndex.TABLE,
    sortingFields: tableSortingFields,
    sortField: INITIAL_SORT_FIELD,
    tab: 1,
    path: 'tables',
    icon: Icons.TABLE_GREY,
    selectedIcon: Icons.TABLE,
  },
  {
    label: 'Topics',
    index: SearchIndex.TOPIC,
    sortingFields: entitySortingFields,
    sortField: INITIAL_SORT_FIELD,
    tab: 2,
    path: 'topics',
    icon: Icons.TOPIC_GREY,
    selectedIcon: Icons.TOPIC,
  },
  {
    label: 'Dashboards',
    index: SearchIndex.DASHBOARD,
    sortingFields: entitySortingFields,
    sortField: INITIAL_SORT_FIELD,
    tab: 3,
    path: 'dashboards',
    icon: Icons.DASHBOARD_GREY,
    selectedIcon: Icons.DASHBOARD,
  },
  {
    label: 'Pipelines',
    index: SearchIndex.PIPELINE,
    sortingFields: entitySortingFields,
    sortField: INITIAL_SORT_FIELD,
    tab: 4,
    path: 'pipelines',
    icon: Icons.PIPELINE_GREY,
    selectedIcon: Icons.PIPELINE,
  },
  {
    label: 'ML Models',
    index: SearchIndex.MLMODEL,
    sortingFields: entitySortingFields,
    sortField: INITIAL_SORT_FIELD,
    tab: 5,
    path: 'mlmodels',
    icon: '',
    selectedIcon: '',
  },
];
