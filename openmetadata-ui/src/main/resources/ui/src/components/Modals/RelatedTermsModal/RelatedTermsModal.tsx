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
import { FormattedGlossaryTermData, SearchResponse } from 'Models';
import React, { useEffect, useState } from 'react';
import { searchData } from '../../../axiosAPIs/miscAPI';
import { PAGE_SIZE } from '../../../constants/constants';
import { SearchIndex } from '../../../enums/search.enum';
import CheckboxUserCard from '../../../pages/teams/CheckboxUserCard';
import { formatSearchGlossaryTermResponse } from '../../../utils/APIUtils';
import { Button } from '../../buttons/Button/Button';
import Searchbar from '../../common/searchbar/Searchbar';
import Loader from '../../Loader/Loader';

type RelatedTermsModalProp = {
  glossaryTermFQN?: string;
  relatedTerms?: Array<FormattedGlossaryTermData>;
  onCancel: () => void;
  onSave: (terms: Array<FormattedGlossaryTermData>) => void;
  header: string;
};

const RelatedTermsModal = ({
  glossaryTermFQN = '',
  relatedTerms,
  onCancel,
  onSave,
  header,
}: RelatedTermsModalProp) => {
  const [searchText, setSearchText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [options, setOptions] = useState<FormattedGlossaryTermData[]>([]);
  const [selectedOption, setSelectedOption] = useState<
    FormattedGlossaryTermData[]
  >(relatedTerms ?? []);

  const getSearchedTerms = (searchedData: FormattedGlossaryTermData[]) => {
    const currOptions = selectedOption.map(
      (item) => item.fullyQualifiedName || item.name
    );
    const data = searchedData.filter((item: FormattedGlossaryTermData) => {
      return !currOptions.includes(item.fullyQualifiedName);
    });

    return [...selectedOption, ...data];
  };

  const suggestionSearch = (searchText = '') => {
    setIsLoading(true);
    searchData(searchText, 1, PAGE_SIZE, '', '', '', SearchIndex.GLOSSARY)
      .then((res: SearchResponse) => {
        const termResult = (
          formatSearchGlossaryTermResponse(
            res?.data?.hits?.hits || []
          ) as FormattedGlossaryTermData[]
        ).filter((item) => item.fullyQualifiedName !== glossaryTermFQN);
        const data = !searchText ? getSearchedTerms(termResult) : termResult;
        setOptions(data);
      })
      .catch(() => {
        setOptions(selectedOption);
      })
      .finally(() => setIsLoading(false));
  };

  const handleSearchAction = (text: string) => {
    setSearchText(text);
    suggestionSearch(text);
  };

  const isIncludeInOptions = (id: string): boolean => {
    return selectedOption.some((d) => d.id === id);
  };

  const selectionHandler = (id: string, isChecked: boolean) => {
    if (!isChecked) {
      setSelectedOption((pre) => pre.filter((option) => option.id !== id));
    } else {
      const newOption: FormattedGlossaryTermData =
        options.find((d) => d.id === id) || ({} as FormattedGlossaryTermData);
      setSelectedOption([...selectedOption, newOption]);
    }
  };

  const getUserCards = () => {
    return options.map((d) => (
      <CheckboxUserCard
        isActionVisible
        isCheckBoxes
        item={{
          name: '',
          displayName: d.displayName || d.name,
          id: d.id,
          isChecked: isIncludeInOptions(d.id),
          type: d.type,
        }}
        key={d.id}
        onSelect={selectionHandler}
      />
    ));
  };

  useEffect(() => {
    if (!isUndefined(relatedTerms) && relatedTerms.length) {
      setOptions(relatedTerms);
    }
    suggestionSearch();
  }, []);

  return (
    <dialog className="tw-modal" data-testid="modal-container">
      <div className="tw-modal-backdrop" onClick={() => onCancel()} />
      <div className="tw-modal-container tw-overflow-y-auto tw-max-w-3xl tw-max-h-screen">
        <div className="tw-modal-header">
          <p className="tw-modal-title tw-text-grey-body" data-testid="header">
            {header}
          </p>
        </div>
        <div className="tw-modal-body">
          <Searchbar
            placeholder="Search for a term..."
            searchValue={searchText}
            typingInterval={500}
            onSearch={handleSearchAction}
          />
          <div className="tw-min-h-256">
            {isLoading ? (
              <Loader />
            ) : options.length > 0 ? (
              <div className="tw-grid tw-grid-cols-3 tw-gap-4">
                {getUserCards()}
              </div>
            ) : (
              <p className="tw-text-center tw-mt-10 tw-text-grey-muted tw-text-base">
                {searchText
                  ? `No terms found for "${searchText}"`
                  : 'No terms found'}
              </p>
            )}
          </div>
        </div>
        <div className="tw-modal-footer" data-testid="cta-container">
          <Button
            size="regular"
            theme="primary"
            variant="link"
            onClick={onCancel}>
            Cancel
          </Button>
          <Button
            data-testid="saveButton"
            size="regular"
            theme="primary"
            type="submit"
            variant="contained"
            onClick={() => onSave(selectedOption)}>
            Save
          </Button>
        </div>
      </div>
    </dialog>
  );
};

export default RelatedTermsModal;
