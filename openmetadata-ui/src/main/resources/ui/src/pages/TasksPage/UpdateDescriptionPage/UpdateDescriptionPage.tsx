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

import { Button, Card, Input } from 'antd';
import { AxiosError, AxiosResponse } from 'axios';
import { capitalize, isEmpty, isNil, isUndefined } from 'lodash';
import { EditorContentRef, EntityTags } from 'Models';
import React, {
  ChangeEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useHistory, useLocation, useParams } from 'react-router-dom';
import AppState from '../../../AppState';
import { postThread } from '../../../axiosAPIs/feedsAPI';
import ProfilePicture from '../../../components/common/ProfilePicture/ProfilePicture';
import TitleBreadcrumb from '../../../components/common/title-breadcrumb/title-breadcrumb.component';
import { FQN_SEPARATOR_CHAR } from '../../../constants/char.constants';
import { EntityField } from '../../../constants/feed.constants';
import { EntityType } from '../../../enums/entity.enum';
import {
  CreateThread,
  TaskType,
  ThreadType,
} from '../../../generated/api/feed/createThread';
import { getEntityName } from '../../../utils/CommonUtils';
import {
  ENTITY_LINK_SEPARATOR,
  getEntityFeedLink,
} from '../../../utils/EntityUtils';
import { getTagsWithoutTier, getTierTags } from '../../../utils/TableUtils';
import {
  fetchEntityDetail,
  fetchOptions,
  getBreadCrumbList,
  getColumnObject,
  getTaskDetailPath,
} from '../../../utils/TasksUtils';
import { showErrorToast, showSuccessToast } from '../../../utils/ToastUtils';
import Assignees from '../shared/Assignees';
import { DescriptionTabs } from '../shared/DescriptionTabs';
import TaskPageLayout from '../shared/TaskPageLayout';
import { cardStyles } from '../TaskPage.styles';
import { EntityData, Option } from '../TasksPage.interface';

const UpdateDescription = () => {
  const location = useLocation();
  const history = useHistory();

  const markdownRef = useRef<EditorContentRef>();

  const { entityType, entityFQN } = useParams<{ [key: string]: string }>();
  const queryParams = new URLSearchParams(location.search);

  const field = queryParams.get('field');
  const value = queryParams.get('value');

  const [entityData, setEntityData] = useState<EntityData>({} as EntityData);
  const [options, setOptions] = useState<Option[]>([]);
  const [assignees, setAssignees] = useState<Array<Option>>([]);
  const [currentDescription, setCurrentDescription] = useState<string>('');
  const [title, setTitle] = useState<string>('');

  const entityTier = useMemo(() => {
    const tierFQN = getTierTags(entityData.tags || [])?.tagFQN;

    return tierFQN?.split(FQN_SEPARATOR_CHAR)[1];
  }, [entityData.tags]);

  const entityTags = useMemo(() => {
    const tags: EntityTags[] = getTagsWithoutTier(entityData.tags || []) || [];

    return tags.map((tag) => `#${tag.tagFQN}`).join(' ');
  }, [entityData.tags]);

  const getSanitizeValue = value?.replaceAll(/^"|"$/g, '') || '';

  // get current user details
  const currentUser = useMemo(
    () => AppState.getCurrentUserDetails(),
    [AppState.userDetails, AppState.nonSecureUserDetails]
  );

  const message = `Update description for ${getSanitizeValue || entityType}`;

  const back = () => history.goBack();

  const columnObject = useMemo(() => {
    const column = getSanitizeValue.split(FQN_SEPARATOR_CHAR).slice(-1);

    return getColumnObject(column[0], entityData.columns || []);
  }, [field, entityData]);

  const getColumnDetails = useCallback(() => {
    if (!isNil(field) && !isNil(value) && field === EntityField.COLUMNS) {
      return (
        <div data-testid="column-details">
          <p className="tw-font-semibold">Column Details</p>
          <p>
            <span className="tw-text-grey-muted">Type:</span>{' '}
            <span>{columnObject.dataTypeDisplay}</span>
          </p>
          <p>{columnObject?.tags?.map((tag) => `#${tag.tagFQN}`)?.join(' ')}</p>
        </div>
      );
    } else {
      return null;
    }
  }, [entityData.columns]);

  const getDescription = () => {
    if (!isEmpty(columnObject) && !isUndefined(columnObject)) {
      return columnObject.description || '';
    } else {
      return entityData.description || '';
    }
  };

  const onSearch = (query: string) => {
    fetchOptions(query, setOptions);
  };

  const getTaskAbout = () => {
    if (field && value) {
      return `${field}${ENTITY_LINK_SEPARATOR}${value}${ENTITY_LINK_SEPARATOR}description`;
    } else {
      return EntityField.DESCRIPTION;
    }
  };

  const onTitleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { value: newValue } = e.target;
    setTitle(newValue);
  };

  const onCreateTask = () => {
    if (assignees.length) {
      const data: CreateThread = {
        from: currentUser?.name as string,
        message: title || message,
        about: getEntityFeedLink(entityType, entityFQN, getTaskAbout()),
        taskDetails: {
          assignees: assignees.map((assignee) => ({
            id: assignee.value,
            type: assignee.type,
          })),
          suggestion: markdownRef.current?.getEditorContent(),
          type: TaskType.UpdateDescription,
          oldValue: currentDescription,
        },
        type: ThreadType.Task,
      };
      postThread(data)
        .then((res: AxiosResponse) => {
          showSuccessToast('Task Created Successfully');
          history.push(getTaskDetailPath(res.data.task.id));
        })
        .catch((err: AxiosError) => showErrorToast(err));
    } else {
      showErrorToast('Cannot create a task without assignee');
    }
  };

  useEffect(() => {
    fetchEntityDetail(
      entityType as EntityType,
      entityFQN as string,
      setEntityData
    );
  }, [entityFQN, entityType]);

  useEffect(() => {
    const owner = entityData.owner;
    if (owner) {
      const defaultAssignee = [
        {
          label: getEntityName(owner),
          value: owner.id || '',
          type: owner.type,
        },
      ];
      setAssignees(defaultAssignee);
      setOptions(defaultAssignee);
    }
    setTitle(message);
  }, [entityData]);

  useEffect(() => {
    setCurrentDescription(getDescription());
  }, [entityData, columnObject]);

  return (
    <TaskPageLayout>
      <TitleBreadcrumb
        titleLinks={[
          ...getBreadCrumbList(entityData, entityType as EntityType),
          { name: 'Create Task', activeTitle: true, url: '' },
        ]}
      />
      <div className="tw-grid tw-grid-cols-3 tw-gap-x-2">
        <Card
          className="tw-col-span-2"
          key="update-description"
          style={{ ...cardStyles }}
          title="Create Task">
          <div data-testid="title">
            <span>Title:</span>{' '}
            <Input
              placeholder="Task title"
              style={{ margin: '4px 0px' }}
              value={title}
              onChange={onTitleChange}
            />
          </div>
          <div data-testid="assignees">
            <span>Assignees:</span>{' '}
            <Assignees
              assignees={assignees}
              options={options}
              onChange={setAssignees}
              onSearch={onSearch}
            />
          </div>
          {currentDescription && (
            <div data-testid="description-tabs">
              <span>Description:</span>{' '}
              <DescriptionTabs
                description={currentDescription}
                markdownRef={markdownRef}
                suggestion={currentDescription}
              />
            </div>
          )}

          <div className="tw-flex tw-justify-end" data-testid="cta-buttons">
            <Button className="ant-btn-link-custom" type="link" onClick={back}>
              Back
            </Button>
            <Button
              className="ant-btn-primary-custom"
              type="primary"
              onClick={onCreateTask}>
              Submit
            </Button>
          </div>
        </Card>

        <div className="tw-pl-2" data-testid="entity-details">
          <h6 className="tw-text-base">{capitalize(entityType)} Details</h6>
          <div className="tw-flex tw-mb-4">
            <span className="tw-text-grey-muted">Owner:</span>{' '}
            <span>
              {entityData.owner ? (
                <span className="tw-flex tw-ml-1">
                  <ProfilePicture
                    displayName={getEntityName(entityData.owner)}
                    id=""
                    name={getEntityName(entityData.owner)}
                    width="20"
                  />
                  <span className="tw-ml-1">
                    {getEntityName(entityData.owner)}
                  </span>
                </span>
              ) : (
                <span className="tw-text-grey-muted tw-ml-1">No Owner</span>
              )}
            </span>
          </div>

          <p data-testid="tier">
            {entityTier ? (
              entityTier
            ) : (
              <span className="tw-text-grey-muted">No Tier</span>
            )}
          </p>

          <p data-testid="tags">{entityTags}</p>

          {getColumnDetails()}
        </div>
      </div>
    </TaskPageLayout>
  );
};

export default UpdateDescription;
