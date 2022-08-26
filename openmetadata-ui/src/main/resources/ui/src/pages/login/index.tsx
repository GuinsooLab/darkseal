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

import jwtDecode, { JwtPayload } from 'jwt-decode';
import { isEmpty } from 'lodash';
import { observer } from 'mobx-react';
import React, { useEffect, useMemo } from 'react';
import { useHistory } from 'react-router-dom';
import appState from '../../AppState';
import loginBG from '../../assets/img/login-bg.png';
import { useAuthContext } from '../../authentication/auth-provider/AuthProvider';
import Loader from '../../components/Loader/Loader';
import LoginButton from '../../components/LoginButton/LoginButton';
import { oidcTokenKey, ROUTES } from '../../constants/constants';
import { AuthTypes } from '../../enums/signin.enum';
import SVGIcons, { Icons } from '../../utils/SvgUtils';
import LoginCarousel from './LoginCarousel';

const SigninPage = () => {
  const history = useHistory();
  const { isAuthDisabled, authConfig, onLoginHandler, onLogoutHandler } =
    useAuthContext();
  const isAlreadyLoggedIn = useMemo(() => {
    return isAuthDisabled || !isEmpty(appState.userDetails);
  }, [isAuthDisabled, appState.userDetails]);

  const isTokenExpired = () => {
    const token = localStorage.getItem(oidcTokenKey);
    if (token) {
      try {
        const { exp } = jwtDecode<JwtPayload>(token);
        if (exp) {
          if (Date.now() < exp * 1000) {
            // Token is valid
            return false;
          }
        }
      } catch (error) {
        // ignore error
      }
    }

    return true;
  };

  const handleSignIn = () => {
    onLoginHandler && onLoginHandler();
  };

  const getSignInButton = (): JSX.Element => {
    let ssoBrandLogo;
    let ssoBrandName;
    switch (authConfig?.provider) {
      case AuthTypes.GOOGLE: {
        ssoBrandLogo = Icons.GOOGLE_ICON;
        ssoBrandName = 'Google';

        break;
      }
      case AuthTypes.CUSTOM_OIDC: {
        ssoBrandName = authConfig?.providerName
          ? authConfig?.providerName
          : 'SSO';

        break;
      }
      case AuthTypes.OKTA: {
        ssoBrandLogo = Icons.OKTA_ICON;
        ssoBrandName = 'Okta';

        break;
      }
      case AuthTypes.AWS_COGNITO: {
        ssoBrandLogo = Icons.COGNITO_ICON;
        ssoBrandName = 'AWS Cognito';

        break;
      }
      case AuthTypes.AZURE: {
        ssoBrandLogo = Icons.AZURE_ICON;
        ssoBrandName = 'Azure';

        break;
      }
      case AuthTypes.AUTH0: {
        ssoBrandLogo = Icons.AUTH0_ICON;
        ssoBrandName = 'Auth0';

        break;
      }
      // TODO: Add "case AuthTypes.GITHUB after adding support for these SSO
      default: {
        return <div>SSO Provider {authConfig?.provider} is not supported.</div>;
      }
    }

    return (
      <LoginButton
        ssoBrandLogo={ssoBrandLogo}
        ssoBrandName={ssoBrandName}
        onClick={handleSignIn}
      />
    );
  };

  // If user is neither logged in or nor security is disabled
  // invoke logout handler to clean-up any slug storage
  useEffect(() => {
    if (!isAlreadyLoggedIn && isTokenExpired()) {
      onLogoutHandler();
    }
  }, []);

  useEffect(() => {
    if (isAlreadyLoggedIn) {
      history.push(ROUTES.HOME);
    }
  }, [isAlreadyLoggedIn]);

  // If the user is already logged in or if security is disabled
  // redirect the user to the home page.
  if (isAlreadyLoggedIn) {
    return <Loader />;
  }

  return (
    <div className="tw-flex tw-flex-col tw-h-full">
      <div
        className="tw-flex tw-bg-body-main tw-flex-grow"
        data-testid="signin-page">
        <div className="tw-w-5/12">
          <div className="tw-mt-52 tw-text-center">
            <SVGIcons alt="OpenMetadata Logo" icon={Icons.LOGO} width="152" />
            <p className="tw-mt-24 tw-mx-auto tw-text-xl tw-text-grey-muted tw-font-medium tw-w-10/12">
              Centralized Metadata Store, Discover, Collaborate and get your
              Data Right
            </p>
            <div className="tw-mt-24">{getSignInButton()}</div>
          </div>
        </div>
        <div className="tw-w-7/12 tw-relative">
          <div className="tw-absolute tw-inset-0">
            <img
              alt="bg-image"
              className="tw-w-full tw-h-full"
              data-testid="bg-image"
              src={loginBG}
            />
          </div>
          <div className="tw-relative">
            <div className="tw-flex tw-justify-center tw-mt-44 tw-mb-10">
              <LoginCarousel />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default observer(SigninPage);
