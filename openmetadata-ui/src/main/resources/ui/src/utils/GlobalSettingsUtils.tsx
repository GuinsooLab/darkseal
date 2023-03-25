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

import { Badge } from 'antd';
import { ItemType } from 'antd/lib/menu/hooks/useItems';
import classNames from 'classnames';
import {
  ResourceEntity,
  UIPermission,
} from 'components/PermissionProvider/PermissionProvider.interface';
import i18next from 'i18next';
import { camelCase } from 'lodash';
import React, { ReactNode } from 'react';
import { ReactComponent as AdminIcon } from '../../src/assets/svg/admin.svg';
import { ReactComponent as AllActivityIcon } from '../../src/assets/svg/all-activity.svg';
import { ReactComponent as BotIcon } from '../../src/assets/svg/bot-profile.svg';
import { ReactComponent as DashboardIcon } from '../../src/assets/svg/dashboard-grey.svg';
import { ReactComponent as ElasticSearchIcon } from '../../src/assets/svg/elasticsearch.svg';
import { ReactComponent as BellIcon } from '../../src/assets/svg/ic-alert-bell.svg';
import { ReactComponent as ObjectStoreIcon } from '../../src/assets/svg/ic-object-store.svg';
import { ReactComponent as RolesIcon } from '../../src/assets/svg/icon-role-grey.svg';
import { ReactComponent as OMLogo } from '../../src/assets/svg/metadata.svg';
import { ReactComponent as MlModelIcon } from '../../src/assets/svg/mlmodal.svg';
import { ReactComponent as PipelineIcon } from '../../src/assets/svg/pipeline-grey.svg';
import { ReactComponent as PoliciesIcon } from '../../src/assets/svg/policies.svg';
import { ReactComponent as TableIcon } from '../../src/assets/svg/table-grey.svg';
import { ReactComponent as TeamsIcon } from '../../src/assets/svg/teams-grey.svg';
import { ReactComponent as TopicIcon } from '../../src/assets/svg/topic-grey.svg';
import { ReactComponent as UsersIcon } from '../../src/assets/svg/user.svg';
import { userPermissions } from '../utils/PermissionsUtils';

export interface MenuListItem {
  label: string;
  isProtected: boolean;
  icon: ReactNode;
}
export interface MenuList {
  category: string;
  items: MenuListItem[];
  isBeta?: boolean;
}

export const getGlobalSettingsMenuWithPermission = (
  permissions: UIPermission,
  isAdminUser: boolean | undefined
) => {
  return [
    {
      category: i18next.t('label.member-plural'),
      items: [
        {
          label: i18next.t('label.team-plural'),
          isProtected: userPermissions.hasViewPermissions(
            ResourceEntity.TEAM,
            permissions
          ),

          icon: <TeamsIcon className="side-panel-icons" />,
        },
        {
          label: i18next.t('label.user-plural'),
          isProtected: userPermissions.hasViewPermissions(
            ResourceEntity.USER,
            permissions
          ),
          icon: <UsersIcon className="side-panel-icons" />,
        },
        {
          label: i18next.t('label.admin-plural'),
          isProtected: userPermissions.hasViewPermissions(
            ResourceEntity.USER,
            permissions
          ),
          icon: <AdminIcon className="side-panel-icons" />,
        },
      ],
    },
    {
      category: i18next.t('label.access'),
      items: [
        {
          label: i18next.t('label.role-plural'),
          isProtected: userPermissions.hasViewPermissions(
            ResourceEntity.ROLE,
            permissions
          ),
          icon: <RolesIcon className="side-panel-icons" />,
        },
        {
          label: i18next.t('label.policy-plural'),
          isProtected: userPermissions.hasViewPermissions(
            ResourceEntity.POLICY,
            permissions
          ),
          icon: <PoliciesIcon className="side-panel-icons" />,
        },
      ],
    },
    {
      category: i18next.t('label.service-plural'),
      items: [
        {
          label: i18next.t('label.database-plural'),
          isProtected: userPermissions.hasViewPermissions(
            ResourceEntity.DATABASE_SERVICE,
            permissions
          ),
          icon: <TableIcon className="side-panel-icons" />,
        },
        {
          label: i18next.t('label.messaging'),
          isProtected: userPermissions.hasViewPermissions(
            ResourceEntity.MESSAGING_SERVICE,
            permissions
          ),
          icon: <TopicIcon className="side-panel-icons" />,
        },
        {
          label: i18next.t('label.dashboard-plural'),
          isProtected: userPermissions.hasViewPermissions(
            ResourceEntity.DASHBOARD_SERVICE,
            permissions
          ),
          icon: <DashboardIcon className="side-panel-icons" />,
        },
        {
          label: i18next.t('label.pipeline-plural'),
          isProtected: userPermissions.hasViewPermissions(
            ResourceEntity.PIPELINE_SERVICE,
            permissions
          ),
          icon: <PipelineIcon className="side-panel-icons" />,
        },
        {
          label: i18next.t('label.ml-model-plural'),
          isProtected: userPermissions.hasViewPermissions(
            ResourceEntity.ML_MODEL_SERVICE,
            permissions
          ),
          icon: <MlModelIcon className="side-panel-icons" />,
        },
        {
          label: i18next.t('label.metadata'),
          isProtected: userPermissions.hasViewPermissions(
            ResourceEntity.METADATA_SERVICE,
            permissions
          ),
          icon: <OMLogo className="side-panel-icons w-4 h-4" />,
        },
        {
          label: i18next.t('label.object-store-plural'),
          isProtected: userPermissions.hasViewPermissions(
            ResourceEntity.OBJECT_STORE_SERVICE,
            permissions
          ),
          icon: <ObjectStoreIcon className="side-panel-icons w-4 h-4" />,
          isBeta: Boolean,
        },
      ],
    },
    {
      category: i18next.t('label.notification-plural'),
      isBeta: true,
      items: [
        {
          label: i18next.t('label.activity-feed-plural'),
          isProtected: Boolean(isAdminUser),
          icon: <AllActivityIcon className="side-panel-icons" />,
        },
        {
          label: i18next.t('label.alert-plural'),
          isProtected: Boolean(isAdminUser),
          icon: <BellIcon className="side-panel-icons" />,
        },
      ],
    },
    {
      category: i18next.t('label.custom-attribute-plural'),
      items: [
        {
          label: i18next.t('label.table-plural'),
          isProtected: userPermissions.hasViewPermissions(
            ResourceEntity.TYPE,
            permissions
          ),
          icon: <TableIcon className="side-panel-icons" />,
        },
        {
          label: i18next.t('label.topic-plural'),
          isProtected: userPermissions.hasViewPermissions(
            ResourceEntity.TYPE,
            permissions
          ),
          icon: <TopicIcon className="side-panel-icons" />,
        },
        {
          label: i18next.t('label.dashboard-plural'),
          isProtected: userPermissions.hasViewPermissions(
            ResourceEntity.TYPE,
            permissions
          ),
          icon: <DashboardIcon className="side-panel-icons" />,
        },
        {
          label: i18next.t('label.pipeline-plural'),
          isProtected: userPermissions.hasViewPermissions(
            ResourceEntity.TYPE,
            permissions
          ),
          icon: <PipelineIcon className="side-panel-icons" />,
        },
        {
          label: i18next.t('label.ml-model-plural'),
          isProtected: userPermissions.hasViewPermissions(
            ResourceEntity.TYPE,
            permissions
          ),
          icon: <MlModelIcon className="side-panel-icons" />,
        },
        {
          label: i18next.t('label.container-plural'),
          isProtected: userPermissions.hasViewPermissions(
            ResourceEntity.TYPE,
            permissions
          ),
          icon: <ObjectStoreIcon className="side-panel-icons" />,
        },
      ],
    },
    {
      category: i18next.t('label.event-publisher-plural'),
      items: [
        {
          label: i18next.t('label.elasticsearch'),
          isProtected: Boolean(isAdminUser),
          icon: (
            <ElasticSearchIcon className="tw-w-4 tw-mt-1.5 side-panel-icons" />
          ),
        },
      ],
    },
    {
      category: i18next.t('label.integration-plural'),
      items: [
        {
          label: i18next.t('label.bot-plural'),
          isProtected: userPermissions.hasViewPermissions(
            ResourceEntity.BOT,
            permissions
          ),
          icon: <BotIcon className="tw-w-4 side-panel-icons" />,
        },
      ],
    },
  ];
};

export const getGlobalSettingMenuItem = (args: {
  label: string;
  key: string;
  category?: string;
  icon?: React.ReactNode;
  children?: {
    label: string;
    isProtected: boolean;
    icon: React.ReactNode;
    isBeta?: boolean;
  }[];
  type?: string;
  isBeta?: boolean;
  isChildren?: boolean;
}): {
  key: string;
  icon: React.ReactNode;
  children: ItemType[] | undefined;
  label: ReactNode;
  type: string | undefined;
} => {
  const { children, label, key, icon, category, isBeta, type, isChildren } =
    args;

  const subItems = children
    ? children
        .filter((menu) => menu.isProtected)
        .map(({ label, icon, isBeta: isChildBeta }) => {
          return getGlobalSettingMenuItem({
            label,
            key: camelCase(label),
            category: key,
            icon,
            isBeta: isChildBeta,
            isChildren: true,
          });
        })
    : undefined;

  return {
    key: `${category}.${key}`,
    icon,
    children: subItems,
    label: isBeta ? (
      <Badge
        className={classNames({ 'text-xs text-grey-muted': !isChildren })}
        color="#004AB3FF"
        count="beta"
        offset={[30, 8]}
        size="small">
        {label}
      </Badge>
    ) : (
      label
    ),
    type,
  };
};
