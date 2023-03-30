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

import { Button as ButtonAntd, Card, Col, Row, Space, Tooltip } from 'antd';
import { isEmpty } from 'lodash';
import React, { Fragment, useCallback, useMemo } from 'react';
import { Link, useHistory } from 'react-router-dom';
import {
  getServiceDetailsPath,
  SERVICE_VIEW_CAP,
} from '../../constants/constants';
import { CONNECTORS_DOCS } from '../../constants/docs.constants';
import { NO_PERMISSION_FOR_ACTION } from '../../constants/HelperTextUtil';
import { PAGE_HEADERS } from '../../constants/PageHeaders.constant';
import { servicesDisplayName } from '../../constants/Services.constant';
import { ServiceCategory } from '../../enums/service.enum';
import { Operation } from '../../generated/entity/policies/policy';
import { Paging } from '../../generated/type/paging';
import { ServicesType } from '../../interface/service.interface';
import {
  getEntityName,
  getServiceLogo,
  showPagination,
} from '../../utils/CommonUtils';
import { checkPermission } from '../../utils/PermissionsUtils';
import { getAddServicePath } from '../../utils/RouterUtils';
import {
  getOptionalFields,
  getResourceEntityFromServiceCategory,
} from '../../utils/ServiceUtils';
import { useAuthContext } from '../authentication/auth-provider/AuthProvider';
import { Button } from '../buttons/Button/Button';
import ErrorPlaceHolder from '../common/error-with-placeholder/ErrorPlaceHolder';
import NextPrevious from '../common/next-previous/NextPrevious';
import RichTextEditorPreviewer from '../common/rich-text-editor/RichTextEditorPreviewer';
import { leftPanelAntCardStyle } from '../containers/PageLayout';
import PageHeader from '../header/PageHeader.component';
import { usePermissionProvider } from '../PermissionProvider/PermissionProvider';

interface ServicesProps {
  serviceData: ServicesType[];
  serviceName: ServiceCategory;
  paging: Paging;
  currentPage: number;
  onPageChange: (cursorType: string | number, activePage?: number) => void;
}

const Services = ({
  serviceData,
  serviceName,
  paging,
  currentPage,
  onPageChange,
}: ServicesProps) => {
  const { isAuthDisabled } = useAuthContext();
  const history = useHistory();
  const handleAddServiceClick = () => {
    history.push(getAddServicePath(serviceName));
  };

  const { permissions } = usePermissionProvider();

  const addServicePermission = useMemo(
    () =>
      !isEmpty(permissions) &&
      checkPermission(
        Operation.Create,
        getResourceEntityFromServiceCategory(serviceName),
        permissions
      ),
    [permissions, serviceName]
  );

  const getServicePageHeader = useCallback(() => {
    switch (serviceName) {
      case ServiceCategory.DATABASE_SERVICES:
        return PAGE_HEADERS.DATABASES_SERVICES;
      case ServiceCategory.DASHBOARD_SERVICES:
        return PAGE_HEADERS.DASHBOARD_SERVICES;
      case ServiceCategory.MESSAGING_SERVICES:
        return PAGE_HEADERS.MESSAGING_SERVICES;
      case ServiceCategory.METADATA_SERVICES:
        return PAGE_HEADERS.METADATA_SERVICES;
      case ServiceCategory.ML_MODEL_SERVICES:
        return PAGE_HEADERS.ML_MODELS_SERVICES;
      case ServiceCategory.PIPELINE_SERVICES:
        return PAGE_HEADERS.PIPELINES_SERVICES;
      default:
        return PAGE_HEADERS.DATABASES_SERVICES;
    }
  }, [serviceName]);

  return (
    <Row className="tw-justify-center" data-testid="services-container">
      {serviceData.length ? (
        <Fragment>
          <Col span={24}>
            <Space
              className="w-full justify-between m-b-lg"
              data-testid="header">
              <PageHeader data={getServicePageHeader()} />
              <Tooltip
                placement="left"
                title={
                  addServicePermission
                    ? 'Add Service'
                    : NO_PERMISSION_FOR_ACTION
                }>
                <Button
                  className="tw-h-8 tw-rounded tw-mb-2"
                  data-testid="add-service-button"
                  disabled={!addServicePermission && !isAuthDisabled}
                  size="small"
                  theme="primary"
                  variant="contained"
                  onClick={handleAddServiceClick}>
                  Add New Service
                </Button>
              </Tooltip>
            </Space>
          </Col>
          <Col span={24}>
            <Row data-testid="data-container" gutter={[16, 16]}>
              {serviceData.map((service, index) => (
                <Col key={index} lg={8} xl={6}>
                  <Card
                    size="small"
                    style={{ ...leftPanelAntCardStyle, height: '100%' }}>
                    <div
                      className="tw-flex tw-justify-between tw-text-grey-muted"
                      data-testid="service-card">
                      <div className="tw-flex tw-flex-col tw-justify-between tw-truncate">
                        <div>
                          <Link
                            to={getServiceDetailsPath(
                              service.name,
                              serviceName
                            )}>
                            <button>
                              <h6
                                className="tw-text-base tw-text-grey-body tw-font-medium tw-text-left tw-truncate tw-w-48"
                                data-testid={`service-name-${getEntityName(
                                  service
                                )}`}
                                title={getEntityName(service)}>
                                {getEntityName(service)}
                              </h6>
                            </button>
                          </Link>
                          <div
                            className="tw-text-grey-body tw-pb-1 tw-break-all description-text"
                            data-testid="service-description">
                            {service.description ? (
                              <RichTextEditorPreviewer
                                enableSeeMoreVariant={false}
                                markdown={service.description}
                              />
                            ) : (
                              <span className="tw-no-description">
                                No description
                              </span>
                            )}
                          </div>
                          {getOptionalFields(service, serviceName)}
                        </div>
                        <div className="" data-testid="service-type">
                          <label className="tw-mb-0">Type:</label>
                          <span className=" tw-ml-1 tw-font-normal tw-text-grey-body">
                            {service.serviceType}
                          </span>
                        </div>
                      </div>
                      <div className="tw-flex tw-flex-col tw-justify-between tw-flex-none">
                        <div
                          className="tw-flex tw-justify-end"
                          data-testid="service-icon">
                          {getServiceLogo(service.serviceType || '', 'h-7')}
                        </div>
                      </div>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          </Col>

          {showPagination(paging) && (
            <NextPrevious
              currentPage={currentPage}
              pageSize={SERVICE_VIEW_CAP}
              paging={paging}
              pagingHandler={onPageChange}
              totalCount={paging.total}
            />
          )}
        </Fragment>
      ) : (
        <Col span={24}>
          <ErrorPlaceHolder
            buttons={
              <Tooltip
                placement="left"
                title={
                  addServicePermission
                    ? 'Add Service'
                    : NO_PERMISSION_FOR_ACTION
                }>
                <ButtonAntd
                  ghost
                  data-testid="add-service-button"
                  disabled={!addServicePermission}
                  size="small"
                  type="primary"
                  onClick={handleAddServiceClick}>
                  Add new {servicesDisplayName[serviceName]}
                </ButtonAntd>
              </Tooltip>
            }
            doc={CONNECTORS_DOCS}
            heading={servicesDisplayName[serviceName]}
            type="ADD_DATA"
          />
        </Col>
      )}
    </Row>
  );
};

export default Services;
