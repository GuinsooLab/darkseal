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

import { library } from '@fortawesome/fontawesome-svg-core';
import {
  faCheck,
  faCheckCircle,
  faCheckSquare,
  faChevronDown,
  faChevronRight,
  faChevronUp,
  faEllipsisV,
  faPlus,
  faSearch,
  faTimes,
} from '@fortawesome/free-solid-svg-icons';
import React, { FunctionComponent } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.min.css';
import { AuthProvider } from './authentication/auth-provider/AuthProvider';
import WebSocketProvider from './components/web-scoket/web-scoket.provider';
import { toastOptions } from './constants/toast.constants';
import ErrorBoundry from './ErrorBoundry/ErrorBoundry';
import AppRouter from './router/AppRouter';
import SVGIcons, { Icons } from './utils/SvgUtils';
import { ROUTES } from './constants/constants';

const App: FunctionComponent = () => {
  library.add(
    faTimes,
    faCheck,
    faSearch,
    faPlus,
    faCheckSquare,
    faCheckCircle,
    faChevronDown,
    faChevronRight,
    faChevronUp,
    faEllipsisV
  );

  return (
    <div className="main-container">
      <div className="nav-apps">
        <SVGIcons alt="Darkseal Logo" icon={Icons.LOGO} width="60" />
        <ul className="app-nav-ul">
          <li className="app-nav-li">
            <a href={ROUTES.HOME}>
              <SVGIcons
                alt="home"
                icon={Icons.ALL_APPLICATION_APP}
                width="18"
              />
            </a>
          </li>
          <li className="app-nav-li">
            <a href={ROUTES.EXPLORE}>
              <SVGIcons alt="explore" icon={Icons.TABLE_GREY_APP} width="18" />
            </a>
          </li>
          <li className="app-nav-li">
            <a href={ROUTES.EXPLORE}>
              <SVGIcons alt="explore" icon={Icons.TOPIC_GREY_APP} width="18" />
            </a>
          </li>
          <li className="app-nav-li">
            <a href={ROUTES.EXPLORE}>
              <SVGIcons
                alt="explore"
                icon={Icons.DASHBOARD_GREY_APP}
                width="18"
              />
            </a>
          </li>
          <li className="app-nav-li">
            <a href={ROUTES.EXPLORE}>
              <SVGIcons
                alt="explore"
                icon={Icons.PIPELINE_GREY_APP}
                width="18"
              />
            </a>
          </li>
          <li className="app-nav-li">
            <a href={ROUTES.EXPLORE}>
              <SVGIcons
                alt="explore"
                icon={Icons.MLMODAL_GREY_APP}
                width="18"
              />
            </a>
          </li>
          <li className="app-nav-li">
            <a href={ROUTES.EXPLORE}>
              <SVGIcons alt="explore" icon={Icons.USERS_GREY_APP} width="18" />
            </a>
          </li>
          <li className="app-nav-li">
            <a href={ROUTES.EXPLORE}>
              <SVGIcons alt="explore" icon={Icons.TEAMS_GREY_APP} width="18" />
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
                width="18"
              />
            </a>
          </li>
        </ul>
      </div>
      <div className="content-wrapper" data-testid="content-wrapper">
        <Router>
          <ErrorBoundry>
            <AuthProvider childComponentType={AppRouter}>
              <WebSocketProvider>
                <AppRouter />
              </WebSocketProvider>
            </AuthProvider>
          </ErrorBoundry>
        </Router>
        <ToastContainer {...toastOptions} newestOnTop />
      </div>
    </div>
  );
};

export default App;
