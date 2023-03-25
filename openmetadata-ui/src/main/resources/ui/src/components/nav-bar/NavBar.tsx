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

import { Badge, Dropdown, Image, Input, Select, Space, Tooltip } from 'antd';
import { CookieStorage } from 'cookie-storage';
import i18next from 'i18next';
import { debounce, toString } from 'lodash';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';
import { refreshPage } from 'utils/CommonUtils';
import AppState from '../../AppState';
import Logo from '../../assets/svg/logo-monogram.svg';

import {
  NOTIFICATION_READ_TIMER,
  SOCKET_EVENTS,
} from '../../constants/constants';
import {
  hasNotificationPermission,
  shouldRequestPermission,
} from '../../utils/BrowserNotificationUtils';
import {
  getEntityFQN,
  getEntityType,
  prepareFeedLink,
} from '../../utils/FeedUtils';
import {
  languageSelectOptions,
  SupportedLocales,
} from '../../utils/i18next/i18nextUtil';
import {
  inPageSearchOptions,
  isInPageSearchAllowed,
} from '../../utils/RouterUtils';
import SVGIcons, { Icons } from '../../utils/SvgUtils';
import { getTaskDetailPath } from '../../utils/TasksUtils';
import SearchOptions from '../app-bar/SearchOptions';
import Suggestions from '../app-bar/Suggestions';
import Avatar from '../common/avatar/Avatar';
import CmdKIcon from '../common/CmdKIcon/CmdKIcon.component';
import LegacyDropDown from '../dropdown/DropDown';
import NotificationBox from '../NotificationBox/NotificationBox.component';
import { useWebSocketConnector } from '../web-scoket/web-scoket.provider';
import { NavBarProps } from './NavBar.interface';

const cookieStorage = new CookieStorage();

const NavBar = ({
  supportDropdown,
  profileDropdown,
  searchValue,
  isTourRoute = false,
  pathname,
  username,
  isSearchBoxOpen,
  handleSearchBoxOpen,
  handleSearchChange,
  handleKeyDown,
  handleOnClick,
}: NavBarProps) => {
  // get current user details
  const currentUser = useMemo(
    () => AppState.getCurrentUserDetails(),
    [AppState.userDetails, AppState.nonSecureUserDetails]
  );
  const history = useHistory();
  const { t } = useTranslation();
  const [searchIcon, setSearchIcon] = useState<string>('icon-searchv1');
  const [suggestionSearch, setSuggestionSearch] = useState<string>('');
  const [hasTaskNotification, setHasTaskNotification] =
    useState<boolean>(false);
  const [hasMentionNotification, setHasMentionNotification] =
    useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('Task');
  const [isImgUrlValid, setIsImgUrlValid] = useState<boolean>(true);

  const profilePicture = useMemo(
    () => currentUser?.profile?.images?.image512,
    [currentUser]
  );

  const [language, setLanguage] = useState(
    cookieStorage.getItem('i18next') || SupportedLocales.English
  );

  const { socket } = useWebSocketConnector();

  const debouncedOnChange = useCallback(
    (text: string): void => {
      setSuggestionSearch(text);
    },
    [setSuggestionSearch]
  );

  const debounceOnSearch = useCallback(debounce(debouncedOnChange, 400), [
    debouncedOnChange,
  ]);

  const handleTaskNotificationRead = () => {
    setHasTaskNotification(false);
  };

  const handleMentionsNotificationRead = () => {
    setHasMentionNotification(false);
  };

  const handleBellClick = useCallback(
    (visible: boolean) => {
      if (visible) {
        switch (activeTab) {
          case 'Task':
            hasTaskNotification &&
              setTimeout(() => {
                handleTaskNotificationRead();
              }, NOTIFICATION_READ_TIMER);

            break;

          case 'Conversation':
            hasMentionNotification &&
              setTimeout(() => {
                handleMentionsNotificationRead();
              }, NOTIFICATION_READ_TIMER);

            break;
        }
      }
    },
    [hasTaskNotification]
  );

  const handleActiveTab = (key: string) => {
    setActiveTab(key);
  };

  const showBrowserNotification = (
    about: string,
    createdBy: string,
    type: string,
    id?: string
  ) => {
    if (!hasNotificationPermission()) {
      return;
    }
    const entityType = getEntityType(about);
    const entityFQN = getEntityFQN(about);
    let body;
    let path: string;
    switch (type) {
      case 'Task':
        body = t('message.user-assign-new-task', {
          user: createdBy,
        });
        path = getTaskDetailPath(toString(id)).pathname;

        break;
      case 'Conversation':
        body = t('message.user-mentioned-in-comment', {
          user: createdBy,
        });
        path = prepareFeedLink(entityType as string, entityFQN as string);
    }
    const notification = new Notification('Notification From Darkseal', {
      body: body,
      icon: Logo,
    });
    notification.onclick = () => {
      const isChrome = window.navigator.userAgent.indexOf('Chrome');
      // Applying logic to open a new window onclick of browser notification from chrome
      // As it does not open the concerned tab by default.
      if (isChrome > -1) {
        window.open(path);
      } else {
        history.push(path);
      }
    };
  };

  useEffect(() => {
    if (shouldRequestPermission()) {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on(SOCKET_EVENTS.TASK_CHANNEL, (newActivity) => {
        if (newActivity) {
          const activity = JSON.parse(newActivity);
          setHasTaskNotification(true);
          showBrowserNotification(
            activity.about,
            activity.createdBy,
            activity.type,
            activity.task?.id
          );
        }
      });

      socket.on(SOCKET_EVENTS.MENTION_CHANNEL, (newActivity) => {
        if (newActivity) {
          const activity = JSON.parse(newActivity);
          setHasMentionNotification(true);
          showBrowserNotification(
            activity.about,
            activity.createdBy,
            activity.type,
            activity.task?.id
          );
        }
      });
    }

    return () => {
      socket && socket.off(SOCKET_EVENTS.TASK_CHANNEL);
      socket && socket.off(SOCKET_EVENTS.MENTION_CHANNEL);
    };
  }, [socket]);

  useEffect(() => {
    if (profilePicture) {
      setIsImgUrlValid(true);
    }
  }, [profilePicture]);

  const handleLanguageChange = useCallback((langCode: string) => {
    setLanguage(langCode);
    i18next.changeLanguage(langCode);
    refreshPage();
  }, []);

  const handleOnImageError = useCallback(() => {
    setIsImgUrlValid(false);
  }, []);

  const handleSelectOption = useCallback(
    (text) => {
      AppState.inPageSearchText = text;
    },
    [AppState]
  );

  return (
    <>
      <div
        className="tw-h-16 tw-border-separator tw-bg-white"
        style={{
          height: '48px',
          paddingTop: '5px',
          paddingBottom: '5px',
          borderBottom: '1px solid #dde3ea',
        }}>
        <div className="tw-flex tw-items-center tw-flex-row tw-justify-between tw-flex-nowrap tw-px-6">
          <div className="tw-flex tw-items-center tw-flex-row tw-justify-between tw-flex-nowrap">
            <Space className="tw-ml-16 flex-none" size={16} />
          </div>
          <div
            className="tw-flex-none tw-relative tw-justify-items-center tw-ml-16"
            data-testid="appbar-item">
            <Input
              autoComplete="off"
              className="tw-relative search-grey hover:tw-outline-none focus:tw-outline-none tw-pl-2 tw-pt-2 tw-pb-1.5 tw-ml-4 tw-z-41 rounded-4"
              data-testid="searchBox"
              id="searchBox"
              placeholder={t('message.search-for-entity-types')}
              style={{
                boxShadow: 'none',
                height: '37px',
                marginLeft: '200px',
              }}
              suffix={
                <span
                  className="tw-flex tw-items-center"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleOnClick();
                  }}>
                  <CmdKIcon />
                  <span className="tw-cursor-pointer tw-mb-2 tw-ml-3 tw-w-4 tw-h-4 tw-text-center">
                    <SVGIcons alt="icon-search" icon={searchIcon} />
                  </span>
                </span>
              }
              type="text"
              value={searchValue}
              onBlur={() => setSearchIcon('icon-searchv1')}
              onChange={(e) => {
                const { value } = e.target;
                debounceOnSearch(value);
                handleSearchChange(value);
              }}
              onFocus={() => setSearchIcon('icon-searchv1color')}
              onKeyDown={handleKeyDown}
            />
            {!isTourRoute &&
              searchValue &&
              (isInPageSearchAllowed(pathname) ? (
                <SearchOptions
                  isOpen={isSearchBoxOpen}
                  options={inPageSearchOptions(pathname)}
                  searchText={searchValue}
                  selectOption={handleSelectOption}
                  setIsOpen={handleSearchBoxOpen}
                />
              ) : (
                <Suggestions
                  isOpen={isSearchBoxOpen}
                  searchText={suggestionSearch}
                  setIsOpen={handleSearchBoxOpen}
                />
              ))}
          </div>
          <Space className="tw-ml-auto">
            <Space size={16}>
              <Select
                bordered={false}
                options={languageSelectOptions}
                value={language}
                onChange={handleLanguageChange}
              />
              <button className="focus:tw-no-underline hover:tw-underline tw-flex-shrink-0 ">
                <Dropdown
                  destroyPopupOnHide
                  dropdownRender={() => (
                    <NotificationBox
                      hasMentionNotification={hasMentionNotification}
                      hasTaskNotification={hasTaskNotification}
                      onMarkMentionsNotificationRead={
                        handleMentionsNotificationRead
                      }
                      onMarkTaskNotificationRead={handleTaskNotificationRead}
                      onTabChange={handleActiveTab}
                    />
                  )}
                  overlayStyle={{
                    zIndex: 9999,
                    width: '425px',
                    minHeight: '375px',
                  }}
                  placement="bottomRight"
                  trigger={['click']}
                  onOpenChange={handleBellClick}>
                  <Badge dot={hasTaskNotification || hasMentionNotification}>
                    <SVGIcons
                      alt="Alert bell icon"
                      icon={Icons.ALERT_BELL}
                      width="18"
                    />
                  </Badge>
                </Dropdown>
              </button>
              <div className="tw-flex tw-flex-shrink-0 tw--ml-2 tw-items-center ">
                <LegacyDropDown
                  dropDownList={supportDropdown}
                  icon={
                    <SVGIcons
                      alt="Doc icon"
                      className="tw-align-middle tw-mt-0.5 tw-mr-1"
                      icon={Icons.HELP_CIRCLE}
                      width="18"
                    />
                  }
                  isDropDownIconVisible={false}
                  isLableVisible={false}
                  label="Need Help"
                  type="link"
                />
              </div>
            </Space>
            <div data-testid="dropdown-profile">
              <LegacyDropDown
                dropDownList={profileDropdown}
                icon={
                  <Tooltip placement="bottom" title="Profile" trigger="hover">
                    {isImgUrlValid ? (
                      <div className="profile-image square tw--mr-2">
                        <Image
                          alt="user"
                          preview={false}
                          referrerPolicy="no-referrer"
                          src={profilePicture || ''}
                          onError={handleOnImageError}
                        />
                      </div>
                    ) : (
                      <Avatar name={username} width="30" />
                    )}
                  </Tooltip>
                }
                isDropDownIconVisible={false}
                type="link"
              />
            </div>
          </Space>
        </div>
      </div>
    </>
  );
};

export default NavBar;
