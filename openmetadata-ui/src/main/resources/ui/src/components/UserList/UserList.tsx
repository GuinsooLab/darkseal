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

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { compare, Operation } from 'fast-json-patch';
import { isUndefined, toLower } from 'lodash';
import React, { Fragment, FunctionComponent, useEffect, useState } from 'react';
import PageLayout from '../../components/containers/PageLayout';
import Loader from '../../components/Loader/Loader';
import { TITLE_FOR_NON_ADMIN_ACTION } from '../../constants/constants';
import { UserType } from '../../enums/user.enum';
import { Role } from '../../generated/entity/teams/role';
import { Team } from '../../generated/entity/teams/team';
import { User } from '../../generated/entity/teams/user';
import { EntityReference } from '../../generated/type/entityReference';
import { getCountBadge, getEntityName } from '../../utils/CommonUtils';
import { getActiveUsers } from '../../utils/TeamUtils';
import { Button } from '../buttons/Button/Button';
import ErrorPlaceHolder from '../common/error-with-placeholder/ErrorPlaceHolder';
import NonAdminAction from '../common/non-admin-action/NonAdminAction';
import Searchbar from '../common/searchbar/Searchbar';
import ConfirmationModal from '../Modals/ConfirmationModal/ConfirmationModal';
import UserDetailsModal from '../Modals/UserDetailsModal/UserDetailsModal';
import UserDataCard from '../UserDataCard/UserDataCard';

interface Props {
  teams: Array<Team>;
  roles: Array<Role>;
  allUsers: Array<User>;
  deleteUser: (id: string) => void;
  updateUser: (id: string, data: Operation[], updatedUser: User) => void;
  handleAddUserClick: () => void;
  isLoading: boolean;
}

interface DeleteUserInfo {
  name: string;
  id: string;
}

const UserList: FunctionComponent<Props> = ({
  allUsers = [],
  isLoading,
  deleteUser,
  updateUser,
  handleAddUserClick,
  teams = [],
  roles = [],
}: Props) => {
  const [userList, setUserList] = useState<Array<User>>(allUsers);
  const [users, setUsers] = useState<Array<User>>([]);
  const [admins, setAdmins] = useState<Array<User>>([]);
  const [bots, setBots] = useState<Array<User>>([]);
  const [currentTeam, setCurrentTeam] = useState<Team>();
  const [currentTab, setCurrentTab] = useState<number>(1);
  const [selectedUser, setSelectedUser] = useState<User>();
  const [searchText, setSearchText] = useState('');
  const [deletingUser, setDeletingUser] = useState<DeleteUserInfo>();

  const handleSearchAction = (searchValue: string) => {
    setSearchText(searchValue);
  };

  const isIncludes = (name: string) => {
    return toLower(name).includes(toLower(searchText));
  };

  const setCurrentTabList = (tab: number) => {
    switch (tab) {
      case 2:
        setAdmins(
          userList.filter(
            (user) => user.isAdmin && isIncludes(user.displayName || user.name)
          )
        );

        break;

      case 3:
        setBots(
          userList.filter(
            (user) => user.isBot && isIncludes(user.displayName || user.name)
          )
        );

        break;
      case 1:
      default:
        setUsers(
          userList.filter(
            (user) => !user.isBot && isIncludes(user.displayName || user.name)
          )
        );

        break;
    }
  };

  const setAllTabList = () => {
    setUsers(userList.filter((user) => !user.isBot));
    setAdmins(userList.filter((user) => user.isAdmin));
    setBots(userList.filter((user) => user.isBot));
  };

  const selectTeam = (team?: Team) => {
    setCurrentTeam(team);
    if (team) {
      const userIds = (team.users || []).map((userData) => userData.id);
      const filteredUsers = allUsers.filter((user) =>
        userIds.includes(user.id)
      );
      setUserList(filteredUsers);
    } else {
      setUserList(allUsers);
    }
  };

  const selectUser = (id: string) => {
    const user = userList.find((user) => user.id === id);
    if (user) {
      setSelectedUser(user);
    } else {
      setSelectedUser(undefined);
    }
  };

  const getCurrentTeamClass = (name?: string) => {
    if ((!name && !currentTeam) || currentTeam?.name === name) {
      return 'tw-text-primary tw-font-medium';
    } else {
      return '';
    }
  };

  const isTeamBadgeActive = (name?: string) => {
    return (!name && !currentTeam) || currentTeam?.name === name;
  };

  const getActiveTabClass = (tab: number) => {
    return tab === currentTab ? 'active' : '';
  };

  const handleSave = (rolesData: Array<string>) => {
    if (selectedUser) {
      const updatedData: User = {
        ...selectedUser,
        isAdmin: Boolean(rolesData.find((role) => role === 'admin')),
        roles: roles
          .filter((role) => rolesData.includes(role.id))
          .map((role) => ({
            id: role.id,
            type: 'role',
            href: role.href,
            displayName: role.displayName,
          })),
      };
      const jsonPatch = compare(selectedUser, updatedData);
      updateUser(selectedUser.id, jsonPatch, updatedData);

      setSelectedUser(undefined);
    }
  };

  const handleDeleteUser = (id: string, name: string) => {
    setDeletingUser({
      name,
      id,
    });
  };

  const onConfirmDeleteUser = (id: string) => {
    deleteUser(id);
    setDeletingUser(undefined);
  };

  const handleTabChange = (tab: number) => {
    setSearchText('');
    setCurrentTab(tab);
    setAllTabList();
  };

  const getTabs = () => {
    return (
      <div className="tw-mb-3 ">
        <nav
          className="tw-flex tw-flex-row tw-gh-tabs-container"
          data-testid="tabs">
          <div className="tw-w-8/12">
            <button
              className={`tw-pb-2 tw-px-4 tw-gh-tabs ${getActiveTabClass(1)}`}
              data-testid="users"
              onClick={() => {
                handleTabChange(1);
              }}>
              Users
              {getCountBadge(users.length, '', currentTab === 1)}
            </button>
            <button
              className={`tw-pb-2 tw-px-4 tw-gh-tabs ${getActiveTabClass(2)}`}
              data-testid="assets"
              onClick={() => {
                handleTabChange(2);
              }}>
              Admins
              {getCountBadge(admins.length, '', currentTab === 2)}
            </button>
            <button
              className={`tw-pb-2 tw-px-4 tw-gh-tabs ${getActiveTabClass(3)}`}
              data-testid="assets"
              onClick={() => {
                handleTabChange(3);
              }}>
              Bots
              {getCountBadge(bots.length, '', currentTab === 3)}
            </button>
          </div>
          <div className="tw-w-4/12 tw-pt-2">
            <Searchbar
              removeMargin
              placeholder="Search for user..."
              searchValue={searchText}
              typingInterval={500}
              onSearch={handleSearchAction}
            />
          </div>
        </nav>
      </div>
    );
  };

  useEffect(() => {
    setAllTabList();
  }, [userList]);

  useEffect(() => {
    if (currentTeam) {
      const userIds = (currentTeam.users || []).map((userData) => userData.id);
      const filteredUsers = allUsers.filter((user) =>
        userIds.includes(user.id)
      );
      setUserList(filteredUsers);
    } else {
      setUserList(allUsers);
    }
  }, [allUsers]);

  useEffect(() => {
    setCurrentTabList(currentTab);
  }, [searchText]);

  const getLeftPanel = () => {
    return (
      <Fragment>
        <div className="tw-flex tw-justify-between tw-items-center tw-pt-2 tw-border-b">
          <h6 className="tw-heading tw-text-base">Users</h6>
          <NonAdminAction position="bottom" title={TITLE_FOR_NON_ADMIN_ACTION}>
            <Button
              className="tw-h-7 tw-px-2 tw-mb-3"
              data-testid="add-teams"
              size="small"
              theme="primary"
              variant="contained"
              onClick={handleAddUserClick}>
              <FontAwesomeIcon icon="plus" />
            </Button>
          </NonAdminAction>
        </div>

        <div className="tw-mt-5">
          <div
            className="tw-flex tw-items-center tw-justify-between tw-mb-2 tw-cursor-pointer"
            onClick={() => {
              selectTeam();
            }}>
            <div
              className={`tw-group tw-text-grey-body tw-text-body tw-flex tw-justify-between ${getCurrentTeamClass()}`}>
              <p className="tw-text-center tag-category tw-self-center">
                All Users
              </p>
            </div>
            {getCountBadge(allUsers.length || 0, '', isTeamBadgeActive())}
          </div>
          {teams &&
            teams.map((team: Team) => (
              <div
                className="tw-flex tw-items-center tw-justify-between tw-mb-2 tw-cursor-pointer"
                key={team.name}
                onClick={() => {
                  selectTeam(team);
                  setSearchText('');
                }}>
                <div
                  className={`tw-group tw-text-grey-body tw-text-body tw-flex tw-justify-between ${getCurrentTeamClass(
                    team.name
                  )}`}>
                  <p
                    className="tag-category tw-self-center tw-truncate tw-w-48"
                    title={team.displayName}>
                    {team.displayName}
                  </p>
                </div>
                {getCountBadge(
                  getActiveUsers(team.users).length,
                  '',
                  isTeamBadgeActive(team.name)
                )}
              </div>
            ))}
        </div>
      </Fragment>
    );
  };

  const getUserCards = (type: UserType) => {
    let listUserData: Array<User> = [];

    switch (type) {
      case UserType.ADMINS:
        listUserData = admins;

        break;
      case UserType.BOTS:
        listUserData = bots;

        break;
      case UserType.USERS:
      default:
        listUserData = users;

        break;
    }

    return (
      <>
        <div
          className="tw-grid xxl:tw-grid-cols-3 lg:tw-grid-cols-2 tw-gap-4"
          data-testid="user-card-container">
          {listUserData.map((user, index) => {
            const User = {
              displayName: getEntityName(user as unknown as EntityReference),
              name: user.name || '',
              id: user.id,
              email: user.email || '',
              isActiveUser: !user.deleted,
              profilePhoto: user.profile?.images?.image || '',
              teamCount:
                user.teams && user.teams?.length
                  ? user.teams
                      ?.map((team) => team.displayName ?? team.name)
                      ?.join(', ')
                  : 'No teams',
            };

            return (
              <div
                className="tw-cursor-pointer"
                key={index}
                onClick={() => selectUser(User.id)}>
                <UserDataCard
                  item={User}
                  onClick={selectUser}
                  onDelete={handleDeleteUser}
                />
              </div>
            );
          })}
        </div>
      </>
    );
  };

  return (
    <PageLayout leftPanel={allUsers.length > 0 && getLeftPanel()}>
      <>
        {!isLoading ? (
          <>
            {allUsers.length === 0 ? (
              <ErrorPlaceHolder>
                <p className="w-text-lg tw-text-center">No Users Added.</p>
              </ErrorPlaceHolder>
            ) : (
              <>
                {getTabs()}
                {currentTab === 1 && getUserCards(UserType.USERS)}
                {currentTab === 2 && getUserCards(UserType.ADMINS)}
                {currentTab === 3 && getUserCards(UserType.BOTS)}
                {!isUndefined(selectedUser) && (
                  <UserDetailsModal
                    header="Update user"
                    roles={roles}
                    userData={selectedUser}
                    onCancel={() => setSelectedUser(undefined)}
                    onSave={handleSave}
                  />
                )}
                {!isUndefined(deletingUser) && (
                  <ConfirmationModal
                    bodyText={`Are you sure you want to delete ${deletingUser.name}?`}
                    cancelText="Cancel"
                    confirmText="Confirm"
                    header="Delete user"
                    onCancel={() => setDeletingUser(undefined)}
                    onConfirm={() => {
                      onConfirmDeleteUser(deletingUser.id);
                    }}
                  />
                )}
              </>
            )}
          </>
        ) : (
          <Loader />
        )}
      </>
    </PageLayout>
  );
};

export default UserList;
