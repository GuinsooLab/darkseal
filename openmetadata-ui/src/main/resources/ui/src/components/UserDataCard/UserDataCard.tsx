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
import { isNil } from 'lodash';
import React from 'react';
import SVGIcons, { Icons } from '../../utils/SvgUtils';
import NonAdminAction from '../common/non-admin-action/NonAdminAction';
import ProfilePicture from '../common/ProfilePicture/ProfilePicture';

export type Item = {
  displayName: string;
  name: string;
  id?: string;
  email: string;
  isActiveUser?: boolean;
  profilePhoto?: string;
  teamCount?: string | JSX.Element;
};

export type Props = {
  item: Item;
  showTeams?: boolean;
  onClick?: (value: string) => void;
  onDelete?: (id: string, name: string) => void;
};

const UserDataCard = ({ item, onClick, onDelete, showTeams = true }: Props) => {
  return (
    <div
      className="tw-card tw-flex tw-justify-between tw-py-2 tw-px-3 tw-group"
      data-testid="user-card-container">
      <div className="tw-flex tw-gap-1">
        <ProfilePicture
          displayName={item.displayName}
          id={item.id || ''}
          name={item.name || ''}
        />

        <div
          className="tw-flex tw-flex-col tw-flex-1 tw-pl-2"
          data-testid="data-container">
          <div className="tw-flex tw-justify-between">
            <p
              className={classNames('tw-font-normal', {
                'tw-cursor-pointer hover:tw-underline': Boolean(onClick),
              })}
              onClick={() => {
                onClick?.(item.name);
              }}>
              {item.displayName}
            </p>
            {!item.isActiveUser && (
              <span className="tw-text-xs tw-bg-badge tw-border tw-px-2 tw-py-0.5 tw-rounded">
                Inactive
              </span>
            )}
          </div>
          <p className="tw-truncate">{item.email}</p>
          {showTeams && <div>Teams: {item.teamCount}</div>}
        </div>
      </div>
      {!isNil(onDelete) && (
        <div className="tw-flex-none">
          <NonAdminAction
            position="bottom"
            title="You do not have permission to delete user.">
            <span
              className="tw-h-8 tw-rounded tw-mb-3"
              data-testid="remove"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDelete?.(item.id as string, item.displayName);
              }}>
              <SVGIcons
                alt="delete"
                className="tw-cursor-pointer tw-opacity-0 group-hover:tw-opacity-100"
                icon={Icons.DELETE}
                title="Delete"
                width="16px"
              />
            </span>
          </NonAdminAction>
        </div>
      )}
    </div>
  );
};

export default UserDataCard;
