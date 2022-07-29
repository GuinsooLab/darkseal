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
import { FormattedTableData } from 'Models';
import PropTypes from 'prop-types';
import React, { ReactNode } from 'react';
import { FQN_SEPARATOR_CHAR } from '../../constants/char.constants';
import { PAGE_SIZE } from '../../constants/constants';
import { MAX_RESULT_HITS } from '../../constants/explore.constants';
import { TableType } from '../../generated/entity/data/table';
import { Paging } from '../../generated/type/paging';
import { pluralize } from '../../utils/CommonUtils';
import { getTierFromSearchTableTags } from '../../utils/TableUtils';
import ErrorPlaceHolderES from '../common/error-with-placeholder/ErrorPlaceHolderES';
import NextPrevious from '../common/next-previous/NextPrevious';
import TableDataCard from '../common/table-data-card/TableDataCard';
import Loader from '../Loader/Loader';
import Onboarding from '../onboarding/Onboarding';
type SearchedDataProp = {
  children?: ReactNode;
  data: Array<FormattedTableData>;
  currentPage: number;
  isLoading?: boolean;
  paginate: (value: string | number) => void;
  totalValue: number;
  fetchLeftPanel?: () => ReactNode;
  showResultCount?: boolean;
  searchText?: string;
  showOnboardingTemplate?: boolean;
  showOnlyChildren?: boolean;
  isFilterSelected: boolean;
};

const ASSETS_NAME = [
  'table_name',
  'topic_name',
  'dashboard_name',
  'pipeline_name',
];

const SearchedData: React.FC<SearchedDataProp> = ({
  children,
  data,
  currentPage,
  isLoading = false,
  paginate,
  showResultCount = false,
  showOnboardingTemplate = false,
  showOnlyChildren = false,
  searchText,
  totalValue,
  isFilterSelected,
}: SearchedDataProp) => {
  const highlightSearchResult = () => {
    return data.map((table, index) => {
      let tDesc = table.description;
      const highLightedTexts = table.highlight?.description || [];

      if (highLightedTexts.length > 0) {
        const matchTextArr = highLightedTexts.map((val) =>
          val.replace(/<\/?span(.*?)>/g, '')
        );

        matchTextArr.forEach((text, i) => {
          tDesc = tDesc.replace(text, highLightedTexts[i]);
        });
      }

      let name = table.name;
      if (!isUndefined(table.highlight)) {
        name = table.highlight?.name?.join(' ') || name;
      }

      const matches = table.highlight
        ? Object.entries(table.highlight)
            .map((d) => {
              let highlightedTextCount = 0;
              d[1].forEach((value) => {
                const currentCount = value.match(
                  /<span(.*?)>(.*?)<\/span>/g
                )?.length;

                highlightedTextCount =
                  highlightedTextCount + (currentCount || 0);
              });

              return {
                key: d[0],
                value: highlightedTextCount,
              };
            })
            .filter((d) => !ASSETS_NAME.includes(d.key))
        : [];

      return (
        <div className="tw-mb-3" key={index}>
          <TableDataCard
            database={table.database}
            databaseSchema={table.databaseSchema}
            deleted={table.deleted}
            description={tDesc}
            fullyQualifiedName={table.fullyQualifiedName}
            id={`tabledatacard${index}`}
            indexType={table.index}
            matches={matches}
            name={name}
            owner={table.owner}
            service={table.service}
            serviceType={table.serviceType || '--'}
            tableType={table.tableType as TableType}
            tags={table.tags}
            tier={
              (
                table.tier?.tagFQN ||
                getTierFromSearchTableTags(
                  (table.tags || []).map((tag) => tag.tagFQN)
                )
              )?.split(FQN_SEPARATOR_CHAR)[1]
            }
            usage={table.weeklyPercentileRank}
          />
        </div>
      );
    });
  };

  const ResultCount = () => {
    if (showResultCount && (isFilterSelected || searchText)) {
      if (MAX_RESULT_HITS === totalValue) {
        return <div className="tw-mb-1">{`About ${totalValue} results`}</div>;
      } else {
        return <div className="tw-mb-1">{pluralize(totalValue, 'result')}</div>;
      }
    } else {
      return null;
    }
  };

  return (
    <>
      {isLoading ? (
        <Loader />
      ) : (
        <div data-testid="search-container">
          {totalValue > 0 || showOnboardingTemplate || showOnlyChildren ? (
            <>
              {children}
              {!showOnlyChildren ? (
                <>
                  <ResultCount />
                  {data.length > 0 ? (
                    <div
                      className="tw-grid tw-grid-rows-1 tw-grid-cols-1"
                      data-testid="search-results">
                      {highlightSearchResult()}
                      {totalValue > PAGE_SIZE && data.length > 0 && (
                        <NextPrevious
                          isNumberBased
                          currentPage={currentPage}
                          pageSize={PAGE_SIZE}
                          paging={{} as Paging}
                          pagingHandler={paginate}
                          totalCount={totalValue}
                        />
                      )}
                    </div>
                  ) : (
                    <Onboarding />
                  )}
                </>
              ) : null}
            </>
          ) : (
            <>
              {children}
              <ErrorPlaceHolderES query={searchText} type="noData" />
            </>
          )}
        </div>
      )}
    </>
  );
};

SearchedData.propTypes = {
  children: PropTypes.element,
  data: PropTypes.array.isRequired,
  currentPage: PropTypes.number.isRequired,
  isLoading: PropTypes.bool,
  paginate: PropTypes.func.isRequired,
  showResultCount: PropTypes.bool,
  showOnboardingTemplate: PropTypes.bool,
  searchText: PropTypes.string,
  totalValue: PropTypes.number.isRequired,
  fetchLeftPanel: PropTypes.func,
};

export default SearchedData;
