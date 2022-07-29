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

import {
  findAllByTestId,
  findByTestId,
  findByText,
  queryByText,
  render,
} from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { act } from 'react-test-renderer';
import ServicePage from './index';

jest.mock('../../authentication/auth-provider/AuthProvider', () => {
  return {
    useAuthContext: jest.fn(() => ({
      isAuthDisabled: true,
      isAuthenticated: true,
      isProtectedRoute: jest.fn().mockReturnValue(true),
      isTourRoute: jest.fn().mockReturnValue(false),
      onLogoutHandler: jest.fn(),
    })),
  };
});

const mockData = {
  description: '',
  href: 'link',
  id: 'd3b225a2-e4a2-4f4e-834e-b1c03112f139',
  jdbc: {
    connectionUrl:
      'postgresql+psycopg2://awsuser:focguC-kaqqe5-nepsok@redshift-cluster-1.clot5cqn1cnb.us-west-2.redshift.amazonaws.com:5439/warehouse',
    driverClass: 'jdbc',
  },
  name: 'aws_redshift',
  serviceType: 'Redshift',
  connection: {
    config: {
      username: 'test_user',
      password: 'test_pass',
    },
  },
};

const mockDatabase = {
  data: [
    {
      description: ' ',
      fullyQualifiedName: 'aws_redshift.information_schema',
      href: 'http://localhost:8585/api/v1/databases/c86f4fed-f259-43d8-b031-1ce0b7dd4e41',
      id: 'c86f4fed-f259-43d8-b031-1ce0b7dd4e41',
      name: 'information_schema',
      service: {
        description: '',
        href: 'http://localhost:8585/api/v1/services/databaseServices/d3b225a2-e4a2-4f4e-834e-b1c03112f139',
        id: 'd3b225a2-e4a2-4f4e-834e-b1c03112f139',
        name: 'aws_redshift',
        type: 'databaseService',
      },
      usageSummary: {
        date: '2021-08-04',
        dailyStats: { count: 0, percentileRank: 0 },
        monthlyStats: { count: 0, percentileRank: 0 },
        weeklyStats: { count: 0, percentileRank: 0 },
      },
    },
  ],
  paging: {
    after: null,
    before: null,
  },
};

jest.mock('../../axiosAPIs/ingestionPipelineAPI', () => ({
  getIngestionPipelines: jest.fn().mockImplementation(() =>
    Promise.resolve({
      data: {
        data: [],
        paging: { total: 0 },
      },
    })
  ),
  deleteIngestionPipelineById: jest.fn(),
  addIngestionPipeline: jest.fn(),
  triggerIngestionPipelineById: jest.fn(),
  updateIngestionPipeline: jest.fn(),
}));

jest.mock('../../axiosAPIs/serviceAPI', () => ({
  getServiceByFQN: jest
    .fn()
    .mockImplementation(() => Promise.resolve({ data: mockData })),
  updateService: jest.fn(),
}));

jest.mock('../../axiosAPIs/databaseAPI', () => ({
  getDatabases: jest
    .fn()
    .mockImplementation(() => Promise.resolve({ data: mockDatabase })),
  updateService: jest.fn(),
}));

jest.mock(
  '../../components/common/rich-text-editor/RichTextEditorPreviewer',
  () => {
    return jest.fn().mockReturnValue(<p>RichTextEditorPreviewer</p>);
  }
);

jest.mock('react-router-dom', () => ({
  Link: jest
    .fn()
    .mockImplementation(({ children }: { children: React.ReactNode }) => (
      <span>{children}</span>
    )),
  useHistory: jest.fn(),
  useParams: jest.fn().mockReturnValue({
    serviceFQN: 'bigquery_gcp',
    serviceType: 'BigQuery',
    serviceCategory: 'databaseServices',
    tab: 'databases',
  }),
}));

jest.mock('../../components/containers/PageContainer', () => {
  return jest
    .fn()
    .mockImplementation(({ children }: { children: React.ReactNode }) => (
      <div data-testid="PageContainer">{children}</div>
    ));
});

jest.mock('../../utils/ServiceUtils', () => ({
  getCurrentServiceTab: jest.fn().mockReturnValue(1),
  getIsIngestionEnable: jest.fn().mockReturnValue(true),
  servicePageTabs: jest.fn().mockReturnValue([
    {
      name: 'Databases',
      path: 'databases',
      field: 'databases',
    },
  ]),
  getServiceCategoryFromType: jest.fn().mockReturnValue('databaseServices'),
  serviceTypeLogo: jest.fn().mockReturnValue('img/path'),
  isRequiredDetailsAvailableForIngestion: jest.fn().mockReturnValue(true),
}));

jest.mock(
  '../../components/common/title-breadcrumb/title-breadcrumb.component',
  () => {
    return jest.fn().mockReturnValue(<div>TitleBreadcrumb</div>);
  }
);

jest.mock('../../components/common/description/Description', () => {
  return jest.fn().mockReturnValue(<div>Description_component</div>);
});

jest.mock('../../components/common/TabsPane/TabsPane', () => {
  return jest.fn().mockReturnValue(<div>TabsPane_component</div>);
});

jest.mock(
  '../../components/Modals/ModalWithMarkdownEditor/ModalWithMarkdownEditor',
  () => ({
    ModalWithMarkdownEditor: jest
      .fn()
      .mockReturnValue(<p>ModalWithMarkdownEditor</p>),
  })
);

jest.mock('../../components/ServiceConfig/ServiceConfig', () => {
  return jest.fn().mockReturnValue(<p>ServiceConfig</p>);
});

describe('Test ServicePage Component', () => {
  it('Component should render', async () => {
    const { container } = render(<ServicePage />, {
      wrapper: MemoryRouter,
    });

    await act(async () => {
      const servicePage = await findByTestId(container, 'service-page');
      const titleBreadcrumb = await findByText(container, /TitleBreadcrumb/i);
      const descriptionContainer = await findByTestId(
        container,
        'description-container'
      );
      const description = await findByText(container, /Description_component/i);
      const tabPane = await findByText(container, /TabsPane_component/i);

      expect(servicePage).toBeInTheDocument();
      expect(titleBreadcrumb).toBeInTheDocument();
      expect(descriptionContainer).toBeInTheDocument();
      expect(description).toBeInTheDocument();
      expect(tabPane).toBeInTheDocument();
    });
  });

  it('Table should be visible if data is available', async () => {
    const { container } = render(<ServicePage />, {
      wrapper: MemoryRouter,
    });
    const tableContainer = await findByTestId(container, 'table-container');

    expect(tableContainer).toBeInTheDocument();
    expect(
      queryByText(container, /does not have any databases/i)
    ).not.toBeInTheDocument();
  });

  it('Number of column should be same as data received', async () => {
    const { container } = render(<ServicePage />, {
      wrapper: MemoryRouter,
    });
    const column = await findAllByTestId(container, 'column');

    expect(column.length).toBe(1);
  });
});
