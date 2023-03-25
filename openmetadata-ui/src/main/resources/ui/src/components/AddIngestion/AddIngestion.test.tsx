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

import { findByTestId, findByText, render } from '@testing-library/react';
import React from 'react';
import { FormSubmitType } from '../../enums/form.enum';
import { ServiceCategory } from '../../enums/service.enum';
import { PipelineType } from '../../generated/entity/services/ingestionPipelines/ingestionPipeline';
import { DataObj } from '../../interface/service.interface';
import AddIngestion from './AddIngestion.component';
import { AddIngestionProps } from './addIngestion.interface';

const mockAddIngestionProps: AddIngestionProps = {
  activeIngestionStep: 1,
  setActiveIngestionStep: jest.fn(),
  serviceData: {
    name: 'serviceName',
  } as DataObj,
  handleCancelClick: jest.fn(),
  serviceCategory: ServiceCategory.DASHBOARD_SERVICES,
  onAddIngestionSave: jest.fn(),
  handleViewServiceClick: jest.fn(),
  pipelineType: PipelineType.Metadata,
  heading: 'add ingestion',
  status: FormSubmitType.ADD,
};

jest.mock('./Steps/ConfigureIngestion', () => {
  return jest
    .fn()
    .mockImplementation(({ onNext }) => (
      <div onClick={onNext}>ConfigureIngestion.component</div>
    ));
});

jest.mock('@rjsf/core', () => ({
  Form: jest.fn().mockImplementation(() => <div>RJSF_Form.component</div>),
}));

jest.mock('../common/DBTConfigFormBuilder/DBTConfigFormBuilder', () => {
  return jest
    .fn()
    .mockImplementation(() => <div>DBTConfigFormBuilder.component</div>);
});

jest.mock('../IngestionStepper/IngestionStepper.component', () => {
  return jest.fn().mockImplementation(() => <div>IngestionStepper</div>);
});

describe('Test AddIngestion component', () => {
  it('AddIngestion component should render', async () => {
    const { container } = render(<AddIngestion {...mockAddIngestionProps} />);

    const addIngestionContainer = await findByTestId(
      container,
      'add-ingestion-container'
    );
    const configureIngestion = await findByText(
      container,
      'ConfigureIngestion.component'
    );

    expect(addIngestionContainer).toBeInTheDocument();
    expect(configureIngestion).toBeInTheDocument();
  });

  it('should render DBT Config step for database services', async () => {
    const { container } = render(
      <AddIngestion
        {...mockAddIngestionProps}
        activeIngestionStep={2}
        pipelineType={PipelineType.Metadata}
        serviceCategory={ServiceCategory.DASHBOARD_SERVICES}
      />
    );

    const dbtConfigFormBuilder = await findByText(
      container,
      'DBTConfigFormBuilder.component'
    );

    expect(dbtConfigFormBuilder).toBeInTheDocument();
  });
});
