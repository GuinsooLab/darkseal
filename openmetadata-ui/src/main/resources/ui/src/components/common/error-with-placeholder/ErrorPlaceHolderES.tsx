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

import { uniqueId } from 'lodash';
import { observer } from 'mobx-react';
import React from 'react';
import AppState from '../../../AppState';
import { useAuthContext } from '../../../authentication/auth-provider/AuthProvider';

type Props = {
  type: 'error' | 'noData';
  errorMessage?: string;
  query?: string;
};

const stepsData = [
  {
    step: 1,
    title: 'Ingest Sample Data',
    description:
      'Run sample data to ingest sample entities into your OpenMetadata.',
    link: 'https://ciusji.gitbook.io/darkseal/',
  },
  {
    step: 2,
    title: 'Start Elasticsearch Docker',
    description: 'Ensure that the Elasticsearch docker is up and running.',
    link: 'https://ciusji.gitbook.io/darkseal/',
  },
  {
    step: 3,
    title: 'Install Service Connectors',
    description:
      'There are a lot of connectors available here to index data from your services. Please checkout our connectors.',
    link: 'https://ciusji.gitbook.io/darkseal/',
  },
  {
    step: 4,
    title: 'More Help',
    description:
      'If you are still running into issues, please reach out to us on slack.',
    link: 'https://ciusji.gitbook.io/darkseal/',
  },
];

const ErrorPlaceHolderES = ({ type, errorMessage, query = '' }: Props) => {
  const { isAuthDisabled } = useAuthContext();
  const getUserDisplayName = () => {
    return isAuthDisabled
      ? AppState.users?.length > 0
        ? AppState.users[0].displayName || AppState.users[0].name
        : 'User'
      : AppState.userDetails.displayName || AppState.userDetails.name;
  };
  const noRecordForES = () => {
    return (
      <p className="tw-text-center" data-testid="no-search-results">
        No matching data assets found
        {query ? (
          <>
            {' '}
            for <span className="tw-text-primary tw-font-medium">{query}</span>
          </>
        ) : null}
      </p>
    );
  };

  const elasticSearchError = () => {
    const index = errorMessage?.split('[')[3]?.split(']')[0];
    const errorText = errorMessage && index ? `find ${index} in` : 'access';

    return (
      <div className="tw-mb-5" data-testid="es-error">
        <div className="tw-mb-3 tw-text-center">
          <p>
            <span>Welcome to Darkseal. </span>
            <span data-testid="error-text">{`We are unable to ${errorText} Elasticsearch for entity indexes.`}</span>
          </p>

          <p>
            Please follow the instructions here to set up Metadata ingestion and
            index them into Elasticsearch.
          </p>
        </div>
        <div className="tw-grid tw-grid-cols-4 tw-gap-4 tw-mt-5">
          {stepsData.map((data) => (
            <div
              className="tw-card tw-flex tw-flex-col tw-justify-between tw-p-5"
              key={uniqueId()}>
              <div>
                <div className="tw-flex tw-mb-2">
                  <div className="tw-rounded-full tw-flex tw-justify-center tw-items-center tw-h-10 tw-w-10 tw-border-2 tw-border-primary tw-text-lg tw-font-bold tw-text-primary">
                    {data.step}
                  </div>
                </div>

                <h6
                  className="tw-text-base tw-text-grey-body tw-font-medium"
                  data-testid="service-name">
                  {data.title}
                </h6>

                <p className="tw-text-grey-body tw-pb-1 tw-text-sm tw-mb-5">
                  {data.description}
                </p>
              </div>

              <p>
                <a href={data.link} rel="noopener noreferrer" target="_blank">
                  Click here &gt;&gt;
                </a>
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="tw-mt-10 tw-text-base tw-font-medium">
      {type !== 'noData' && (
        <p className="tw-text-center tw-text-lg tw-font-bold tw-mb-1 tw-text-primary">
          {`Hi, ${getUserDisplayName()}!`}
        </p>
      )}
      {type === 'noData' && noRecordForES()}
      {type === 'error' && elasticSearchError()}
    </div>
  );
};

export default observer(ErrorPlaceHolderES);
