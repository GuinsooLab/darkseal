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

import { faExclamationCircle, faStar } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import classNames from 'classnames';
import { cloneDeep, isEmpty, isUndefined } from 'lodash';
import { EntityFieldThreads, EntityTags, ExtraInfo, TagOption } from 'Models';
import React, { Fragment, useEffect, useState } from 'react';
import { FQN_SEPARATOR_CHAR } from '../../../constants/char.constants';
import { FOLLOWERS_VIEW_CAP } from '../../../constants/constants';
import { SettledStatus } from '../../../enums/axios.enum';
import { Operation } from '../../../generated/entity/policies/accessControl/rule';
import { EntityReference } from '../../../generated/type/entityReference';
import { LabelType, State, TagLabel } from '../../../generated/type/tagLabel';
import { useAfterMount } from '../../../hooks/useAfterMount';
import { getHtmlForNonAdminAction } from '../../../utils/CommonUtils';
import { getEntityFeedLink, getInfoElements } from '../../../utils/EntityUtils';
import {
  fetchGlossaryTerms,
  getGlossaryTermlist,
} from '../../../utils/GlossaryUtils';
import SVGIcons, { Icons } from '../../../utils/SvgUtils';
import { getTagCategories, getTaglist } from '../../../utils/TagsUtils';
import TagsContainer from '../../tags-container/tags-container';
import TagsViewer from '../../tags-viewer/tags-viewer';
import Tags from '../../tags/tags';
import NonAdminAction from '../non-admin-action/NonAdminAction';
import PopOver from '../popover/PopOver';
import ProfilePicture from '../ProfilePicture/ProfilePicture';
import TitleBreadcrumb from '../title-breadcrumb/title-breadcrumb.component';
import { TitleBreadcrumbProps } from '../title-breadcrumb/title-breadcrumb.interface';
import FollowersModal from './FollowersModal';

interface Props {
  titleLinks: TitleBreadcrumbProps['titleLinks'];
  isFollowing?: boolean;
  deleted?: boolean;
  followers?: number;
  extraInfo: Array<ExtraInfo>;
  tier: TagLabel;
  tags: Array<EntityTags>;
  isTagEditable?: boolean;
  owner?: EntityReference;
  hasEditAccess?: boolean;
  followersList: Array<EntityReference>;
  entityName: string;
  entityType?: string;
  entityFqn?: string;
  version?: string;
  isVersionSelected?: boolean;
  entityFieldThreads?: EntityFieldThreads[];
  onThreadLinkSelect?: (value: string) => void;
  followHandler?: () => void;
  tagsHandler?: (selectedTags?: Array<EntityTags>) => void;
  versionHandler?: () => void;
}

const EntityPageInfo = ({
  titleLinks,
  isFollowing,
  deleted = false,
  followHandler,
  followers,
  extraInfo,
  tier,
  tags,
  isTagEditable = false,
  owner,
  hasEditAccess,
  tagsHandler,
  followersList = [],
  entityName,
  version,
  isVersionSelected,
  versionHandler,
  entityFieldThreads,
  onThreadLinkSelect,
  entityFqn,
  entityType,
}: Props) => {
  const tagThread = entityFieldThreads?.[0];
  const [isEditable, setIsEditable] = useState<boolean>(false);
  const [entityFollowers, setEntityFollowers] =
    useState<Array<EntityReference>>(followersList);
  const [isViewMore, setIsViewMore] = useState<boolean>(false);
  const [tagList, setTagList] = useState<Array<TagOption>>([]);
  const [tagFetchFailed, setTagFetchFailed] = useState<boolean>(false);
  const [isTagLoading, setIsTagLoading] = useState<boolean>(false);
  const [versionFollowButtonWidth, setVersionFollowButtonWidth] = useState(
    document.getElementById('version-and-follow-section')?.offsetWidth
  );

  const handleTagSelection = (selectedTags?: Array<EntityTags>) => {
    if (selectedTags) {
      const prevTags =
        tags?.filter((tag) =>
          selectedTags
            .map((selTag) => selTag.tagFQN)
            .includes(tag?.tagFQN as string)
        ) || [];
      const newTags = selectedTags
        .filter((tag) => {
          return !prevTags
            ?.map((prevTag) => prevTag.tagFQN)
            .includes(tag.tagFQN);
        })
        .map((tag) => ({
          labelType: LabelType.Manual,
          state: State.Confirmed,
          source: tag.source,
          tagFQN: tag.tagFQN,
        }));
      tagsHandler?.([...prevTags, ...newTags]);
    }
    setIsEditable(false);
  };

  const getSelectedTags = () => {
    return tier?.tagFQN
      ? [
          ...tags.map((tag) => ({
            ...tag,
            isRemovable: true,
          })),
          { tagFQN: tier.tagFQN, isRemovable: false },
        ]
      : [
          ...tags.map((tag) => ({
            ...tag,
            isRemovable: true,
          })),
        ];
  };

  const getFollowers = () => {
    const list = cloneDeep(entityFollowers);

    return (
      <div
        className={classNames('tw-max-h-96 tw-overflow-y-auto', {
          'tw-flex tw-justify-center tw-items-center tw-py-2':
            list.length === 0,
        })}>
        {list.length > 0 ? (
          <div
            className={classNames('tw-grid tw-gap-3', {
              'tw-grid-cols-2': list.length > 1,
            })}>
            {list.slice(0, FOLLOWERS_VIEW_CAP).map((follower, index) => (
              <div className="tw-flex" key={index}>
                <ProfilePicture
                  displayName={follower?.displayName || follower?.name}
                  id={follower?.id || ''}
                  name={follower?.name || ''}
                  width="20"
                />
                <span className="tw-self-center tw-ml-2">
                  {follower?.displayName || follower?.name}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p>{entityName} doesn&#39;t have any followers yet</p>
        )}
        {list.length > FOLLOWERS_VIEW_CAP && (
          <p
            className="link-text tw-text-sm tw-py-2"
            onClick={() => setIsViewMore(true)}>
            View more
          </p>
        )}
      </div>
    );
  };

  const getVersionButton = (version: string) => {
    return (
      <div
        className="tw-flex tw-h-6 tw-ml-2"
        data-testid="version"
        onClick={versionHandler}>
        <span
          className={classNames(
            'tw-flex tw-border tw-border-primary tw-rounded',
            !isUndefined(isVersionSelected)
              ? 'tw-bg-primary tw-text-white'
              : 'tw-text-primary'
          )}>
          <button
            className={classNames(
              'tw-text-xs tw-border-r tw-font-medium tw-py-1 tw-px-2 tw-rounded-l focus:tw-outline-none tw-self-center tw-h-full tw-flex tw-items-center',
              !isUndefined(isVersionSelected)
                ? 'tw-border-white'
                : 'tw-border-primary'
            )}
            data-testid="version-button">
            <SVGIcons
              alt="version icon"
              icon={isVersionSelected ? 'icon-version-white' : 'icon-version'}
            />{' '}
            Versions
          </button>

          <span
            className="tw-text-xs tw-border-l-0 tw-font-medium tw-p-2 tw-rounded-r tw-cursor-pointer hover:tw-underline tw-flex tw-self-center"
            data-testid="version-value">
            {parseFloat(version).toFixed(1)}
          </span>
        </span>
      </div>
    );
  };

  const fetchTagsAndGlossaryTerms = () => {
    setIsTagLoading(true);
    Promise.allSettled([getTagCategories(), fetchGlossaryTerms()])
      .then((values) => {
        let tagsAndTerms: TagOption[] = [];
        if (
          values[0].status === SettledStatus.FULFILLED &&
          values[0].value.data
        ) {
          tagsAndTerms = getTaglist(values[0].value.data).map((tag) => {
            return { fqn: tag, source: 'Tag' };
          });
        }
        if (
          values[1].status === SettledStatus.FULFILLED &&
          values[1].value &&
          values[1].value.length > 0
        ) {
          const glossaryTerms: TagOption[] = getGlossaryTermlist(
            values[1].value
          ).map((tag) => {
            return { fqn: tag, source: 'Glossary' };
          });
          tagsAndTerms = [...tagsAndTerms, ...glossaryTerms];
        }
        setTagList(tagsAndTerms);
        if (
          values[0].status === SettledStatus.FULFILLED &&
          values[1].status === SettledStatus.FULFILLED
        ) {
          setTagFetchFailed(false);
        } else {
          setTagFetchFailed(true);
        }
      })
      .catch(() => {
        setTagList([]);
        setTagFetchFailed(true);
      })
      .finally(() => {
        setIsTagLoading(false);
      });
  };

  const getThreadElements = () => {
    if (!isUndefined(entityFieldThreads)) {
      return !isUndefined(tagThread) ? (
        <p
          className="link-text tw-m-0 tw-ml-1 tw-w-8 tw-flex-none"
          data-testid="tag-thread"
          onClick={() => onThreadLinkSelect?.(tagThread.entityLink)}>
          <span className="tw-flex">
            <SVGIcons alt="comments" icon={Icons.COMMENT} width="20px" />
            <span className="tw-ml-1" data-testid="tag-thread-count">
              {tagThread.count}
            </span>
          </span>
        </p>
      ) : (
        <p
          className="link-text tw-self-start tw-w-8 tw-m-0 tw-ml-1  tw-flex-none"
          data-testid="start-tag-thread"
          onClick={() =>
            onThreadLinkSelect?.(
              getEntityFeedLink(entityType, entityFqn, 'tags')
            )
          }>
          <SVGIcons alt="comments" icon={Icons.COMMENT_PLUS} width="20px" />
        </p>
      );
    } else {
      return null;
    }
  };

  useEffect(() => {
    setEntityFollowers(followersList);
  }, [followersList]);

  useAfterMount(() => {
    setVersionFollowButtonWidth(
      document.getElementById('version-and-follow-section')?.offsetWidth
    );
  });

  return (
    <div data-testid="entity-page-info">
      <div className="tw-flex tw-flex-col">
        <div className="tw-flex tw-flex-initial tw-justify-between tw-items-start">
          <div className="tw-flex tw-items-center">
            <TitleBreadcrumb
              titleLinks={titleLinks}
              widthDeductions={
                (versionFollowButtonWidth ? versionFollowButtonWidth : 0) + 30
              }
            />
            {deleted && (
              <>
                <div
                  className="tw-rounded tw-bg-error-lite tw-text-error tw-font-medium tw-h-6 tw-px-2 tw-py-0.5 tw-ml-2"
                  data-testid="deleted-badge">
                  <FontAwesomeIcon
                    className="tw-mr-1"
                    icon={faExclamationCircle}
                  />
                  Deleted
                </div>
              </>
            )}
          </div>
          <div
            className="tw-flex tw-py-1 tw-mt-1"
            id="version-and-follow-section">
            {!isUndefined(version) ? (
              <>
                {!isUndefined(isVersionSelected) ? (
                  <PopOver
                    html={
                      <p className="tw-text-xs">
                        Viewing older version <br />
                        Go to latest to update details
                      </p>
                    }
                    position="top"
                    trigger="mouseenter">
                    {getVersionButton(version)}
                  </PopOver>
                ) : (
                  <>{getVersionButton(version as string)}</>
                )}
              </>
            ) : null}
            {!isUndefined(isFollowing) ? (
              <div className="tw-flex tw-h-6 tw-ml-2">
                <span
                  className={classNames(
                    'tw-flex tw-border tw-border-primary tw-rounded',
                    isFollowing
                      ? 'tw-bg-primary tw-text-white'
                      : 'tw-text-primary'
                  )}>
                  <button
                    className={classNames(
                      'tw-text-xs tw-border-r tw-font-medium tw-py-1 tw-px-2 tw-rounded-l focus:tw-outline-none tw-self-center',
                      isFollowing ? 'tw-border-white' : 'tw-border-primary',
                      { 'tw-cursor-not-allowed': deleted }
                    )}
                    data-testid="follow-button"
                    onClick={() => {
                      !deleted && followHandler?.();
                    }}>
                    {isFollowing ? (
                      <>
                        <FontAwesomeIcon icon={faStar} /> Unfollow
                      </>
                    ) : (
                      <>
                        <FontAwesomeIcon icon={faStar} /> Follow
                      </>
                    )}
                  </button>
                  <PopOver
                    className="tw-justify-center tw-items-center"
                    html={getFollowers()}
                    position="bottom"
                    theme="light"
                    trigger="click">
                    <span
                      className="tw-text-xs tw-border-l-0 tw-font-medium tw-py-1 tw-px-2 tw-rounded-r tw-cursor-pointer hover:tw-underline"
                      data-testid="follower-value">
                      {followers}
                    </span>
                  </PopOver>
                </span>
              </div>
            ) : null}
          </div>
        </div>
      </div>
      <div
        className="tw-flex tw-gap-1 tw-mb-2 tw-mt-1 tw-ml-7 tw-flex-wrap tw-items-center"
        data-testid="extrainfo">
        {extraInfo.map((info, index) => (
          <span
            className="tw-flex tw-items-center"
            data-testid={info.key || `info${index}`}
            key={index}>
            {getInfoElements(info)}
            {extraInfo.length !== 1 && index < extraInfo.length - 1 ? (
              <span className="tw-mx-1.5 tw-inline-block tw-text-gray-400">
                |
              </span>
            ) : null}
          </span>
        ))}
      </div>
      <div
        className="tw-flex tw-flex-wrap tw-pt-1 tw-ml-7 tw-group"
        data-testid="entity-tags">
        {(!isEditable || !isTagEditable || deleted) && (
          <>
            {(tags.length > 0 || !isEmpty(tier)) && (
              <SVGIcons
                alt="icon-tag"
                className="tw-mx-1"
                icon="icon-tag-grey"
                width="16"
              />
            )}
            {tier?.tagFQN && (
              <Tags
                startWith="#"
                tag={{
                  ...tier,
                  tagFQN: tier.tagFQN.split(FQN_SEPARATOR_CHAR)[1],
                }}
                type="label"
              />
            )}
            {tags.length > 0 && <TagsViewer tags={tags} />}
          </>
        )}
        {isTagEditable && !deleted && (
          <Fragment>
            <NonAdminAction
              html={getHtmlForNonAdminAction(Boolean(owner))}
              isOwner={hasEditAccess}
              permission={Operation.EditTags}
              position="bottom"
              trigger="click">
              <div
                className="tw-inline-block"
                data-testid="tags-wrapper"
                onClick={() => {
                  // Fetch tags and terms only once
                  if (tagList.length === 0 || tagFetchFailed) {
                    fetchTagsAndGlossaryTerms();
                  }
                  setIsEditable(true);
                }}>
                <TagsContainer
                  dropDownHorzPosRight={false}
                  editable={isEditable}
                  isLoading={isTagLoading}
                  selectedTags={getSelectedTags()}
                  showTags={!isTagEditable}
                  size="small"
                  tagList={tagList}
                  onCancel={() => {
                    handleTagSelection();
                  }}
                  onSelectionChange={(tags) => {
                    handleTagSelection(tags);
                  }}>
                  {tags.length || tier ? (
                    <button
                      className=" tw-ml-1 focus:tw-outline-none"
                      data-testid="edit-button">
                      <SVGIcons
                        alt="edit"
                        icon="icon-edit"
                        title="Edit"
                        width="16px"
                      />
                    </button>
                  ) : (
                    <span>
                      <Tags
                        className="tw-text-primary"
                        startWith="+ "
                        tag="Add tag"
                        type="label"
                      />
                    </span>
                  )}
                </TagsContainer>
              </div>
            </NonAdminAction>
            {getThreadElements()}
          </Fragment>
        )}
      </div>
      {isViewMore && (
        <FollowersModal
          header={
            <>
              Followers of <span className="tw-text-black">{entityName}</span>{' '}
            </>
          }
          list={entityFollowers}
          onCancel={() => setIsViewMore(false)}
        />
      )}
    </div>
  );
};

export default EntityPageInfo;
