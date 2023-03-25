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

import classnames from 'classnames';
import React, { FC, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/authHooks';

interface Props {
  children: ReactNode;
  leftPanelContent?: ReactNode;
  className?: string;
}

const PageContainer: FC<Props> = ({
  children,
  leftPanelContent,
  className,
}) => {
  const location = useLocation();
  const { isAuthenticatedRoute } = useAuth(location.pathname);

  return (
    <div
      className={classnames(
        'page-container',
        className || '',
        !isAuthenticatedRoute ? 'full-page' : null
      )}
      data-testid="container">
      <div className="page-layout centered-layout">
        {leftPanelContent && (
          <div className="side-panel">{leftPanelContent}</div>
        )}
        {children}
      </div>
    </div>
  );
};

export default PageContainer;
