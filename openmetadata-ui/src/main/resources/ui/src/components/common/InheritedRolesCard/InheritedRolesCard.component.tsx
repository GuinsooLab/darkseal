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

import { Card, Typography } from 'antd';
import { isEmpty } from 'lodash';
import React, { Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import { getEntityName } from 'utils/EntityUtils';
import SVGIcons, { Icons } from '../../../utils/SvgUtils';
import { InheritedRolesCardProps } from './InheritedRolesCard.interface';
import './InheritedRolesCard.style.less';

const InheritedRolesCard = ({ userData }: InheritedRolesCardProps) => {
  const { t } = useTranslation();

  return (
    <Card
      className="relative page-layout-v1-left-panel"
      key="inherited-roles-card-component"
      title={
        <div className="flex">
          <h6 className="heading mb-0" data-testid="inherited-roles-heading">
            {t('label.inherited-role-plural')}
          </h6>
        </div>
      }>
      <Fragment>
        {isEmpty(userData.inheritedRoles) ? (
          <div className="mb-4">
            <span className="inherited-no-description">
              {t('message.no-inherited-roles-found')}
            </span>
          </div>
        ) : (
          <div className="d-flex justify-between flex-col">
            {userData.inheritedRoles?.map((inheritedRole, i) => (
              <div className="mb-2 d-flex items-center gap-2" key={i}>
                <SVGIcons alt="icon" className="w-4" icon={Icons.USERS} />

                <Typography.Text
                  className="ant-typography-ellipsis-custom w-48"
                  ellipsis={{ tooltip: true }}>
                  {getEntityName(inheritedRole)}
                </Typography.Text>
              </div>
            ))}
          </div>
        )}
      </Fragment>
    </Card>
  );
};

export default InheritedRolesCard;
