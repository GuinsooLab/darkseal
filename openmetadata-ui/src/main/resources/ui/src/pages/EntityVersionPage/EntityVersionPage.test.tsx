/*
 *  Copyright 2022 Collate.
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

import { act, findByText, render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import EntityVersionPage from './EntityVersionPage.component';

let mockParams = {
  entityType: 'table',
  version: '0.1',
  entityFQN: 'bigquery_gcp.shopify.raw_product_catalog',
};

jest.mock('react-router-dom', () => ({
  useHistory: jest.fn(),
  useParams: jest.fn().mockImplementation(() => mockParams),
}));

jest.mock('components/DatasetVersion/DatasetVersion.component', () => {
  return jest.fn().mockReturnValue(<div>DatasetVersion component</div>);
});
jest.mock('components/DashboardVersion/DashboardVersion.component', () => {
  return jest.fn().mockReturnValue(<div>DashboardVersion component</div>);
});
jest.mock('components/PipelineVersion/PipelineVersion.component', () => {
  return jest.fn().mockReturnValue(<div>PipelineVersion component</div>);
});
jest.mock('components/TopicVersion/TopicVersion.component', () => {
  return jest.fn().mockReturnValue(<div>TopicVersion component</div>);
});
jest.mock('components/MlModelVersion/MlModelVersion.component', () => {
  return jest.fn().mockReturnValue(<div>MlModelVersion component</div>);
});

jest.mock('rest/dashboardAPI', () => ({
  getDashboardByFqn: jest.fn().mockImplementation(() => Promise.resolve()),
  getDashboardVersion: jest.fn().mockImplementation(() => Promise.resolve()),
  getDashboardVersions: jest.fn().mockImplementation(() => Promise.resolve()),
}));
jest.mock('rest/pipelineAPI', () => ({
  getPipelineByFqn: jest.fn().mockImplementation(() => Promise.resolve()),
  getPipelineVersion: jest.fn().mockImplementation(() => Promise.resolve()),
  getPipelineVersions: jest.fn().mockImplementation(() => Promise.resolve()),
}));
jest.mock('rest/tableAPI', () => ({
  getTableDetailsByFQN: jest.fn().mockImplementation(() => Promise.resolve()),
  getTableVersion: jest.fn().mockImplementation(() => Promise.resolve()),
  getTableVersions: jest.fn().mockImplementation(() => Promise.resolve()),
}));
jest.mock('rest/topicsAPI', () => ({
  getTopicByFqn: jest.fn().mockImplementation(() => Promise.resolve()),
  getTopicVersion: jest.fn().mockImplementation(() => Promise.resolve()),
  getTopicVersions: jest.fn().mockImplementation(() => Promise.resolve()),
}));

jest.mock('rest/mlModelAPI', () => ({
  getMlModelByFQN: jest.fn().mockImplementation(() => Promise.resolve()),
  getMlModelVersion: jest.fn().mockImplementation(() => Promise.resolve()),
  getMlModelVersions: jest.fn().mockImplementation(() => Promise.resolve()),
}));

describe('Test EntityVersionPage component', () => {
  it('Checks if the DatasetVersion component renderst if respective data pass', async () => {
    await act(async () => {
      render(<EntityVersionPage />, {
        wrapper: MemoryRouter,
      });
      const datasetVersion = await screen.findByText(
        /DatasetVersion component/i
      );

      expect(datasetVersion).toBeInTheDocument();
    });
  });

  it('Checks if the DashboardVersion component render if respective data pass', async () => {
    mockParams = {
      entityType: 'dashboard',
      version: '0.2',
      entityFQN: 'sample_superset.forecast_sales_performance',
    };

    await act(async () => {
      const { container } = render(<EntityVersionPage />, {
        wrapper: MemoryRouter,
      });

      const DashboardVersion = await findByText(
        container,
        /DashboardVersion component/i
      );

      expect(DashboardVersion).toBeInTheDocument();
    });
  });

  it('Checks if the PipelineVersion component render if respective data pass', async () => {
    mockParams = {
      entityType: 'pipeline',
      version: '0.1',
      entityFQN: 'sample_airflow.snowflake_etl',
    };

    await act(async () => {
      const { container } = render(<EntityVersionPage />, {
        wrapper: MemoryRouter,
      });

      const PipelineVersion = await findByText(
        container,
        /PipelineVersion component/i
      );

      expect(PipelineVersion).toBeInTheDocument();
    });
  });

  it('Checks if the TopicVersion component render if respective data pass', async () => {
    mockParams = {
      entityType: 'topic',
      version: '0.1',
      entityFQN: 'sample_kafka.sales',
    };

    await act(async () => {
      const { container } = render(<EntityVersionPage />, {
        wrapper: MemoryRouter,
      });

      const TopicVersion = await findByText(
        container,
        /TopicVersion component/i
      );

      expect(TopicVersion).toBeInTheDocument();
    });
  });
});
