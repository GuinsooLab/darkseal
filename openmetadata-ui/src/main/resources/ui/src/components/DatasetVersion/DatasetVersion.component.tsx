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

import classNames from 'classnames';
import PageContainer from 'components/containers/PageContainer';

import { cloneDeep, isEqual, isUndefined } from 'lodash';
import { ExtraInfo } from 'Models';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FQN_SEPARATOR_CHAR } from '../../constants/char.constants';
import { EntityField } from '../../constants/Feeds.constants';
import { FqnPart } from '../../enums/entity.enum';
import { OwnerType } from '../../enums/user.enum';
import {
  ChangeDescription,
  Column,
  ColumnJoins,
  Table,
} from '../../generated/entity/data/table';
import { TagLabel } from '../../generated/type/tagLabel';
import { getPartialNameFromTableFQN } from '../../utils/CommonUtils';
import {
  getDescriptionDiff,
  getDiffByFieldName,
  getDiffValue,
  getTagsDiff,
} from '../../utils/EntityVersionUtils';
import { TagLabelWithStatus } from '../../utils/EntityVersionUtils.interface';
import Description from '../common/description/Description';
import EntityPageInfo from '../common/entityPageInfo/EntityPageInfo';
import TabsPane from '../common/TabsPane/TabsPane';
import EntityVersionTimeLine from '../EntityVersionTimeLine/EntityVersionTimeLine';
import Loader from '../Loader/Loader';
import VersionTable from '../VersionTable/VersionTable.component';
import { DatasetVersionProp } from './DatasetVersion.interface';

const DatasetVersion: React.FC<DatasetVersionProp> = ({
  version,
  currentVersionData,
  isVersionLoading,
  owner,
  tier,
  slashedTableName,
  datasetFQN,
  versionList,
  deleted = false,
  backHandler,
  versionHandler,
}: DatasetVersionProp) => {
  const { t } = useTranslation();
  const [changeDescription, setChangeDescription] = useState<ChangeDescription>(
    currentVersionData.changeDescription as ChangeDescription
  );

  const getChangeColName = (name: string | undefined) => {
    return name?.split(FQN_SEPARATOR_CHAR)?.slice(-2, -1)[0];
  };

  const isEndsWithField = (name: string | undefined, checkWith: string) => {
    return name?.endsWith(checkWith);
  };

  const getExtraInfo = () => {
    const ownerDiff = getDiffByFieldName('owner', changeDescription);

    const oldOwner = JSON.parse(
      ownerDiff?.added?.oldValue ??
        ownerDiff?.deleted?.oldValue ??
        ownerDiff?.updated?.oldValue ??
        '{}'
    );
    const newOwner = JSON.parse(
      ownerDiff?.added?.newValue ??
        ownerDiff?.deleted?.newValue ??
        ownerDiff?.updated?.newValue ??
        '{}'
    );
    const ownerPlaceHolder = owner?.name ?? owner?.displayName ?? '';

    const tagsDiff = getDiffByFieldName('tags', changeDescription, true);
    const newTier = [
      ...JSON.parse(
        tagsDiff?.added?.newValue ??
          tagsDiff?.deleted?.newValue ??
          tagsDiff?.updated?.newValue ??
          '[]'
      ),
    ].find((t) => (t?.tagFQN as string).startsWith('Tier'));

    const oldTier = [
      ...JSON.parse(
        tagsDiff?.added?.oldValue ??
          tagsDiff?.deleted?.oldValue ??
          tagsDiff?.updated?.oldValue ??
          '[]'
      ),
    ].find((t) => (t?.tagFQN as string).startsWith('Tier'));

    const extraInfo: Array<ExtraInfo> = [
      {
        key: 'Owner',
        value:
          !isUndefined(ownerDiff.added) ||
          !isUndefined(ownerDiff.deleted) ||
          !isUndefined(ownerDiff.updated)
            ? getDiffValue(
                oldOwner?.displayName || oldOwner?.name || '',
                newOwner?.displayName || newOwner?.name || ''
              )
            : ownerPlaceHolder
            ? getDiffValue(ownerPlaceHolder, ownerPlaceHolder)
            : '',
        profileName:
          newOwner?.type === OwnerType.USER ? newOwner?.name : undefined,
      },
      {
        key: 'Tier',
        value:
          !isUndefined(newTier) || !isUndefined(oldTier)
            ? getDiffValue(
                oldTier?.tagFQN?.split(FQN_SEPARATOR_CHAR)[1] || '',
                newTier?.tagFQN?.split(FQN_SEPARATOR_CHAR)[1] || ''
              )
            : tier?.tagFQN
            ? tier?.tagFQN.split(FQN_SEPARATOR_CHAR)[1]
            : '',
      },
    ];

    return extraInfo;
  };

  const getTableDescription = () => {
    const descriptionDiff = getDiffByFieldName(
      EntityField.DESCRIPTION,
      changeDescription
    );
    const oldDescription =
      descriptionDiff?.added?.oldValue ??
      descriptionDiff?.deleted?.oldValue ??
      descriptionDiff?.updated?.oldValue;
    const newDescription =
      descriptionDiff?.added?.newValue ??
      descriptionDiff?.deleted?.newValue ??
      descriptionDiff?.updated?.newValue;

    return getDescriptionDiff(
      oldDescription,
      newDescription,
      currentVersionData.description
    );
  };

  const updatedColumns = (): Table['columns'] => {
    const colList = cloneDeep((currentVersionData as Table).columns);
    const columnsDiff = getDiffByFieldName(
      EntityField.COLUMNS,
      changeDescription
    );
    const changedColName = getChangeColName(
      columnsDiff?.added?.name ??
        columnsDiff?.deleted?.name ??
        columnsDiff?.updated?.name
    );

    if (
      isEndsWithField(
        columnsDiff?.added?.name ??
          columnsDiff?.deleted?.name ??
          columnsDiff?.updated?.name,
        EntityField.DESCRIPTION
      )
    ) {
      const oldDescription =
        columnsDiff?.added?.oldValue ??
        columnsDiff?.deleted?.oldValue ??
        columnsDiff?.updated?.oldValue;
      const newDescription =
        columnsDiff?.added?.newValue ??
        columnsDiff?.deleted?.newValue ??
        columnsDiff?.updated?.newValue;

      const formatColumnData = (arr: Table['columns']) => {
        arr?.forEach((i) => {
          if (isEqual(i.name, changedColName)) {
            i.description = getDescriptionDiff(
              oldDescription,
              newDescription,
              i.description
            );
          } else {
            formatColumnData(i?.children as Table['columns']);
          }
        });
      };

      formatColumnData(colList ?? []);

      return colList ?? [];
    } else if (
      isEndsWithField(
        columnsDiff?.added?.name ??
          columnsDiff?.deleted?.name ??
          columnsDiff?.updated?.name,
        'tags'
      )
    ) {
      const oldTags: Array<TagLabel> = JSON.parse(
        columnsDiff?.added?.oldValue ??
          columnsDiff?.deleted?.oldValue ??
          columnsDiff?.updated?.oldValue ??
          '[]'
      );
      const newTags: Array<TagLabel> = JSON.parse(
        columnsDiff?.added?.newValue ??
          columnsDiff?.deleted?.newValue ??
          columnsDiff?.updated?.newValue ??
          '[]'
      );

      const formatColumnData = (arr: Table['columns']) => {
        arr?.forEach((i) => {
          if (isEqual(i.name, changedColName)) {
            const flag: { [x: string]: boolean } = {};
            const uniqueTags: Array<TagLabelWithStatus> = [];
            const tagsDiff = getTagsDiff(oldTags, newTags);
            [...tagsDiff, ...(i.tags as Array<TagLabelWithStatus>)].forEach(
              (elem: TagLabelWithStatus) => {
                if (!flag[elem.tagFQN as string]) {
                  flag[elem.tagFQN as string] = true;
                  uniqueTags.push(elem);
                }
              }
            );
            i.tags = uniqueTags;
          } else {
            formatColumnData(i?.children as Table['columns']);
          }
        });
      };

      formatColumnData(colList ?? []);

      return colList ?? [];
    } else {
      const columnsDiff = getDiffByFieldName(
        EntityField.COLUMNS,
        changeDescription,
        true
      );
      let newColumns: Array<Column> = [] as Array<Column>;
      if (columnsDiff.added) {
        const newCol: Array<Column> = JSON.parse(
          columnsDiff.added?.newValue ?? '[]'
        );
        newCol.forEach((col) => {
          const formatColumnData = (arr: Table['columns']) => {
            arr?.forEach((i) => {
              if (isEqual(i.name, col.name)) {
                i.tags = col.tags?.map((tag) => ({ ...tag, added: true }));
                i.description = getDescriptionDiff(
                  undefined,
                  col.description,
                  col.description
                );
                i.dataTypeDisplay = getDescriptionDiff(
                  undefined,
                  col.dataTypeDisplay,
                  col.dataTypeDisplay
                );
                i.name = getDescriptionDiff(undefined, col.name, col.name);
              } else {
                formatColumnData(i?.children as Table['columns']);
              }
            });
          };
          formatColumnData(colList ?? []);
        });
      }
      if (columnsDiff.deleted) {
        const newCol: Array<Column> = JSON.parse(
          columnsDiff.deleted?.oldValue ?? '[]'
        );
        newColumns = newCol.map((col) => ({
          ...col,
          tags: col.tags?.map((tag) => ({ ...tag, removed: true })),
          description: getDescriptionDiff(
            col.description,
            undefined,
            col.description
          ),
          dataTypeDisplay: getDescriptionDiff(
            col.dataTypeDisplay,
            undefined,
            col.dataTypeDisplay
          ),
          name: getDescriptionDiff(col.name, undefined, col.name),
        }));
      } else {
        return colList ?? [];
      }

      return [...newColumns, ...(colList ?? [])];
    }
  };

  /**
   * Calculates tags for selected version.
   * @returns current version's tag.
   */
  const getTags = () => {
    const tagsDiff = getDiffByFieldName('tags', changeDescription, true);
    const oldTags: Array<TagLabel> = JSON.parse(
      tagsDiff?.added?.oldValue ??
        tagsDiff?.deleted?.oldValue ??
        tagsDiff?.updated?.oldValue ??
        '[]'
    );
    const newTags: Array<TagLabel> = JSON.parse(
      tagsDiff?.added?.newValue ??
        tagsDiff?.deleted?.newValue ??
        tagsDiff?.updated?.newValue ??
        '[]'
    );
    const flag: { [x: string]: boolean } = {};
    const uniqueTags: Array<TagLabelWithStatus> = [];

    [
      ...(getTagsDiff(oldTags, newTags) ?? []),
      ...(currentVersionData.tags ?? []),
    ].forEach((elem: TagLabel) => {
      if (!flag[elem.tagFQN as string]) {
        flag[elem.tagFQN as string] = true;
        uniqueTags.push(elem as TagLabelWithStatus);
      }
    });

    return [
      ...uniqueTags.map((t) =>
        t.tagFQN.startsWith('Tier')
          ? { ...t, tagFQN: t.tagFQN.split(FQN_SEPARATOR_CHAR)[1] }
          : t
      ),
    ];
  };

  const tabs = [
    {
      name: t('label.schema'),
      icon: {
        alt: 'schema',
        name: 'icon-schema',
        title: 'Schema',
        selectedName: 'icon-schemacolor',
      },
      isProtected: false,
      position: 1,
    },
  ];

  useEffect(() => {
    setChangeDescription(
      currentVersionData.changeDescription as ChangeDescription
    );
  }, [currentVersionData]);

  return (
    <PageContainer>
      <div
        className={classNames(
          'tw-px-6 tw-w-full tw-h-full tw-flex tw-flex-col tw-relative'
        )}>
        {isVersionLoading ? (
          <Loader />
        ) : (
          <div className={classNames('version-data')}>
            <EntityPageInfo
              isVersionSelected
              deleted={deleted}
              entityName={currentVersionData.name ?? ''}
              extraInfo={getExtraInfo()}
              followersList={[]}
              tags={getTags()}
              tier={tier}
              titleLinks={slashedTableName}
              version={version}
              versionHandler={backHandler}
            />
            <div className="tw-mt-1 tw-flex tw-flex-col tw-flex-grow ">
              <TabsPane activeTab={1} className="tw-flex-initial" tabs={tabs} />
              <div className="tw-bg-white tw-flex-grow tw--mx-6 tw-px-7 tw-py-4">
                <div className="tw-grid tw-grid-cols-4 tw-gap-4 tw-w-full">
                  <div className="tw-col-span-full">
                    <Description
                      isReadOnly
                      description={getTableDescription()}
                    />
                  </div>

                  <div className="tw-col-span-full">
                    <VersionTable
                      columnName={getPartialNameFromTableFQN(
                        datasetFQN,
                        [FqnPart.Column],
                        FQN_SEPARATOR_CHAR
                      )}
                      columns={updatedColumns()}
                      joins={
                        (currentVersionData as Table).joins as ColumnJoins[]
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <EntityVersionTimeLine
          show
          currentVersion={version}
          versionHandler={versionHandler}
          versionList={versionList}
          onBack={backHandler}
        />
      </div>
    </PageContainer>
  );
};

export default DatasetVersion;
