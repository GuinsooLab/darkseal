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

import { Col, Divider, Row, Space, Typography } from 'antd';
import { AxiosError } from 'axios';
import { ChartType } from 'pages/DashboardDetailsPage/DashboardDetailsPage.component';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { SummaryEntityType } from '../../../../enums/EntitySummary.enum';
import { SearchIndex } from '../../../../enums/search.enum';
import { Dashboard } from '../../../../generated/entity/data/dashboard';
import { fetchCharts } from '../../../../utils/DashboardDetailsUtils';
import { getFormattedEntityData } from '../../../../utils/EntitySummaryPanelUtils';
import SVGIcons from '../../../../utils/SvgUtils';
import { showErrorToast } from '../../../../utils/ToastUtils';
import TableDataCardTitle from '../../../common/table-data-card-v2/TableDataCardTitle.component';
import SummaryList from '../SummaryList/SummaryList.component';
import { BasicEntityInfo } from '../SummaryList/SummaryList.interface';

interface DashboardSummaryProps {
  entityDetails: Dashboard;
}

function DashboardSummary({ entityDetails }: DashboardSummaryProps) {
  const { t } = useTranslation();
  const [charts, setCharts] = useState<ChartType[]>();

  const fetchChartsDetails = async () => {
    try {
      const chartDetails = await fetchCharts(entityDetails.charts);

      const updatedCharts = chartDetails.map((chartItem) => ({
        ...chartItem,
        chartUrl: chartItem.chartUrl,
      }));

      setCharts(updatedCharts);
    } catch (err) {
      showErrorToast(
        err as AxiosError,
        t('server.entity-fetch-error', {
          entity: t('label.dashboard-detail-plural-lowercase'),
        })
      );
    }
  };

  useEffect(() => {
    fetchChartsDetails();
  }, [entityDetails]);

  const formattedChartsData: BasicEntityInfo[] = useMemo(
    () => getFormattedEntityData(SummaryEntityType.CHART, charts),
    [charts]
  );

  return (
    <>
      <Row className="m-md" gutter={[0, 4]}>
        <Col span={24}>
          <TableDataCardTitle
            dataTestId="summary-panel-title"
            searchIndex={SearchIndex.DASHBOARD}
            source={entityDetails}
          />
        </Col>
        <Col span={24}>
          <Row gutter={16}>
            <Col
              className="text-gray"
              data-testid="dashboard-url-label"
              span={10}>
              {`${t('label.dashboard')} ${t('label.url-uppercase')}`}
            </Col>
            <Col data-testid="dashboard-url-value" span={12}>
              {entityDetails.dashboardUrl ? (
                <Link
                  target="_blank"
                  to={{ pathname: entityDetails.dashboardUrl }}>
                  <Space align="start">
                    <Typography.Text
                      className="link"
                      data-testid="dashboard-link-name">
                      {entityDetails.name}
                    </Typography.Text>
                    <SVGIcons
                      alt="external-link"
                      icon="external-link"
                      width="12px"
                    />
                  </Space>
                </Link>
              ) : (
                '-'
              )}
            </Col>
          </Row>
        </Col>
      </Row>
      <Divider className="m-0" />
      <Row className="m-md" gutter={[0, 16]}>
        <Col span={24}>
          <Typography.Text
            className="section-header"
            data-testid="charts-header">
            {t('label.chart-plural')}
          </Typography.Text>
        </Col>
        <Col span={24}>
          <SummaryList formattedEntityData={formattedChartsData} />
        </Col>
      </Row>
    </>
  );
}

export default DashboardSummary;
