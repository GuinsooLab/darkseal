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

import classNames from 'classnames';
import { isUndefined, toString } from 'lodash';
import React, { FC, Fragment } from 'react';
import { Link, useHistory } from 'react-router-dom';
import AppState from '../../../../AppState';
import { FQN_SEPARATOR_CHAR } from '../../../../constants/char.constants';
import { getUserPath } from '../../../../constants/constants';
import {
  EntityType,
  FqnPart,
  TabSpecificField,
} from '../../../../enums/entity.enum';
import { ThreadType } from '../../../../generated/entity/feed/thread';
import {
  getPartialNameFromFQN,
  getPartialNameFromTableFQN,
} from '../../../../utils/CommonUtils';
import {
  getEntityFieldDisplay,
  getFeedAction,
} from '../../../../utils/FeedUtils';
import { getEntityLink } from '../../../../utils/TableUtils';
import { getTaskDetailPath } from '../../../../utils/TasksUtils';
import { getDayTimeByTimeStamp } from '../../../../utils/TimeUtils';
import Ellipses from '../../../common/Ellipses/Ellipses';
import EntityPopOverCard from '../../../common/PopOverCard/EntityPopOverCard';
import UserPopOverCard from '../../../common/PopOverCard/UserPopOverCard';
import { FeedHeaderProp } from '../ActivityFeedCard.interface';
import './FeedCardHeader.style.css';

const FeedCardHeader: FC<FeedHeaderProp> = ({
  className,
  createdBy,
  timeStamp,
  entityFQN,
  entityType,
  entityField,
  isEntityFeed,
  feedType,
  taskDetails,
}) => {
  const history = useHistory();
  const onTitleClickHandler = (name: string) => {
    history.push(getUserPath(name));
  };
  const entityDisplayName = () => {
    let displayName;
    if (entityType === EntityType.TABLE) {
      displayName = getPartialNameFromTableFQN(
        entityFQN,
        [FqnPart.Database, FqnPart.Schema, FqnPart.Table],
        '.'
      );
    } else if (entityType === EntityType.DATABASE_SCHEMA) {
      displayName = getPartialNameFromTableFQN(entityFQN, [FqnPart.Schema]);
    } else if (
      [
        EntityType.DATABASE_SERVICE,
        EntityType.DASHBOARD_SERVICE,
        EntityType.MESSAGING_SERVICE,
        EntityType.PIPELINE_SERVICE,
        EntityType.TYPE,
        EntityType.MLMODEL,
      ].includes(entityType as EntityType)
    ) {
      displayName = getPartialNameFromFQN(entityFQN, ['service']);
    } else if (
      [EntityType.GLOSSARY, EntityType.GLOSSARY_TERM].includes(
        entityType as EntityType
      )
    ) {
      displayName = entityFQN.split(FQN_SEPARATOR_CHAR).pop();
    } else {
      displayName = getPartialNameFromFQN(entityFQN, ['database']);
    }

    // Remove quotes if the name is wrapped in quotes
    if (displayName) {
      displayName = displayName.replace(/^"+|"+$/g, '');
    }

    return displayName;
  };

  const prepareFeedLink = () => {
    const withoutFeedEntities = [
      EntityType.WEBHOOK,
      EntityType.GLOSSARY,
      EntityType.GLOSSARY_TERM,
      EntityType.TYPE,
      EntityType.MLMODEL,
    ];

    const entityLink = getEntityLink(entityType, entityFQN);

    if (!withoutFeedEntities.includes(entityType as EntityType)) {
      return `${entityLink}/${TabSpecificField.ACTIVITY_FEED}`;
    } else {
      return entityLink;
    }
  };

  const getFeedLinkElement = () => {
    if (!isUndefined(entityFQN) && !isUndefined(entityType)) {
      return (
        <Ellipses rows={1}>
          <span className="tw-pl-1 tw-font-normal" data-testid="headerText">
            {getFeedAction(feedType)}{' '}
            {isEntityFeed ? (
              <span className="tw-heading" data-testid="headerText-entityField">
                {getEntityFieldDisplay(entityField)}
              </span>
            ) : (
              <Fragment>
                <span data-testid="entityType">{entityType} </span>
                <Link data-testid="entitylink" to={prepareFeedLink()}>
                  <button
                    className="tw-text-info"
                    disabled={AppState.isTourOpen}>
                    <EntityPopOverCard
                      entityFQN={entityFQN}
                      entityType={entityType}>
                      <span>{entityDisplayName()}</span>
                    </EntityPopOverCard>
                  </button>
                </Link>
              </Fragment>
            )}
          </span>
        </Ellipses>
      );
    } else {
      return null;
    }
  };

  const getTaskLinkElement = () => {
    if (!isUndefined(entityFQN) && !isUndefined(entityType)) {
      return (
        <div className="tw-flex tw-flex-wrap">
          <span className="tw-px-1">created a task</span>
          <Link
            data-testid="tasklink"
            to={getTaskDetailPath(toString(taskDetails?.id)).pathname}>
            <button className="tw-text-info" disabled={AppState.isTourOpen}>
              {`#${taskDetails?.id}`} <span>{taskDetails?.type}</span>
            </button>
          </Link>
          <span className="tw-px-1">for</span>
          {isEntityFeed ? (
            <span className="tw-heading" data-testid="headerText-entityField">
              {getEntityFieldDisplay(entityField)}
            </span>
          ) : (
            <span className="tw-flex">
              <span className="tw-pr-1">{entityType}</span>

              <EntityPopOverCard entityFQN={entityFQN} entityType={entityType}>
                <Link data-testid="entitylink" to={prepareFeedLink()}>
                  <button disabled={AppState.isTourOpen}>
                    <Ellipses
                      className="tw-w-28 tw-text-left"
                      rows={1}
                      style={{
                        color: 'rgb(24, 144, 255)',
                        cursor: 'pointer',
                        textDecoration: 'none',
                      }}>
                      {entityDisplayName()}
                    </Ellipses>
                  </button>
                </Link>
              </EntityPopOverCard>
            </span>
          )}
        </div>
      );
    } else {
      return null;
    }
  };

  return (
    <div className={classNames('tw-flex', className)}>
      <div className="tw-flex tw-m-0 tw-pl-2 tw-leading-4">
        <UserPopOverCard userName={createdBy}>
          <span
            className="thread-author tw-cursor-pointer"
            onClick={() => onTitleClickHandler(createdBy)}>
            {createdBy}
          </span>
        </UserPopOverCard>

        {feedType === ThreadType.Conversation
          ? getFeedLinkElement()
          : getTaskLinkElement()}
        <span
          className="tw-text-grey-muted tw-pl-2 tw-text-xs tw--mb-0.5"
          data-testid="timestamp">
          {timeStamp && ' - ' + getDayTimeByTimeStamp(timeStamp)}
        </span>
      </div>
    </div>
  );
};

export default FeedCardHeader;
