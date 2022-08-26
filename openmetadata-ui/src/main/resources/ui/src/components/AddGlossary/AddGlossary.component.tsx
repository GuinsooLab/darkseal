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

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import classNames from 'classnames';
import { cloneDeep } from 'lodash';
import { EditorContentRef, FormattedUsersData } from 'Models';
import React, { useRef, useState } from 'react';
import { UrlEntityCharRegEx } from '../../constants/regex.constants';
import { PageLayoutType } from '../../enums/layout.enum';
import { CreateGlossary } from '../../generated/api/data/createGlossary';
import {
  errorMsg,
  getCurrentUserId,
  requiredField,
} from '../../utils/CommonUtils';
import { Button } from '../buttons/Button/Button';
import RichTextEditor from '../common/rich-text-editor/RichTextEditor';
import TitleBreadcrumb from '../common/title-breadcrumb/title-breadcrumb.component';
import PageLayout from '../containers/PageLayout';
import Loader from '../Loader/Loader';
import ReviewerModal from '../Modals/ReviewerModal/ReviewerModal.component';
import Tags from '../tags/tags';
import { AddGlossaryProps } from './AddGlossary.interface';

const Field = ({ children }: { children: React.ReactNode }) => {
  return <div className="tw-mt-4">{children}</div>;
};

const AddGlossary = ({
  header,
  allowAccess = true,
  saveState = 'initial',
  slashedBreadcrumb,
  onCancel,
  onSave,
}: AddGlossaryProps) => {
  const markdownRef = useRef<EditorContentRef>();

  const [showErrorMsg, setShowErrorMsg] = useState<{ [key: string]: boolean }>({
    name: false,
    invalidName: false,
    description: false,
  });

  const [name, setName] = useState('');
  const [description] = useState<string>('');
  const [showRevieweModal, setShowRevieweModal] = useState(false);
  const [reviewer, setReviewer] = useState<Array<FormattedUsersData>>([]);

  const getDescription = () => {
    return markdownRef.current?.getEditorContent() || '';
  };

  const onReviewerModalCancel = () => {
    setShowRevieweModal(false);
  };

  const handleReviewerSave = (reviewer: Array<FormattedUsersData>) => {
    setReviewer(reviewer);
    onReviewerModalCancel();
  };

  const handleValidation = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    if (!allowAccess) {
      return;
    }
    const value = event.target.value;
    const eleName = event.target.name;
    let { name, invalidName } = cloneDeep(showErrorMsg);

    switch (eleName) {
      case 'name': {
        setName(value);
        name = false;
        invalidName = false;

        break;
      }
    }
    setShowErrorMsg((prev) => {
      return { ...prev, name, invalidName };
    });
  };

  const handleReviewerRemove = (
    _event: React.MouseEvent<HTMLElement, MouseEvent>,
    removedTag: string
  ) => {
    setReviewer((pre) => pre.filter((option) => option.name !== removedTag));
  };

  const validateForm = () => {
    const errMsg = {
      name: !name.trim(),
      invalidName: UrlEntityCharRegEx.test(name.trim()),
      description: !getDescription()?.trim(),
    };
    setShowErrorMsg(errMsg);

    return !Object.values(errMsg).includes(true);
  };

  const handleSave = () => {
    if (validateForm()) {
      const data: CreateGlossary = {
        name,
        displayName: name,
        description: getDescription(),
        reviewers: reviewer.map((d) => ({ id: d.id, type: d.type })),
        owner: {
          id: getCurrentUserId(),
          type: 'user',
        },
      };

      onSave(data);
    }
  };

  const getSaveButton = () => {
    return allowAccess ? (
      <>
        {saveState === 'waiting' ? (
          <Button
            disabled
            className="tw-w-16 tw-h-10 disabled:tw-opacity-100"
            size="regular"
            theme="primary"
            variant="contained">
            <Loader size="small" type="white" />
          </Button>
        ) : saveState === 'success' ? (
          <Button
            disabled
            className="tw-w-16 tw-h-10 disabled:tw-opacity-100"
            size="regular"
            theme="primary"
            variant="contained">
            <FontAwesomeIcon icon="check" />
          </Button>
        ) : (
          <Button
            className={classNames('tw-w-16 tw-h-10', {
              'tw-opacity-40': !allowAccess,
            })}
            data-testid="save-glossary"
            size="regular"
            theme="primary"
            variant="contained"
            onClick={handleSave}>
            Save
          </Button>
        )}
      </>
    ) : null;
  };

  const fetchRightPanel = () => {
    return (
      <>
        <h6 className="tw-heading tw-text-base">Configure Glossary</h6>
        <div className="tw-mb-5">
          A Glossary is a controlled vocabulary used to define the concepts and
          terminology in an organization. Glossaries can be specific to a
          certain domain (for e.g., Business Glossary, Technical Glossary). In
          the glossary, the standard terms and concepts can be defined along
          with the synonyms, and related terms. Control can be established over
          how and who can add the terms in the glossary.
        </div>
        {/* {getDocButton('Read Glossary Doc', '', 'glossary-doc')} */}
      </>
    );
  };

  return (
    <PageLayout
      classes="tw-max-w-full-hd tw-h-full tw-pt-4"
      header={<TitleBreadcrumb titleLinks={slashedBreadcrumb} />}
      layout={PageLayoutType['2ColRTL']}
      rightPanel={fetchRightPanel()}>
      <div className="tw-form-container">
        <h6 className="tw-heading tw-text-base">{header}</h6>
        <div className="tw-pb-3" data-testid="add-glossary">
          <Field>
            <label className="tw-block tw-form-label" htmlFor="name">
              {requiredField('Name:')}
            </label>

            <input
              className="tw-form-inputs tw-form-inputs-padding"
              data-testid="name"
              id="name"
              name="name"
              placeholder="Name"
              type="text"
              value={name}
              onChange={handleValidation}
            />

            {showErrorMsg.name
              ? errorMsg('Glossary name is required.')
              : showErrorMsg.invalidName
              ? errorMsg('Glossary name is invalid.')
              : null}
          </Field>
          <Field>
            <label
              className="tw-block tw-form-label tw-mb-0"
              htmlFor="description">
              {requiredField('Description:')}
            </label>
            <RichTextEditor
              data-testid="description"
              initialValue={description}
              readonly={!allowAccess}
              ref={markdownRef}
            />
            {showErrorMsg.description && errorMsg('Description is required.')}
          </Field>

          <div>
            <div className="tw-flex tw-items-center tw-mt-4">
              <span className="w-form-label tw-mr-3">Reviewers: </span>
              <Button
                className="tw-h-5 tw-px-2"
                data-testid="add-reviewers"
                size="x-small"
                theme="primary"
                variant="contained"
                onClick={() => setShowRevieweModal(true)}>
                <FontAwesomeIcon icon="plus" />
              </Button>
            </div>
            <div className="tw-my-4" data-testid="reviewers-container">
              {Boolean(reviewer.length) &&
                reviewer.map((d, index) => {
                  return (
                    <Tags
                      editable
                      isRemovable
                      className="tw-bg-gray-200"
                      key={index}
                      removeTag={handleReviewerRemove}
                      tag={d.name}
                      type="contained"
                    />
                  );
                })}
            </div>
          </div>

          <div className="tw-flex tw-justify-end">
            <Button
              data-testid="cancel-glossary"
              size="regular"
              theme="primary"
              variant="text"
              onClick={onCancel}>
              Cancel
            </Button>
            {getSaveButton()}
          </div>
        </div>

        {showRevieweModal && (
          <ReviewerModal
            header="Add Reviewer"
            reviewer={reviewer}
            onCancel={onReviewerModalCancel}
            onSave={handleReviewerSave}
          />
        )}
      </div>
    </PageLayout>
  );
};

export default AddGlossary;
