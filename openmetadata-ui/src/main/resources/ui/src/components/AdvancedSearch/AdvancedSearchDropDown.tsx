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

import { Dropdown, Menu } from 'antd';
import React, { FC } from 'react';
import { getDropDownItems } from '../../utils/AdvancedSearchUtils';
import { normalLink } from '../../utils/styleconstant';
import { dropdownIcon as DropdownIcon } from '../../utils/svgconstant';
import { AdvanceField } from '../Explore/explore.interface';

interface Props {
  index: string;
  selectedItems: Array<AdvanceField>;
  onSelect: (filter: string) => void;
}

const AdvancedSearchDropDown: FC<Props> = ({
  index,
  onSelect,
  selectedItems,
}) => {
  const items = getDropDownItems(index).map((item) => ({
    ...item,
    onClick: () => onSelect(item.key),
    disabled: selectedItems.some((i) => item.key === i.key),
    'data-testid': 'dropdown-menu-item',
  }));

  const menu = <Menu data-testid="dropdown-menu" items={items} />;

  return (
    <Dropdown
      className="tw-self-end tw-mb-2 tw-mr-2 tw-cursor-pointer"
      data-testid="dropdown"
      overlay={menu}
      trigger={['click']}>
      <div className="tw-text-primary" data-testid="dropdown-label">
        <span className="tw-mr-2">Advanced Search</span>
        <DropdownIcon style={{ color: normalLink, margin: '0px' }} />
      </div>
    </Dropdown>
  );
};

export default AdvancedSearchDropDown;
