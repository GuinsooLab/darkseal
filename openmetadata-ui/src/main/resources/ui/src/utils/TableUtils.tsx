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

import Icon from '@ant-design/icons/lib/components/Icon';
import { Tooltip } from 'antd';
import { ExpandableConfig } from 'antd/lib/table/interface';
import classNames from 'classnames';
import { t } from 'i18next';
import { upperCase } from 'lodash';
import { EntityTags } from 'Models';
import React from 'react';
import { ReactComponent as DashboardIcon } from '../assets/svg/dashboard-grey.svg';
import { ReactComponent as DragIcon } from '../assets/svg/drag.svg';
import { ReactComponent as DropDownIcon } from '../assets/svg/DropDown.svg';
import { ReactComponent as RightArrowIcon } from '../assets/svg/ic-right-arrow.svg';
import { ReactComponent as MlModelIcon } from '../assets/svg/mlmodal.svg';
import { ReactComponent as PipelineIcon } from '../assets/svg/pipeline-grey.svg';
import { ReactComponent as TableIcon } from '../assets/svg/table-grey.svg';
import { ReactComponent as TopicIcon } from '../assets/svg/topic-grey.svg';
import { FQN_SEPARATOR_CHAR } from '../constants/char.constants';
import {
  getDashboardDetailsPath,
  getDatabaseDetailsPath,
  getDatabaseSchemaDetailsPath,
  getEditWebhookPath,
  getMlModelPath,
  getPipelineDetailsPath,
  getServiceDetailsPath,
  getTableDetailsPath,
  getTopicDetailsPath,
} from '../constants/constants';
import { GlobalSettingsMenuCategory } from '../constants/GlobalSettings.constants';
import { EntityType, FqnPart } from '../enums/entity.enum';
import { SearchIndex } from '../enums/search.enum';
import { ConstraintTypes, PrimaryTableDataTypes } from '../enums/table.enum';
import {
  Column,
  DataType,
  TableConstraint,
} from '../generated/entity/data/table';
import { TestCaseStatus } from '../generated/tests/testCase';
import { TagLabel } from '../generated/type/tagLabel';
import {
  getPartialNameFromTableFQN,
  getTableFQNFromColumnFQN,
  sortTagsCaseInsensitive,
} from './CommonUtils';
import { getGlossaryPath, getSettingPath } from './RouterUtils';
import { ordinalize } from './StringsUtils';
import SVGIcons, { Icons } from './SvgUtils';

export const getBadgeName = (tableType?: string) => {
  switch (tableType) {
    case 'QUERY':
      return t('label.query-lowercase');
    default:
      return t('label.table-lowercase');
  }
};

export const usageSeverity = (value: number): string => {
  if (value > 75) {
    return 'High';
  } else if (value >= 25 && value <= 75) {
    return 'Medium';
  } else {
    return 'Low';
  }
};

export const getUsagePercentile = (pctRank: number, isLiteral = false) => {
  const percentile = Math.round(pctRank * 10) / 10;
  const ordinalPercentile = ordinalize(percentile);
  const usagePercentile = `${
    isLiteral ? t('label.usage') : ''
  } - ${ordinalPercentile} ${t('label.pctile-lowercase')}`;

  return usagePercentile;
};

export const getTierFromTableTags = (
  tags: Array<EntityTags>
): EntityTags['tagFQN'] => {
  const tierTag = tags.find(
    (item) =>
      item.tagFQN.startsWith(`Tier${FQN_SEPARATOR_CHAR}Tier`) &&
      !isNaN(parseInt(item.tagFQN.substring(9).trim()))
  );

  return tierTag?.tagFQN || '';
};

export const getTierTags = (tags: Array<TagLabel>) => {
  const tierTag = tags.find(
    (item) =>
      item.tagFQN.startsWith(`Tier${FQN_SEPARATOR_CHAR}Tier`) &&
      !isNaN(parseInt(item.tagFQN.substring(9).trim()))
  );

  return tierTag;
};

export const getTagsWithoutTier = (
  tags: Array<EntityTags>
): Array<EntityTags> => {
  return tags.filter(
    (item) =>
      !item.tagFQN.startsWith(`Tier${FQN_SEPARATOR_CHAR}Tier`) ||
      isNaN(parseInt(item.tagFQN.substring(9).trim()))
  );
};

export const getTierFromSearchTableTags = (tags: Array<string>): string => {
  const tierTag = tags.find(
    (item) =>
      item.startsWith(`Tier${FQN_SEPARATOR_CHAR}Tier`) &&
      !isNaN(parseInt(item.substring(9).trim()))
  );

  return tierTag || '';
};

export const getSearchTableTagsWithoutTier = (
  tags: Array<string>
): Array<string> => {
  return tags.filter(
    (item) =>
      !item.startsWith(`Tier${FQN_SEPARATOR_CHAR}Tier`) ||
      isNaN(parseInt(item.substring(9).trim()))
  );
};

export const getConstraintIcon = (
  constraint = '',
  className = '',
  width = '16px'
) => {
  let title: string, icon: string;
  switch (constraint) {
    case ConstraintTypes.PRIMARY_KEY:
      {
        title = t('label.primary-key');
        icon = Icons.KEY;
      }

      break;
    case ConstraintTypes.UNIQUE:
      {
        title = t('label.unique');
        icon = Icons.UNIQUE;
      }

      break;
    case ConstraintTypes.NOT_NULL:
      {
        title = t('label.not-null');
        icon = Icons.NOT_NULL;
      }

      break;
    case ConstraintTypes.FOREIGN_KEY:
      {
        title = t('label.foreign-key');
        icon = Icons.FOREGIN_KEY;
      }

      break;
    default:
      return null;
  }

  return (
    <Tooltip
      className={classNames(className)}
      placement="bottom"
      title={title}
      trigger="hover">
      <SVGIcons alt={title} icon={icon} width={width} />
    </Tooltip>
  );
};

export const getEntityLink = (
  indexType: string,
  fullyQualifiedName: string
) => {
  // encode the FQN for entities that can have "/" in their names
  fullyQualifiedName = encodeURIComponent(fullyQualifiedName);
  switch (indexType) {
    case SearchIndex.TOPIC:
    case EntityType.TOPIC:
      return getTopicDetailsPath(fullyQualifiedName);

    case SearchIndex.DASHBOARD:
    case EntityType.DASHBOARD:
      return getDashboardDetailsPath(fullyQualifiedName);

    case SearchIndex.PIPELINE:
    case EntityType.PIPELINE:
      return getPipelineDetailsPath(fullyQualifiedName);

    case EntityType.DATABASE:
      return getDatabaseDetailsPath(fullyQualifiedName);

    case EntityType.DATABASE_SCHEMA:
      return getDatabaseSchemaDetailsPath(fullyQualifiedName);

    case EntityType.GLOSSARY:
    case EntityType.GLOSSARY_TERM:
      return getGlossaryPath(fullyQualifiedName);

    case EntityType.DATABASE_SERVICE:
    case EntityType.DASHBOARD_SERVICE:
    case EntityType.MESSAGING_SERVICE:
    case EntityType.PIPELINE_SERVICE:
      return getServiceDetailsPath(fullyQualifiedName, `${indexType}s`);

    case EntityType.WEBHOOK:
      return getEditWebhookPath(fullyQualifiedName);

    case EntityType.TYPE:
      return getSettingPath(
        GlobalSettingsMenuCategory.CUSTOM_ATTRIBUTES,
        `${fullyQualifiedName}s`
      );

    case EntityType.MLMODEL:
    case SearchIndex.MLMODEL:
      return getMlModelPath(fullyQualifiedName);

    case SearchIndex.TABLE:
    case EntityType.TABLE:
    default:
      return getTableDetailsPath(fullyQualifiedName);
  }
};

export const getEntityIcon = (indexType: string) => {
  switch (indexType) {
    case SearchIndex.TOPIC:
    case EntityType.TOPIC:
      return <TopicIcon />;

    case SearchIndex.DASHBOARD:
    case EntityType.DASHBOARD:
      return <DashboardIcon />;

    case SearchIndex.MLMODEL:
    case EntityType.MLMODEL:
      return <MlModelIcon />;

    case SearchIndex.PIPELINE:
    case EntityType.PIPELINE:
      return <PipelineIcon />;

    case SearchIndex.TABLE:
    case EntityType.TABLE:
    default:
      return <TableIcon />;
  }
};

export const makeRow = (column: Column) => {
  return {
    description: column.description || '',
    // Sorting tags as the response of PATCH request does not return the sorted order
    // of tags, but is stored in sorted manner in the database
    // which leads to wrong PATCH payload sent after further tags removal
    tags: sortTagsCaseInsensitive(column.tags || []),
    key: column?.name,
    ...column,
  };
};

export const makeData = (
  columns: Column[] = []
): Array<Column & { subRows: Column[] | undefined }> => {
  return columns.map((column) => ({
    ...makeRow(column),
    subRows: column.children ? makeData(column.children) : undefined,
  }));
};

export const getDataTypeString = (dataType: string): string => {
  switch (upperCase(dataType)) {
    case DataType.String:
    case DataType.Char:
    case DataType.Text:
    case DataType.Varchar:
    case DataType.Mediumtext:
    case DataType.Mediumblob:
    case DataType.Blob:
      return PrimaryTableDataTypes.VARCHAR;
    case DataType.Timestamp:
    case DataType.Time:
      return PrimaryTableDataTypes.TIMESTAMP;
    case DataType.Date:
      return PrimaryTableDataTypes.DATE;
    case DataType.Int:
    case DataType.Float:
    case DataType.Smallint:
    case DataType.Bigint:
    case DataType.Numeric:
    case DataType.Tinyint:
    case DataType.Decimal:
      return PrimaryTableDataTypes.NUMERIC;
    case DataType.Boolean:
    case DataType.Enum:
      return PrimaryTableDataTypes.BOOLEAN;
    default:
      return dataType;
  }
};

export const generateEntityLink = (fqn: string, includeColumn = false) => {
  const columnLink = '<#E::table::ENTITY_FQN::columns::COLUMN>';
  const tableLink = '<#E::table::ENTITY_FQN>';

  if (includeColumn) {
    const tableFqn = getTableFQNFromColumnFQN(fqn);
    const columnName = getPartialNameFromTableFQN(fqn, [FqnPart.NestedColumn]);

    return columnLink
      .replace('ENTITY_FQN', tableFqn)
      .replace('COLUMN', columnName);
  } else {
    return tableLink.replace('ENTITY_FQN', fqn);
  }
};

export const getEntityFqnFromEntityLink = (
  entityLink: string,
  includeColumn = false
) => {
  const link = entityLink.split('>')[0];
  const entityLinkData = link.split('::');
  const tableFqn = entityLinkData[2];

  if (includeColumn) {
    return `${tableFqn}.${entityLinkData[entityLinkData.length - 1]}`;
  }

  return tableFqn;
};

export const getTestResultBadgeIcon = (status?: TestCaseStatus) => {
  switch (status) {
    case TestCaseStatus.Success:
      return Icons.SUCCESS_BADGE;

    case TestCaseStatus.Failed:
      return Icons.FAIL_BADGE;

    case TestCaseStatus.Aborted:
      return Icons.PENDING_BADGE;

    default:
      return '';
  }
};

export function getTableExpandableConfig<T>(
  isDraggable?: boolean
): ExpandableConfig<T> {
  const expandableConfig: ExpandableConfig<T> = {
    expandIcon: ({ expanded, onExpand, expandable, record }) =>
      expandable ? (
        <>
          {isDraggable && <Icon className="drag-icon" component={DragIcon} />}
          <Icon
            className="mr-1"
            component={expanded ? DropDownIcon : RightArrowIcon}
            data-testid="expand-icon"
            size={16}
            onClick={(e) => onExpand(record, e)}
          />
        </>
      ) : (
        isDraggable && (
          <>
            <Icon className="drag-icon" component={DragIcon} />
            <div className="expand-cell-empty-icon-container" />
          </>
        )
      ),
  };

  return expandableConfig;
}

export const prepareConstraintIcon = (
  columnName: string,
  columnConstraint?: string,
  tableConstraints?: TableConstraint[],
  iconClassName?: string,
  iconWidth?: string
) => {
  // get the table constraint for column
  const tableConstraint = tableConstraints?.find((constraint) =>
    constraint.columns?.includes(columnName)
  );

  // prepare column constraint element
  const columnConstraintEl = columnConstraint
    ? getConstraintIcon(columnConstraint, iconClassName || 'tw-mr-2', iconWidth)
    : null;

  // prepare table constraint element
  const tableConstraintEl = tableConstraint
    ? getConstraintIcon(
        tableConstraint.constraintType,
        iconClassName || 'tw-mr-2',
        iconWidth
      )
    : null;

  return (
    <span data-testid="constraints">
      {columnConstraintEl} {tableConstraintEl}
    </span>
  );
};
