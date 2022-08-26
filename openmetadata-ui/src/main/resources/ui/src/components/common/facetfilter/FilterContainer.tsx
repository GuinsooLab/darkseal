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
import { isNil } from 'lodash';
import React, { FunctionComponent } from 'react';
import { FQN_SEPARATOR_CHAR } from '../../../constants/char.constants';
import { getCountBadge } from '../../../utils/CommonUtils';
import PopOver from '../popover/PopOver';
import { FilterContainerProp } from './FacetTypes';
const FilterContainer: FunctionComponent<FilterContainerProp> = ({
  name,
  count,
  onSelect,
  isSelected,
  type = '',
  isDisabled = false,
}: FilterContainerProp) => {
  const getFilterName = (name = '') => {
    const formattedName = name.startsWith(`Tier${FQN_SEPARATOR_CHAR}Tier`)
      ? name.split(FQN_SEPARATOR_CHAR)[1]
      : name;

    return (
      <PopOver position="top" title={formattedName} trigger="mouseenter">
        <>{formattedName}</>
      </PopOver>
    );
  };

  return (
    <label
      className="filter-group tw-justify-between tw-mb-2.5 tw-cursor-pointer"
      data-testid={`filter-container-${name}`}>
      <div className="tw-flex">
        <input
          checked={isSelected}
          className={classNames('tw-mr-1 custom-checkbox', {
            'tw-cursor-not-allowed': isDisabled,
          })}
          data-testid="checkbox"
          disabled={isDisabled}
          id={name}
          type="checkbox"
          onChange={() => {
            onSelect(!isSelected, name, type);
          }}
        />
        <div
          className={classNames(
            'filters-title tw-w-32 tw-truncate custom-checkbox-label',
            { 'tw-text-grey-muted': isDisabled }
          )}
          data-testid="checkbox-label">
          {getFilterName(name)}
        </div>
      </div>
      {!isNil(count) &&
        getCountBadge(count, classNames('tw-py-0 tw-px-0'), isSelected)}
    </label>
  );
};

export default FilterContainer;
