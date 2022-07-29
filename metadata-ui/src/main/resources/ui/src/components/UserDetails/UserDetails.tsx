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

import { isUndefined } from 'lodash';
import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { getUserPath, PAGE_SIZE_BASE } from '../../constants/constants';
import { EntityReference, User } from '../../generated/entity/teams/user';
import { Paging } from '../../generated/type/paging';
import { getEntityName } from '../../utils/CommonUtils';
import DeleteWidgetModal from '../common/DeleteWidget/DeleteWidgetModal';
import ErrorPlaceHolder from '../common/error-with-placeholder/ErrorPlaceHolder';
import NextPrevious from '../common/next-previous/NextPrevious';
import PopOver from '../common/popover/PopOver';
import Searchbar from '../common/searchbar/Searchbar';
import Loader from '../Loader/Loader';
import UserDataCard from '../UserDataCard/UserDataCard';

export type UserDetailsProps = {
  selectedUserList: User[];
  handleUserSearchTerm: (value: string) => void;
  userSearchTerm: string;
  isUsersLoading: boolean;
  currentUserPage: number;
  userPaging: Paging;
  userPagingHandler: (
    cursorValue: string | number,
    activePage?: number
  ) => void;
  handleDeleteUser: () => void;
};

interface DeleteUserInfo {
  name: string;
  id: string;
}

const UserDetails = ({
  selectedUserList,
  userSearchTerm,
  isUsersLoading,
  currentUserPage,
  userPaging,
  userPagingHandler,
  handleDeleteUser,
  handleUserSearchTerm,
}: UserDetailsProps) => {
  const history = useHistory();
  const [deletingUser, setDeletingUser] = useState<DeleteUserInfo>();

  const handleDeleteUserModal = (id: string, name: string) => {
    setDeletingUser({
      name,
      id,
    });
  };

  /**
   * Redirects user to profile page.
   * @param name user name
   */
  const handleUserRedirection = (name: string) => {
    history.push(getUserPath(name));
  };

  const onConfirmDeleteUser = () => {
    handleDeleteUser();
    setDeletingUser(undefined);
  };

  const getTeamsText = (teams: EntityReference[]) => {
    return teams.length > 1 ? (
      <span>
        {getEntityName(teams[0])}, &{' '}
        <PopOver
          html={
            <span>
              {teams.map((t, i) => {
                return i >= 1 ? (
                  <span className="tw-block tw-text-left" key={i}>
                    {getEntityName(t)}
                  </span>
                ) : null;
              })}
            </span>
          }
          position="bottom"
          theme="light"
          trigger="mouseenter">
          <span className="tw-underline tw-cursor-pointer">
            {teams.length - 1} more
          </span>
        </PopOver>
      </span>
    ) : (
      `${getEntityName(teams[0])}`
    );
  };

  const getUserCards = () => {
    return isUsersLoading ? (
      <Loader />
    ) : (
      <div>
        {selectedUserList.length > 0 ? (
          <div
            className="tw-grid xxl:tw-grid-cols-3 lg:tw-grid-cols-2 tw-gap-4"
            data-testid="user-container">
            {selectedUserList.map((user, index) => {
              const User = {
                displayName: getEntityName(user as unknown as EntityReference),
                name: user.name || '',
                id: user.id,
                email: user.email || '',
                isActiveUser: !user.deleted,
                profilePhoto: user.profile?.images?.image || '',
                teamCount:
                  user.teams && user.teams.length
                    ? getTeamsText(user.teams)
                    : 'No teams',
              };

              return (
                <div key={index}>
                  <UserDataCard
                    item={User}
                    onClick={handleUserRedirection}
                    onDelete={handleDeleteUserModal}
                  />
                </div>
              );
            })}
          </div>
        ) : (
          <ErrorPlaceHolder>
            <p>No user available</p>
          </ErrorPlaceHolder>
        )}
      </div>
    );
  };

  return (
    <div>
      <div className="tw-flex tw-justify-between tw-items-center tw-mb-3">
        <div className="tw-w-4/12">
          <Searchbar
            removeMargin
            placeholder="Search for user..."
            searchValue={userSearchTerm}
            typingInterval={500}
            onSearch={handleUserSearchTerm}
          />
        </div>
      </div>
      {getUserCards()}
      {userPaging.total > PAGE_SIZE_BASE && (
        <NextPrevious
          currentPage={currentUserPage}
          isNumberBased={Boolean(userSearchTerm)}
          pageSize={PAGE_SIZE_BASE}
          paging={userPaging}
          pagingHandler={userPagingHandler}
          totalCount={userPaging.total}
        />
      )}

      <DeleteWidgetModal
        afterDeleteAction={onConfirmDeleteUser}
        entityId={deletingUser?.id || ''}
        entityName={deletingUser?.name || ''}
        entityType="user"
        visible={!isUndefined(deletingUser)}
        onCancel={() => setDeletingUser(undefined)}
      />
    </div>
  );
};

export default UserDetails;
