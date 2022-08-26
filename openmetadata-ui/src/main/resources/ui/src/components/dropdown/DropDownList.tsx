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

import classNames from 'classnames';
import { isNil, isUndefined, toLower } from 'lodash';
import React, { FunctionComponent, useEffect, useRef, useState } from 'react';
import { useWindowDimensions } from '../../hooks/useWindowDimensions';
import { getCountBadge } from '../../utils/CommonUtils';
import { getTopPosition } from '../../utils/DropDownUtils';
import Loader from '../Loader/Loader';
import { DropDownListItem, DropDownListProp } from './types';

const DropDownList: FunctionComponent<DropDownListProp> = ({
  dropDownList,
  isLoading = false,
  listGroups = [],
  horzPosRight,
  searchString = '',
  controlledSearchStr,
  showSearchBar = false,
  showEmptyList = false,
  value,
  onSearchTextChange,
  onSelect,
  groupType = 'label',
  domPosition,
  className = '',
  widthClass = 'tw-w-52',
  getTotalCountForGroup,
}: DropDownListProp) => {
  const { height: windowHeight } = useWindowDimensions();
  const isMounted = useRef<boolean>(false);
  const [searchedList, setSearchedList] = useState(dropDownList);
  const [searchText, setSearchText] = useState(searchString);
  const [dropDownPosition, setDropDownPosition] = useState<
    { bottom: string } | {}
  >({});

  const setCurrentTabOnMount = () => {
    const selectedItem = dropDownList.find((l) => l.value === value);
    let index = 0;
    if (selectedItem) {
      index = listGroups.indexOf(selectedItem.group as string);
    }

    return index >= 0 ? index + 1 : 1;
  };

  const [activeTab, setActiveTab] = useState<number>(setCurrentTabOnMount());

  const getTabClasses = (tab: number, activeTab: number) => {
    return 'tw-gh-tabs' + (activeTab === tab ? ' active' : '');
  };

  const handleListSearch = (text: string) => {
    if (!onSearchTextChange) {
      setSearchText(text || '');
    } else {
      onSearchTextChange(text || '');
    }
  };

  const getEmptyTextElement = (): JSX.Element => {
    return (
      <div
        className="tw-text-grey-muted tw-px-4 tw-py-2"
        data-testid="empty-list">
        <p className={widthClass}>
          {searchText ? 'No match found' : 'No data available'}
        </p>
      </div>
    );
  };

  const getSearchedListByGroup = (
    groupName?: string
  ): Array<DropDownListItem> => {
    return searchedList.filter((item) => {
      return groupName ? item.group === groupName : !item.group;
    });
  };

  const getGroupCount = (groupName?: string): number => {
    let count = 0;
    if (controlledSearchStr === '' && getTotalCountForGroup && groupName) {
      count = getTotalCountForGroup(groupName);
    } else {
      count = getSearchedListByGroup(groupName)?.length;
    }

    return count;
  };

  const getDropDownElement = (item: DropDownListItem, index: number) => {
    return (
      <div
        aria-disabled={item.disabled as boolean}
        className={classNames(
          'tw-text-gray-700 tw-flex tw-px-4 tw-py-2 tw-text-sm hover:tw-bg-body-hover tw-cursor-pointer',
          !isNil(value) && item.value === value ? 'tw-bg-primary-lite' : null,
          {
            'tw-cursor-not-allowed': item.disabled,
          }
        )}
        data-testid="list-item"
        id={`menu-item-${index}`}
        key={index}
        role="menuitem"
        onClick={(e) => !item.disabled && onSelect?.(e, item.value)}>
        {item.icon}
        {/* Spacer if icon is there */}
        {item.icon && <span className="tw-p-1" />}
        <p
          className={classNames('tw-truncate', widthClass)}
          title={item.name as string}>
          {item.name}
        </p>
      </div>
    );
  };

  const getListElements = (): JSX.Element => {
    const results = getSearchedListByGroup();

    if (!results.length && showEmptyList && !listGroups.length) {
      return getEmptyTextElement();
    }

    return (
      <>
        {results.map((item: DropDownListItem, index: number) =>
          getDropDownElement(item, index)
        )}
      </>
    );
  };

  const getListElementsByLabels = (groupName: string) => {
    const results = getSearchedListByGroup(groupName);
    const groupLabel = (
      <span className="tw-flex tw-my-1 tw-text-grey-muted">
        <hr className="tw-mt-2 tw-w-full" />
        <span className="tw-text-xs tw-px-0.5">{groupName}</span>{' '}
        <hr className="tw-mt-2 tw-w-full" />
      </span>
    );

    if (!results.length && showEmptyList) {
      return (
        <>
          {groupLabel}
          {getEmptyTextElement()}
        </>
      );
    }

    return (
      <>
        {results.length > 0 && groupLabel}
        {results.map((item: DropDownListItem, index: number) =>
          getDropDownElement(item, index)
        )}
      </>
    );
  };

  const getListElementsByTab = (groupTab: string) => {
    const results = getSearchedListByGroup(groupTab);

    if (!results.length && showEmptyList) {
      return getEmptyTextElement();
    }

    return (
      <>
        {results.map((item: DropDownListItem, index: number) =>
          getDropDownElement(item, index)
        )}
      </>
    );
  };

  const getListElementsByGroup = () => {
    if (groupType === 'label') {
      return listGroups.map((grp, index) => {
        return <div key={index}>{getListElementsByLabels(grp)}</div>;
      });
    } else {
      return getListElementsByTab(listGroups[activeTab - 1]);
    }
  };

  useEffect(() => {
    setSearchText(searchString);
  }, [searchString]);

  useEffect(() => {
    setSearchedList(
      dropDownList.filter((item) => {
        return toLower(item.name as string).includes(toLower(searchText));
      })
    );
  }, [searchText, dropDownList]);

  useEffect(() => {
    if (isMounted.current) {
      const modifiedGrp = listGroups
        .map((grp, index) => ({
          grp: grp,
          length: searchedList.filter((item) => grp === item.group).length,
          tab: index + 1,
        }))
        .sort((a, b) => (a.length > b.length ? -1 : 1));

      setActiveTab(
        searchText ? (modifiedGrp.length > 0 ? modifiedGrp[0].tab : 1) : 1
      );
    }
  }, [searchText]);

  useEffect(() => {
    if (!isUndefined(domPosition)) {
      setDropDownPosition(
        getTopPosition(windowHeight, domPosition.bottom, domPosition.height)
      );
    }
  }, [domPosition, searchText]);

  useEffect(() => {
    setActiveTab(setCurrentTabOnMount());
    isMounted.current = true;
  }, []);

  return (
    <>
      {(searchedList.length > 0 || showEmptyList) && (
        <>
          <button
            className="tw-z-10 tw-fixed tw-inset-0 tw-h-full tw-w-full tw-bg-black tw-opacity-0"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onSelect && onSelect(e);
            }}
          />
          <div
            aria-labelledby="menu-button"
            aria-orientation="vertical"
            className={classNames(
              'dropdown-list tw-mt-0.5',
              horzPosRight ? 'dd-horz-right' : 'dd-horz-left',
              className
            )}
            data-testid="dropdown-list"
            role="menu"
            style={dropDownPosition}>
            <>
              {showSearchBar && (
                <div className="has-search tw-p-4 tw-pb-2">
                  <input
                    className="tw-form-inputs tw-form-inputs-padding"
                    data-testid="searchInputText"
                    placeholder="Search..."
                    type="text"
                    value={controlledSearchStr}
                    onChange={(e) => {
                      handleListSearch(e.target.value);
                    }}
                  />
                </div>
              )}
              {groupType === 'tab' && (
                <div className="tw-flex tw-justify-between tw-border-b tw-border-separator tw-mb-1">
                  {listGroups.map((grp, index) => {
                    return (
                      <button
                        className={getTabClasses(index + 1, activeTab)}
                        data-testid="dropdown-tab"
                        key={index}
                        onClick={() => setActiveTab(index + 1)}>
                        {grp}
                        {getCountBadge(
                          getGroupCount(grp),
                          '',
                          activeTab === index + 1
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
              {isLoading ? (
                <div className={classNames('tw-mx-4 tw-my-2', widthClass)}>
                  <Loader />
                </div>
              ) : (
                <div
                  className="tw-py-1 tw-max-h-60 tw-overflow-y-auto"
                  role="none">
                  {getListElements()}
                  {getListElementsByGroup()}
                </div>
              )}
            </>
          </div>
        </>
      )}
    </>
  );
};

export default DropDownList;
