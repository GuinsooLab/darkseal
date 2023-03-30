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

import { AxiosError } from 'axios';
import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { getSuggestions } from 'rest/miscAPI';
import { FQN_SEPARATOR_CHAR } from '../../constants/char.constants';
import { FqnPart } from '../../enums/entity.enum';
import { SearchIndex } from '../../enums/search.enum';
import jsonData from '../../jsons/en';
import { getPartialNameFromTableFQN } from '../../utils/CommonUtils';
import { serviceTypeLogo } from '../../utils/ServiceUtils';
import SVGIcons, { Icons } from '../../utils/SvgUtils';
import { getEntityLink } from '../../utils/TableUtils';
import { showErrorToast } from '../../utils/ToastUtils';
import { Option } from '../GlobalSearchProvider/GlobalSearchSuggestions/GlobalSearchSuggestions.interface';

type SuggestionProp = {
  searchText: string;
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
};

type CommonSource = {
  fullyQualifiedName: string;
  serviceType: string;
  name: string;
};

type TableSource = {
  table_id: string;
  table_name: string;
} & CommonSource;

type DashboardSource = {
  dashboard_id: string;
  dashboard_name: string;
} & CommonSource;

type TopicSource = {
  topic_id: string;
  topic_name: string;
} & CommonSource;

type PipelineSource = {
  pipeline_id: string;
  pipeline_name: string;
} & CommonSource;

type MlModelSource = {
  ml_model_id: string;
  mlmodel_name: string;
} & CommonSource;

const Suggestions = ({ searchText, isOpen, setIsOpen }: SuggestionProp) => {
  const [options, setOptions] = useState<Array<Option>>([]);
  const [tableSuggestions, setTableSuggestions] = useState<TableSource[]>([]);
  const [topicSuggestions, setTopicSuggestions] = useState<TopicSource[]>([]);
  const [dashboardSuggestions, setDashboardSuggestions] = useState<
    DashboardSource[]
  >([]);

  const [pipelineSuggestions, setPipelineSuggestions] = useState<
    PipelineSource[]
  >([]);
  const [mlModelSuggestions, setMlModelSuggestions] = useState<MlModelSource[]>(
    []
  );
  const isMounting = useRef(true);

  const setSuggestions = (options: Array<Option>) => {
    setTableSuggestions(
      options
        .filter((option) => option._index === SearchIndex.TABLE)
        .map((option) => option._source)
    );
    setTopicSuggestions(
      options
        .filter((option) => option._index === SearchIndex.TOPIC)
        .map((option) => option._source)
    );
    setDashboardSuggestions(
      options
        .filter((option) => option._index === SearchIndex.DASHBOARD)
        .map((option) => option._source)
    );
    setPipelineSuggestions(
      options
        .filter((option) => option._index === SearchIndex.PIPELINE)
        .map((option) => option._source)
    );
    setMlModelSuggestions(
      options
        .filter((option) => option._index === SearchIndex.MLMODEL)
        .map((option) => option._source)
    );
  };

  const getGroupLabel = (index: string) => {
    let label = '';
    let icon = '';
    switch (index) {
      case SearchIndex.TOPIC:
        label = 'Topics';
        icon = Icons.TOPIC_GREY;

        break;
      case SearchIndex.DASHBOARD:
        label = 'Dashboards';
        icon = Icons.DASHBOARD_GREY;

        break;
      case SearchIndex.PIPELINE:
        label = 'Pipelines';
        icon = Icons.PIPELINE_GREY;

        break;
      case SearchIndex.MLMODEL:
        label = 'ML Models';
        icon = Icons.MLMODAL;

        break;
      case SearchIndex.TABLE:
      default:
        label = 'Tables';
        icon = Icons.TABLE_GREY;

        break;
    }

    return (
      <div className="tw-flex tw-items-center tw-my-2">
        <SVGIcons alt="icon" className="tw-h-4 tw-w-4 tw-ml-2" icon={icon} />
        <p className="tw-px-2 tw-text-grey-muted tw-text-xs tw-h-4 tw-mb-0">
          {label}
        </p>
      </div>
    );
  };

  const getSuggestionElement = (
    fqdn: string,
    serviceType: string,
    name: string,
    index: string
  ) => {
    let database;
    let schema;
    if (index === SearchIndex.TABLE) {
      database = getPartialNameFromTableFQN(fqdn, [FqnPart.Database]);
      schema = getPartialNameFromTableFQN(fqdn, [FqnPart.Schema]);
    }

    return (
      <div
        className="tw-flex tw-items-center hover:tw-bg-body-hover"
        data-testid={`${getPartialNameFromTableFQN(fqdn, [
          FqnPart.Service,
        ])}-${name}`}
        key={fqdn}>
        <img
          alt={serviceType}
          className="tw-inline tw-h-4 tw-ml-2"
          src={serviceTypeLogo(serviceType)}
        />
        <Link
          className="tw-block tw-px-4 tw-py-2 tw-text-sm"
          data-testid="data-name"
          id={fqdn.replace(/\./g, '')}
          to={getEntityLink(index, fqdn)}
          onClick={() => setIsOpen(false)}>
          {database && schema
            ? `${database}${FQN_SEPARATOR_CHAR}${schema}${FQN_SEPARATOR_CHAR}${name}`
            : name}
        </Link>
      </div>
    );
  };

  const getEntitiesSuggestions = () => {
    return (
      <div className="py-1" role="none">
        {tableSuggestions.length > 0 && (
          <>
            {getGroupLabel(SearchIndex.TABLE)}

            {tableSuggestions.map((suggestion: TableSource) => {
              const { fullyQualifiedName, name, serviceType } = suggestion;

              return getSuggestionElement(
                fullyQualifiedName,
                serviceType,
                name,
                SearchIndex.TABLE
              );
            })}
          </>
        )}
        {topicSuggestions.length > 0 && (
          <>
            {getGroupLabel(SearchIndex.TOPIC)}

            {topicSuggestions.map((suggestion: TopicSource) => {
              const { fullyQualifiedName, name, serviceType } = suggestion;

              return getSuggestionElement(
                fullyQualifiedName,
                serviceType,
                name,
                SearchIndex.TOPIC
              );
            })}
          </>
        )}
        {dashboardSuggestions.length > 0 && (
          <>
            {getGroupLabel(SearchIndex.DASHBOARD)}

            {dashboardSuggestions.map((suggestion: DashboardSource) => {
              const { fullyQualifiedName, name, serviceType } = suggestion;

              return getSuggestionElement(
                fullyQualifiedName,
                serviceType,
                name,
                SearchIndex.DASHBOARD
              );
            })}
          </>
        )}
        {pipelineSuggestions.length > 0 && (
          <>
            {getGroupLabel(SearchIndex.PIPELINE)}

            {pipelineSuggestions.map((suggestion: PipelineSource) => {
              const { fullyQualifiedName, name, serviceType } = suggestion;

              return getSuggestionElement(
                fullyQualifiedName,
                serviceType,
                name,
                SearchIndex.PIPELINE
              );
            })}
          </>
        )}
        {mlModelSuggestions.length > 0 && (
          <>
            {getGroupLabel(SearchIndex.MLMODEL)}

            {mlModelSuggestions.map((suggestion: MlModelSource) => {
              const { fullyQualifiedName, name, serviceType } = suggestion;

              return getSuggestionElement(
                fullyQualifiedName,
                serviceType,
                name,
                SearchIndex.MLMODEL
              );
            })}
          </>
        )}
      </div>
    );
  };

  useEffect(() => {
    if (!isMounting.current) {
      getSuggestions(searchText)
        .then((res) => {
          if (res.data) {
            setOptions(
              res.data.suggest['metadata-suggest'][0]
                .options as unknown as Option[]
            );
            setSuggestions(
              res.data.suggest['metadata-suggest'][0]
                .options as unknown as Option[]
            );
          } else {
            throw jsonData['api-error-messages']['unexpected-server-response'];
          }
        })
        .catch((err: AxiosError) => {
          showErrorToast(
            err,
            jsonData['api-error-messages']['fetch-suggestions-error']
          );
        });
    }
  }, [searchText]);

  // always Keep this useEffect at the end...
  useEffect(() => {
    isMounting.current = false;
  }, []);

  return (
    <>
      {options.length > 0 && isOpen ? (
        <>
          <button
            className="tw-z-10 tw-fixed tw-inset-0 tw-h-full tw-w-full tw-bg-black tw-opacity-0 "
            data-testid="suggestion-overlay"
            onClick={() => setIsOpen(false)}
          />
          <div
            aria-labelledby="menu-button"
            aria-orientation="vertical"
            className="tw-origin-top-right tw-absolute z-400
          tw-w-600 tw-mt-1 tw-rounded-md tw-shadow-lg
        tw-bg-white tw-ring-1 tw-ring-black tw-ring-opacity-5 focus:tw-outline-none tw-ml-4"
            role="menu">
            {getEntitiesSuggestions()}
          </div>
        </>
      ) : null}
    </>
  );
};

export default Suggestions;
