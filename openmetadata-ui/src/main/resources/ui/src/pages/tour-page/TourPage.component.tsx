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

import { observer } from 'mobx-react';
import { LeafNodes } from 'Models';
import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import AppState from '../../AppState';
import DatasetDetails from '../../components/DatasetDetails/DatasetDetails.component';
import Explore from '../../components/Explore/Explore.component';
import { ExploreSearchData } from '../../components/Explore/explore.interface';
import MyData from '../../components/MyData/MyData.component';
import { MyDataProps } from '../../components/MyData/MyData.interface';
import NavBar from '../../components/nav-bar/NavBar';
import Tour from '../../components/tour/Tour';
import { ROUTES, TOUR_SEARCH_TERM } from '../../constants/constants';
import {
  mockDatasetData,
  mockFeedData,
  mockSearchData as exploreSearchData,
} from '../../constants/mockTourData.constants';
import { CurrentTourPageType } from '../../enums/tour.enum';
import {
  Table,
  TableJoins,
  TableType,
  TypeUsedToReturnUsageDetailsOfAnEntity,
} from '../../generated/entity/data/table';
import { EntityReference } from '../../generated/type/entityReference';
import { Paging } from '../../generated/type/paging';
import { TagLabel } from '../../generated/type/tagLabel';
import { useTour } from '../../hooks/useTour';
import { getSteps } from '../../utils/TourUtils';

const exploreCount = {
  table: 4,
  topic: 0,
  dashboard: 0,
  pipeline: 0,
  dbtModel: 0,
  mlModel: 0,
};

const TourPage = () => {
  const location = useLocation();
  const { handleIsTourOpen } = useTour();
  const [currentPage, setCurrentPage] = useState<CurrentTourPageType>(
    AppState.currentTourPage
  );
  const [myDataSearchResult, setMyDataSearchResult] = useState(mockFeedData);
  const [exploreSearchResult, setExploreSearchResult] =
    useState(exploreSearchData);
  const [datasetActiveTab, setdatasetActiveTab] = useState(
    AppState.activeTabforTourDatasetPage
  );
  const [explorePageCounts, setExplorePageCounts] = useState(exploreCount);
  const [searchValue, setSearchValue] = useState('');

  const handleCountChange = () => {
    setExplorePageCounts(exploreCount);
  };

  /**
   *
   * @returns void
   */
  const handleFilterChange = () => {
    return;
  };

  const mockPromiseFunction = (): Promise<void> => {
    return new Promise<void>((resolve) => resolve());
  };

  const clearSearchTerm = () => {
    setSearchValue('');
  };

  const handleSearch = () => {
    if (location.pathname.includes(ROUTES.TOUR)) {
      if (searchValue === TOUR_SEARCH_TERM) {
        AppState.currentTourPage = CurrentTourPageType.EXPLORE_PAGE;
        clearSearchTerm();
      }

      return;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };
  const handleOnClick = () => {
    handleSearch();
  };

  useEffect(() => {
    handleIsTourOpen(true);
    AppState.currentTourPage = CurrentTourPageType.MY_DATA_PAGE;
    AppState.activeTabforTourDatasetPage = 1;
  }, []);

  useEffect(() => {
    setCurrentPage(AppState.currentTourPage);
  }, [AppState.currentTourPage]);

  useEffect(() => {
    setdatasetActiveTab(AppState.activeTabforTourDatasetPage);
  }, [AppState.activeTabforTourDatasetPage]);

  const getCurrentPage = (page: CurrentTourPageType) => {
    switch (page) {
      case CurrentTourPageType.MY_DATA_PAGE:
        return (
          <MyData
            countDashboards={10}
            countMlModal={2}
            countPipelines={8}
            countServices={4}
            countTables={21}
            countTeams={7}
            countTopics={20}
            countUsers={100}
            error=""
            feedData={myDataSearchResult as MyDataProps['feedData']}
            fetchData={() => {
              setMyDataSearchResult(mockFeedData);
            }}
            fetchFeedHandler={handleOnClick}
            followedData={[]}
            followedDataCount={1}
            isFeedLoading={false}
            ownedData={[]}
            ownedDataCount={1}
            paging={{} as Paging}
            pendingTaskCount={0}
            postFeedHandler={handleOnClick}
            updateThreadHandler={handleOnClick}
            userDetails={AppState.userDetails}
          />
        );

      case CurrentTourPageType.EXPLORE_PAGE:
        return (
          <Explore
            isFilterSelected
            error=""
            fetchCount={handleCountChange}
            fetchData={() => setExploreSearchResult(exploreSearchData)}
            handleFilterChange={handleFilterChange}
            handlePathChange={handleCountChange}
            handleSearchText={() => setExploreSearchResult(exploreSearchData)}
            searchQuery=""
            searchResult={exploreSearchResult as unknown as ExploreSearchData}
            searchText=""
            showDeleted={false}
            sortValue=""
            tab=""
            tabCounts={explorePageCounts}
            updateDashboardCount={handleCountChange}
            updateDbtModelCount={handleCountChange}
            updateMlModelCount={handleCountChange}
            updatePipelineCount={handleCountChange}
            updateTableCount={handleCountChange}
            updateTopicCount={handleCountChange}
            onShowDeleted={() => {
              return;
            }}
          />
        );

      case CurrentTourPageType.DATASET_PAGE:
        return (
          <DatasetDetails
            activeTab={datasetActiveTab}
            addLineageHandler={mockPromiseFunction}
            columns={mockDatasetData.columns as unknown as Table['columns']}
            columnsUpdateHandler={handleCountChange}
            createThread={handleCountChange}
            datasetFQN={mockDatasetData.datasetFQN}
            deletePostHandler={handleCountChange}
            description={mockDatasetData.description}
            descriptionUpdateHandler={handleCountChange}
            entityFieldTaskCount={[]}
            entityFieldThreadCount={[]}
            entityLineage={mockDatasetData.entityLineage}
            entityLineageHandler={handleCountChange}
            entityName={mockDatasetData.entityName}
            entityThread={mockFeedData}
            feedCount={0}
            fetchFeedHandler={handleCountChange}
            followTableHandler={handleCountChange}
            followers={mockDatasetData.followers}
            handleAddColumnTestCase={handleCountChange}
            handleAddTableTestCase={handleCountChange}
            handleExtentionUpdate={handleCountChange}
            handleRemoveColumnTest={handleCountChange}
            handleRemoveTableTest={handleCountChange}
            handleSelectedColumn={handleCountChange}
            handleShowTestForm={handleCountChange}
            handleTestModeChange={handleCountChange}
            isNodeLoading={{
              id: undefined,
              state: false,
            }}
            isentityThreadLoading={false}
            joins={mockDatasetData.joins as unknown as TableJoins}
            lineageLeafNodes={{} as LeafNodes}
            loadNodeHandler={handleCountChange}
            owner={undefined as unknown as EntityReference}
            paging={{} as Paging}
            postFeedHandler={handleCountChange}
            qualityTestFormHandler={handleCountChange}
            removeLineageHandler={handleCountChange}
            sampleData={mockDatasetData.sampleData}
            selectedColumn=""
            setActiveTabHandler={(tab) => setdatasetActiveTab(tab)}
            settingsUpdateHandler={() => Promise.resolve()}
            showTestForm={false}
            slashedTableName={mockDatasetData.slashedTableName}
            tableDetails={mockDatasetData.tableDetails as unknown as Table}
            tableProfile={
              mockDatasetData.tableProfile as unknown as Table['tableProfile']
            }
            tableQueries={[]}
            tableTags={mockDatasetData.tableTags}
            tableTestCase={[]}
            tableType={mockDatasetData.tableType as TableType}
            tagUpdateHandler={handleCountChange}
            testMode="table"
            tier={'' as unknown as TagLabel}
            unfollowTableHandler={handleCountChange}
            updateThreadHandler={handleOnClick}
            usageSummary={
              mockDatasetData.usageSummary as unknown as TypeUsedToReturnUsageDetailsOfAnEntity
            }
            versionHandler={handleCountChange}
          />
        );

      default:
        return;
    }
  };

  return (
    <div>
      <NavBar
        isTourRoute
        handleFeatureModal={handleCountChange}
        handleKeyDown={handleKeyDown}
        handleOnClick={handleOnClick}
        handleSearchBoxOpen={handleCountChange}
        handleSearchChange={(value) => setSearchValue(value)}
        hasNotification={false}
        isFeatureModalOpen={false}
        isSearchBoxOpen={false}
        pathname={location.pathname}
        profileDropdown={[]}
        searchValue={searchValue}
        settingDropdown={[]}
        supportDropdown={[]}
        username="User"
      />
      <Tour steps={getSteps(TOUR_SEARCH_TERM, clearSearchTerm)} />
      {getCurrentPage(currentPage)}
    </div>
  );
};

export default observer(TourPage);
