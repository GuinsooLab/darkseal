/*
 *  Copyright 2023 Collate.
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

import { EntityReference } from '../../../generated/type/entityReference';

export const mockData = {
  data: {
    took: 50,
    timed_out: false,
    _shards: {
      total: 1,
      successful: 1,
      skipped: 0,
      failed: 0,
    },
    hits: {
      total: {
        value: 12,
        relation: 'eq',
      },
      max_score: 5,
      hits: [
        {
          _index: 'table_search_indexcb2cac4c-735e-474e-a968-da8d8e0b218c',
          _type: '_doc',
          _id: '53761de6-6c41-431f-9c4e-62d39cf4aba9',
          _score: 5,
          _source: {
            table_id: '53761de6-6c41-431f-9c4e-62d39cf4aba9',
            database: 'shopify',
            service: 'bigquery',
            service_type: 'BigQuery',
            table_name: 'dim_address',
            suggest: [
              {
                input: ['bigquery.shopify.dim_address'],
                weight: 5,
              },
              {
                input: ['dim_address'],
                weight: 10,
              },
            ],
            description: 'test description',
            table_type: null,
            last_updated_timestamp: 1628498201,
            column_names: ['address_id', 'shop_id'],
            column_descriptions: [
              'Unique identifier for the address.',
              'The ID of the store. This column is a foreign key reference to the shop_id column in the shops table.',
            ],
            monthly_stats: 0,
            weekly_stats: 0,
            daily_stats: 0,
            tags: ['User.Phone'],
            fqdn: 'bigquery.shopify.dim_address',
            tier: null,
            schema_description: null,
            owner: '',
            followers: [],
            table_entity: {
              id: '53761de6-6c41-431f-9c4e-62d39cf4aba9',
              name: 'dim_address',
              description: 'test table description',
              href: 'http://test',
              tableType: null,
              fullyQualifiedName: 'bigquery.shopify.dim_address',
              columns: [
                {
                  name: 'address_id',
                  columnDataType: 'NUMERIC',
                  description: 'Unique identifier for the address.',
                  fullyQualifiedName: 'bigquery.shopify.dim_address.address_id',
                  tags: [
                    {
                      tagFQN: 'PersonalData.Personal',
                      labelType: 'Derived',
                      state: 'Suggested',
                      href: null,
                    },
                    {
                      tagFQN: 'PII.Sensitive',
                      labelType: 'Derived',
                      state: 'Suggested',
                      href: null,
                    },
                    {
                      tagFQN: 'User.Address',
                      labelType: 'Automated',
                      state: 'Suggested',
                      href: null,
                    },
                  ],
                  columnConstraint: 'PRIMARY_KEY',
                  ordinalPosition: 1,
                },
              ],
              tableConstraints: null,
              usageSummary: {
                dailyStats: {
                  count: 0,
                  percentileRank: 0,
                },
                weeklyStats: {
                  count: 0,
                  percentileRank: 0,
                },
                monthlyStats: {
                  count: 0,
                  percentileRank: 0,
                },
                date: '2021-08-09',
              },
              owner: null,
              followers: [],
              database: {
                id: '2d04ddc1-4c9b-43a3-85fb-3de204d67f32',
                type: 'database',
                name: 'shopify',
                description:
                  'This database contains tables related to shopify order and related dimensions',
                href: 'http://test/test',
              },
              tags: [],
              joins: null,
              sampleData: null,
            },
          },
          highlight: {
            description: ['data test'],
            table_name: ['<b>dim_address</b>'],
          },
        },
      ],
    },
    aggregations: {
      'sterms#Tier': {
        doc_count_error_upper_bound: 0,
        sum_other_doc_count: 0,
        buckets: [],
      },
      'sterms#Tags': {
        doc_count_error_upper_bound: 0,
        sum_other_doc_count: 0,
        buckets: [
          {
            key: 'PII.Sensitive',
            doc_count: 7,
          },
        ],
      },
      'sterms#Service Type': {
        doc_count_error_upper_bound: 0,
        sum_other_doc_count: 0,
        buckets: [
          {
            key: 'BigQuery',
            doc_count: 12,
          },
        ],
      },
    },
  },
};

export const currentUserMockData = [
  {
    id: '7b26a534-25e8-4112-ae08-ee059f8918c4',
    type: 'table',
    name: 'test_dim_staff',
    fullyQualifiedName: 'test_sample.test_db.test_dim_staff',
    description: 'test test_dim_staff',
    deleted: false,
    href: 'http://localhost:8585/api/v1/tables/7b26a534-25e8-4112-ae08-ee059f8918c4',
  },
] as EntityReference[];

export const mockPaging = {
  after: 'MTY0OTIzNTQ3MzExMg==',
  total: 202,
};
