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

import Appbar from 'components/app-bar/Appbar';
import ApplicationConfigProvider from 'components/ApplicationConfigProvider/ApplicationConfigProvider';
import {
  AuthProvider,
  useAuthContext,
} from 'components/authentication/auth-provider/AuthProvider';
import ErrorBoundry from 'components/ErrorBoundry/ErrorBoundry';
import GlobalSearchProvider from 'components/GlobalSearchProvider/GlobalSearchProvider';
import PermissionProvider from 'components/PermissionProvider/PermissionProvider';
import AppRouter from 'components/router/AppRouter';
import WebSocketProvider from 'components/web-scoket/web-scoket.provider';
import WebAnalyticsProvider from 'components/WebAnalytics/WebAnalyticsProvider';
import { TOAST_OPTIONS } from 'constants/Toasts.constants';
import React, { FunctionComponent, useEffect } from 'react';
import { HelmetProvider } from 'react-helmet-async';
import { I18nextProvider } from 'react-i18next';
import { BrowserRouter as Router, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.min.css';
import SVGIcons, { Icons } from './utils/SvgUtils';
import { ROUTES } from './constants/constants';
import i18n from 'utils/i18next/LocalUtil';
import { useAnalytics } from 'use-analytics';
import { isProtectedRoute } from './utils/AuthProvider.util';

const AppNavs = () => {
  const location = useLocation();

  // web analytics instance
  const analytics = useAnalytics();

  const { isAuthenticated } = useAuthContext();

  useEffect(() => {
    const { pathname } = location;

    /**
     * Ignore the slash path because we are treating my data as
     * default path.
     */
    if (pathname !== '/') {
      // track page view on route change
      analytics.page();
    }
    console.log(isAuthenticated);
    console.log(isProtectedRoute(location.pathname));
  }, [location.pathname]);

  return (
    <div
      className="nav-apps"
      hidden={!(isAuthenticated && isProtectedRoute(location.pathname))}>
      <SVGIcons
        alt="Darkseal Logo"
        icon={Icons.LOGO}
        width="60"
        onClick={() => window.open(ROUTES.HOME, '_self')}
      />
      <ul className="app-nav-ul">
        <li className="app-nav-li">
          <a href={ROUTES.MY_DATA}>
            <SVGIcons alt="home" icon={Icons.FOLDER_GREY_APP} width="19" />
          </a>
        </li>
        <li className="app-nav-li">
          <a href={ROUTES.TEST_SUITES}>
            <SVGIcons
              alt="explore"
              icon={Icons.TEST_SUITE_GREY_APP}
              width="18"
            />
          </a>
        </li>
        <li className="app-nav-li">
          <a href={ROUTES.DATA_INSIGHT}>
            <SVGIcons
              alt="explore"
              icon={Icons.DASHBOARD_GREY_APP}
              width="17"
            />
          </a>
        </li>
        <li className="app-nav-li">
          <a href={ROUTES.GLOSSARY}>
            <SVGIcons alt="explore" icon={Icons.DOC_WHITE} width="17" />
          </a>
        </li>
        <li className="app-nav-li">
          <a href={ROUTES.TAGS}>
            <SVGIcons
              alt="explore"
              icon={Icons.CONTAINER_GREY_APP}
              width="17"
            />
          </a>
        </li>
        <li className="app-nav-li">
          <a href={ROUTES.SETTINGS}>
            <SVGIcons alt="explore" icon={Icons.SETTINGS_APP} width="17" />
          </a>
        </li>
        {/* Darkseal help */}
        <li className="app-nav-li-help-x">
          <a
            href="https://ciusji.gitbook.io/darkseal/"
            rel="noreferrer"
            target="_blank">
            <SVGIcons
              alt="custom-properties"
              icon={Icons.WHATS_NEW_APP}
              width="17"
            />
          </a>
        </li>
      </ul>
    </div>
  );
};

const App: FunctionComponent = () => {
  return (
    <div className="main-container">
      <div className="content-wrapper" data-testid="content-wrapper">
        <Router>
          <I18nextProvider i18n={i18n}>
            <ErrorBoundry>
              <AuthProvider childComponentType={AppRouter}>
                <ApplicationConfigProvider>
                  <HelmetProvider>
                    <WebAnalyticsProvider>
                      <PermissionProvider>
                        <WebSocketProvider>
                          <AppNavs />
                          <GlobalSearchProvider>
                            <Appbar />
                            <AppRouter />
                          </GlobalSearchProvider>
                        </WebSocketProvider>
                      </PermissionProvider>
                    </WebAnalyticsProvider>
                  </HelmetProvider>
                </ApplicationConfigProvider>
              </AuthProvider>
            </ErrorBoundry>
          </I18nextProvider>
        </Router>
        <ToastContainer {...TOAST_OPTIONS} newestOnTop />
      </div>
    </div>
  );
};

export default App;
