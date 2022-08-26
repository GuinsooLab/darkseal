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

import { SelectableOption } from 'Models';
import React, { useState } from 'react';
import AsyncSelect from 'react-select/async';
import { getSuggestedTeams, getTeamsByQuery } from '../../axiosAPIs/miscAPI';
import { PAGE_SIZE } from '../../constants/constants';
import { Team } from '../../generated/entity/teams/team';
import { EntityReference } from '../../generated/type/entityReference';
import { formatTeamsResponse } from '../../utils/APIUtils';
import { getEntityName } from '../../utils/CommonUtils';
import { reactSingleSelectCustomStyle } from '../common/react-select-component/reactSelectCustomStyle';

interface CustomOption extends SelectableOption {
  isDisabled: boolean;
}

interface Props {
  onSelectionChange: (teams: string[]) => void;
  filterJoinable?: boolean;
  placeholder?: string;
}

const TeamsSelectable = ({
  onSelectionChange,
  filterJoinable,
  placeholder = 'Search for teams',
}: Props) => {
  const [teamSearchText, setTeamSearchText] = useState<string>('');

  const handleSelectionChange = (selectedOptions: SelectableOption[]) => {
    onSelectionChange(selectedOptions.map((option) => option.value));
  };

  const getOptions = (teams: Team[]) => {
    const filteredTeams = filterJoinable
      ? teams.filter((team) => team.isJoinable)
      : teams;

    return filteredTeams.map((team) => ({
      label: getEntityName(team as EntityReference),
      value: team.id,
    }));
  };

  const loadOptions = (text: string) => {
    return new Promise<SelectableOption[]>((resolve) => {
      if (text) {
        getSuggestedTeams(text).then((res) => {
          const teams: Team[] = formatTeamsResponse(
            res.data.suggest['metadata-suggest'][0].options
          );
          resolve(getOptions(teams));
        });
      } else {
        getTeamsByQuery({
          q: '*',
          from: 0,
          size: PAGE_SIZE,
          isJoinable: filterJoinable,
        }).then((res) => {
          const teams: Team[] =
            res.hits.hits.map((t: { _source: Team }) => t._source) || [];
          resolve(getOptions(teams));
        });
      }
    });
  };

  return (
    <AsyncSelect
      cacheOptions
      defaultOptions
      isClearable
      isMulti
      aria-label="Select teams"
      components={{
        DropdownIndicator: null,
      }}
      inputValue={teamSearchText}
      isOptionDisabled={(option) => !!(option as CustomOption).isDisabled}
      loadOptions={loadOptions}
      maxMenuHeight={200}
      placeholder={placeholder}
      styles={reactSingleSelectCustomStyle}
      onChange={(value) => handleSelectionChange(value as SelectableOption[])}
      onInputChange={(newText) => {
        setTeamSearchText(newText);
      }}
    />
  );
};

export default TeamsSelectable;
