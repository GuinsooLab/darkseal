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
import { isUndefined } from 'lodash';
import { ExtraInfo } from 'Models';
import React, { FC, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FQN_SEPARATOR_CHAR } from '../../constants/char.constants';
import { EntityField } from '../../constants/Feeds.constants';
import { OwnerType } from '../../enums/user.enum';
import { ChangeDescription, Topic } from '../../generated/entity/data/topic';
import { TagLabel } from '../../generated/type/tagLabel';
import {
  getDescriptionDiff,
  getDiffByFieldName,
  getDiffValue,
  getTagsDiff,
} from '../../utils/EntityVersionUtils';
import { TagLabelWithStatus } from '../../utils/EntityVersionUtils.interface';
import { bytesToSize } from '../../utils/StringsUtils';
import Description from '../common/description/Description';
import EntityPageInfo from '../common/entityPageInfo/EntityPageInfo';
import TabsPane from '../common/TabsPane/TabsPane';
import EntityVersionTimeLine from '../EntityVersionTimeLine/EntityVersionTimeLine';
import Loader from '../Loader/Loader';
import SchemaEditor from '../schema-editor/SchemaEditor';
import { TopicVersionProp } from './TopicVersion.interface';

const TopicVersion: FC<TopicVersionProp> = ({
  version,
  currentVersionData,
  isVersionLoading,
  owner,
  tier,
  slashedTopicName,
  versionList,
  deleted = false,
  backHandler,
  versionHandler,
}: TopicVersionProp) => {
  const { t } = useTranslation();
  const [changeDescription, setChangeDescription] = useState<ChangeDescription>(
    currentVersionData.changeDescription as ChangeDescription
  );
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

  const getConfigDetails = () => {
    return [
      {
        key: 'Partitions',
        value: `${(currentVersionData as Topic).partitions ?? '--'} ${t(
          'label.partition-lowercase-plural'
        )}`,
      },
      {
        key: 'Replication Factor',
        value: `${(currentVersionData as Topic).replicationFactor ?? '--'} ${t(
          'label.replication-factor'
        )}`,
      },
      {
        key: 'Retention Size',
        value: `${bytesToSize(
          (currentVersionData as Topic).retentionSize ?? 0
        )} ${t('label.retention-size-lowercase')}`,
      },
      {
        key: 'Clean-up Policies',
        value: `${(currentVersionData as Topic)?.cleanupPolicies?.join(
          ', '
        )} ${t('label.clean-up-policy-plural-lowercase')}`,
      },
      {
        key: 'Max Message Size',
        value: `${bytesToSize(
          (currentVersionData as Topic).maximumMessageSize ?? 0
        )} ${t('label.maximum-size-lowercase')}`,
      },
    ];
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
      ...getConfigDetails(),
    ];

    return extraInfo;
  };

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
    ].forEach((elem) => {
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

  const getInfoBadge = (infos: Array<Record<string, string | number>>) => {
    return (
      <div className="tw-flex tw-justify-between">
        <div className="tw-flex tw-gap-3">
          {infos.map((info, index) => (
            <div className="tw-mt-4" key={index}>
              <span className="tw-py-1.5 tw-px-2 tw-rounded-l tw-bg-tag ">
                {info.key}
              </span>
              <span className="tw-py-1.5 tw-px-2 tw-bg-primary-lite tw-font-normal tw-rounded-r">
                {info.value}
              </span>
            </div>
          ))}
        </div>
        <div />
      </div>
    );
  };

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
              tier={{} as TagLabel}
              titleLinks={slashedTopicName}
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
                    {getInfoBadge([
                      {
                        key: t('label.schema'),
                        value:
                          (currentVersionData as Topic).messageSchema
                            ?.schemaType ?? '',
                      },
                    ])}
                    <div className="tw-my-4 tw-border tw-border-main tw-rounded-md tw-py-4">
                      <SchemaEditor
                        value={
                          (currentVersionData as Topic).messageSchema
                            ?.schemaText ?? '{}'
                        }
                      />
                    </div>
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

export default TopicVersion;
