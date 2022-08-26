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

import { AxiosError, AxiosResponse } from 'axios';
import { CookieStorage } from 'cookie-storage';
import { UserProfile } from 'Models';
import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import appState from '../../AppState';
import { getLoggedInUserPermissions } from '../../axiosAPIs/miscAPI';
import { createUser } from '../../axiosAPIs/userAPI';
import { Button } from '../../components/buttons/Button/Button';
import PageContainer from '../../components/containers/PageContainer';
import TeamsSelectable from '../../components/TeamsSelectable/TeamsSelectable';
import { REDIRECT_PATHNAME, ROUTES } from '../../constants/constants';
import jsonData from '../../jsons/en';
import { getNameFromEmail } from '../../utils/AuthProvider.util';
import { getImages } from '../../utils/CommonUtils';
import SVGIcons, { Icons } from '../../utils/SvgUtils';
import { showErrorToast } from '../../utils/ToastUtils';
import { fetchAllUsers } from '../../utils/UserDataUtils';

const cookieStorage = new CookieStorage();

const Signup = () => {
  const [selectedTeams, setSelectedTeams] = useState<Array<string | undefined>>(
    []
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [details, setDetails] = useState({
    displayName: appState.newUser.name || '',
    name: getNameFromEmail(appState.newUser.email),
    email: appState.newUser.email || '',
  });

  const history = useHistory();

  const getUserPermissions = () => {
    getLoggedInUserPermissions()
      .then((res: AxiosResponse) => {
        if (res.data) {
          appState.updateUserPermissions(res.data.metadataOperations);
        } else {
          throw jsonData['api-error-messages']['unexpected-server-response'];
        }
      })
      .catch((err: AxiosError) => {
        showErrorToast(
          err,
          jsonData['api-error-messages']['fetch-user-permission-error']
        );
      });
  };

  const createNewUser = (details: {
    [name: string]: string | Array<string> | UserProfile;
  }) => {
    setLoading(true);
    createUser(details)
      .then((res) => {
        if (res.data) {
          appState.updateUserDetails(res.data);
          fetchAllUsers();
          getUserPermissions();
          cookieStorage.removeItem(REDIRECT_PATHNAME);
          history.push(ROUTES.HOME);
        } else {
          setLoading(false);
        }
      })
      .catch((err: AxiosError) => {
        showErrorToast(
          err,
          jsonData['api-error-messages']['create-user-error']
        );
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const onChangeHadler = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.persist();
    setDetails((prevState) => {
      return {
        ...prevState,
        [e.target.name]: e.target.value,
      };
    });
  };

  const onSubmitHandler = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (details.name && details.displayName) {
      createNewUser({
        ...details,
        teams: selectedTeams as Array<string>,
        profile: {
          images: getImages(appState.newUser.picture ?? ''),
        },
      });
    }
  };

  return (
    <>
      {!loading && (
        <PageContainer>
          <div className="tw-h-screen tw-flex tw-justify-center">
            <div className="tw-flex tw-flex-col tw-items-center signup-box">
              <div className="tw-flex tw-justify-center tw-items-center tw-my-7">
                <SVGIcons
                  alt="OpenMetadata Logo"
                  icon={Icons.LOGO_SMALL}
                  width="50"
                />
              </div>
              <div className="tw-mb-7">
                <h4 className="tw-font-semibold">
                  Join <span className="tw-text-primary">OpenMetadata</span>
                </h4>
              </div>
              <div className="tw-px-8 tw-w-full">
                <form action="." method="POST" onSubmit={onSubmitHandler}>
                  <div className="tw-mb-4">
                    <label
                      className="tw-block tw-text-body tw-text-grey-body tw-mb-2 required-field"
                      htmlFor="displayName">
                      Full name
                    </label>
                    <input
                      required
                      autoComplete="off"
                      className="tw-appearance-none tw-border tw-border-main  
                tw-rounded tw-w-full tw-py-2 tw-px-3 tw-text-grey-body  tw-leading-tight 
                focus:tw-outline-none focus:tw-border-focus hover:tw-border-hover tw-h-10"
                      id="displayName"
                      name="displayName"
                      placeholder="Your Full name"
                      type="text"
                      value={details.displayName}
                      onChange={onChangeHadler}
                    />
                  </div>
                  <div className="tw-mb-4">
                    <label
                      className="tw-block tw-text-body tw-text-grey-body tw-mb-2 required-field"
                      htmlFor="name">
                      Username
                    </label>
                    <input
                      readOnly
                      required
                      autoComplete="off"
                      className="tw-cursor-not-allowed tw-appearance-none tw-border tw-border-main tw-rounded tw-bg-gray-100
                    tw-w-full tw-py-2 tw-px-3 tw-text-grey-body tw-leading-tight focus:tw-outline-none focus:tw-border-focus hover:tw-border-hover tw-h-10"
                      id="name"
                      name="name"
                      placeholder="Username"
                      type="text"
                      value={details.name}
                      onChange={onChangeHadler}
                    />
                  </div>
                  <div className="tw-mb-4">
                    <label
                      className="tw-block tw-text-body tw-text-grey-body tw-mb-2 required-field"
                      htmlFor="email">
                      Email
                    </label>
                    <input
                      readOnly
                      required
                      autoComplete="off"
                      className="tw-cursor-not-allowed tw-appearance-none tw-border tw-border-main tw-rounded tw-bg-gray-100
                    tw-w-full tw-py-2 tw-px-3 tw-text-grey-body tw-leading-tight focus:tw-outline-none focus:tw-border-focus hover:tw-border-hover tw-h-10"
                      id="email"
                      name="email"
                      placeholder="Your email address"
                      type="email"
                      value={details.email}
                      onChange={onChangeHadler}
                    />
                  </div>
                  <div className="tw-mb-4">
                    <label className="tw-block tw-text-body tw-text-grey-body tw-mb-2">
                      Select teams
                    </label>
                    <TeamsSelectable
                      filterJoinable
                      showTeamsAlert
                      onSelectionChange={setSelectedTeams}
                    />
                  </div>
                  <div className="tw-flex tw-my-7 tw-justify-end">
                    <Button
                      className="tw-text-white 
                       tw-text-sm tw-py-2 tw-px-4 tw-font-semibold tw-rounded tw-h-10 tw-justify-self-end"
                      size="regular"
                      theme="primary"
                      type="submit"
                      variant="contained">
                      Create
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </PageContainer>
      )}
      {loading && (
        <p className="tw-text-center tw-text-grey-body tw-h3 tw-flex tw-justify-center tw-items-center">
          Creating Account ....
        </p>
      )}
    </>
  );
};

export default Signup;
