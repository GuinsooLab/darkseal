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
import { cloneDeep, isEmpty, isUndefined } from 'lodash';
import {
  EditorContentRef,
  FormattedGlossaryTermData,
  FormattedUsersData,
} from 'Models';
import React, { useEffect, useRef, useState } from 'react';
import { PageLayoutType } from '../../enums/layout.enum';
import { CreateGlossaryTerm } from '../../generated/api/data/createGlossaryTerm';
import { TermReference } from '../../generated/entity/data/glossaryTerm';
import {
  errorMsg,
  isUrlFriendlyName,
  isValidUrl,
  requiredField,
} from '../../utils/CommonUtils';
import SVGIcons from '../../utils/SvgUtils';
import { Button } from '../buttons/Button/Button';
import RichTextEditor from '../common/rich-text-editor/RichTextEditor';
import TitleBreadcrumb from '../common/title-breadcrumb/title-breadcrumb.component';
import PageLayout from '../containers/PageLayout';
import Loader from '../Loader/Loader';
import RelatedTermsModal from '../Modals/RelatedTermsModal/RelatedTermsModal';
import ReviewerModal from '../Modals/ReviewerModal/ReviewerModal.component';
import Tags from '../tags/tags';
import { AddGlossaryTermProps } from './AddGlossaryTerm.interface';

const Field = ({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return <div className={classNames('tw-mt-4', className)}>{children}</div>;
};

const AddGlossaryTerm = ({
  parentGlossaryData,
  allowAccess,
  glossaryData,
  onSave,
  onCancel,
  slashedBreadcrumb,
  saveState = 'initial',
}: AddGlossaryTermProps) => {
  const markdownRef = useRef<EditorContentRef>();

  const [showErrorMsg, setShowErrorMsg] = useState<{ [key: string]: boolean }>({
    name: false,
    invalidName: false,
    invalidReferences: false,
    description: false,
  });

  const [name, setName] = useState('');
  const [description] = useState<string>('');
  const [showRevieweModal, setShowRevieweModal] = useState(false);
  const [showRelatedTermsModal, setShowRelatedTermsModal] = useState(false);
  const [reviewer, setReviewer] = useState<Array<FormattedUsersData>>([]);
  const [relatedTerms, setRelatedTerms] = useState<
    Array<FormattedGlossaryTermData>
  >([]);
  const [synonyms, setSynonyms] = useState('');
  const [references, setReferences] = useState<TermReference[]>([]);

  useEffect(() => {
    if (glossaryData?.reviewers && glossaryData?.reviewers.length) {
      setReviewer(glossaryData?.reviewers as FormattedUsersData[]);
    }
  }, [glossaryData]);

  const getDescription = () => {
    return markdownRef.current?.getEditorContent() || '';
  };

  const onRelatedTermsModalCancel = () => {
    setShowRelatedTermsModal(false);
  };

  const handleRelatedTermsSave = (terms: Array<FormattedGlossaryTermData>) => {
    setRelatedTerms(terms);
    onRelatedTermsModalCancel();
  };

  const onReviewerModalCancel = () => {
    setShowRevieweModal(false);
  };

  const handleReviewerSave = (reviewer: Array<FormattedUsersData>) => {
    setReviewer(reviewer);
    onReviewerModalCancel();
  };

  const handleReviewerRemove = (
    _event: React.MouseEvent<HTMLElement, MouseEvent>,
    removedTag: string
  ) => {
    setReviewer((pre) => pre.filter((option) => option.name !== removedTag));
  };

  const handleTermRemove = (
    _event: React.MouseEvent<HTMLElement, MouseEvent>,
    removedTag: string
  ) => {
    setRelatedTerms((pre) =>
      pre.filter((option) => option.name !== removedTag)
    );
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

      case 'synonyms': {
        setSynonyms(value);

        break;
      }
    }
    setShowErrorMsg((prev) => {
      return { ...prev, name, invalidName };
    });
  };

  const addReferenceFields = () => {
    setReferences([...references, { name: '', endpoint: '' }]);
  };

  const removeReferenceFields = (i: number) => {
    const newFormValues = [...references];
    newFormValues.splice(i, 1);
    setReferences(newFormValues);
  };

  const handleReferenceFieldsChange = (
    i: number,
    field: keyof TermReference,
    value: string
  ) => {
    const newFormValues = [...references];
    newFormValues[i][field] = value;
    setReferences(newFormValues);
    setShowErrorMsg((prev) => {
      return { ...prev, invalidReferences: false };
    });
  };

  const isValidReferences = (refs: TermReference[]): boolean => {
    let retVal = true;
    for (const ref of refs) {
      if (!isValidUrl(ref.endpoint || '')) {
        retVal = false;

        break;
      }
    }

    return retVal;
  };

  const validateForm = (refs: TermReference[]) => {
    const errMsg = {
      name: !name.trim(),
      invalidName: !isUrlFriendlyName(name.trim()),
      invalidReferences: !isValidReferences(refs),
      description: !getDescription()?.trim(),
    };
    setShowErrorMsg(errMsg);

    return !Object.values(errMsg).includes(true);
  };

  const handleSave = () => {
    const updatedReference = references
      .map((ref) => ({
        name: ref.name?.trim(),
        endpoint: ref.endpoint?.trim(),
      }))
      .filter((ref) => !isEmpty(ref.endpoint) && !isEmpty(ref.name));

    const updatedTerms = relatedTerms.map((term) => ({
      id: term.id,
      type: term.type,
    }));

    if (validateForm(updatedReference)) {
      const data: CreateGlossaryTerm = {
        name,
        displayName: name,
        description: getDescription(),
        reviewers: reviewer.map((r) => ({
          id: r.id,
          type: r.type,
        })),
        relatedTerms: relatedTerms.length > 0 ? updatedTerms : undefined,
        references: updatedReference.length > 0 ? updatedReference : undefined,
        parent: !isUndefined(parentGlossaryData)
          ? {
              type: 'glossaryTerm',
              id: parentGlossaryData.id,
            }
          : undefined,
        synonyms: synonyms ? synonyms.split(',') : undefined,
        glossary: {
          id: glossaryData.id,
          type: 'glossary',
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
            data-testid="save-glossary-term"
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
        <h6 className="tw-heading tw-text-base">Configure Glossary Term</h6>
        <div className="tw-mb-5">
          Every term in the glossary has a unique definition. Along with
          defining the standard term for a concept, the synonyms as well as
          related terms (for e.g., parent and child terms) can be specified.
          References can be added to the assets related to the terms. New terms
          can be added or updated to the Glossary. The glossary terms can be
          reviewed by certain users, who can accept or reject the terms.
        </div>
        {/* {getDocButton('Read Glossary Term Doc', '', 'glossary-term-doc')} */}
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
        <h6 className="tw-heading tw-text-base">Add Glossary Term</h6>
        <div className="tw-pb-3" data-testid="add-glossary-term">
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
              ? errorMsg('Glossary term name is required.')
              : showErrorMsg.invalidName
              ? errorMsg('Glossary term name is invalid.')
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

          <Field>
            <label className="tw-block tw-form-label" htmlFor="synonyms">
              Synonyms:
            </label>

            <input
              className="tw-form-inputs tw-form-inputs-padding"
              data-testid="synonyms"
              id="synonyms"
              name="synonyms"
              placeholder="Enter comma seprated keywords"
              type="text"
              value={synonyms}
              onChange={handleValidation}
            />
          </Field>

          <div data-testid="references">
            <div className="tw-flex tw-items-center tw-mt-6">
              <p className="w-form-label tw-mr-3">References</p>
              <Button
                className="tw-h-5 tw-px-2"
                size="x-small"
                theme="primary"
                variant="contained"
                onClick={addReferenceFields}>
                <FontAwesomeIcon icon="plus" />
              </Button>
            </div>

            {references.map((value, i) => (
              <div className="tw-flex tw-items-center" key={i}>
                <div className="tw-grid tw-grid-cols-2 tw-gap-x-2 tw-w-11/12">
                  <Field>
                    <input
                      className="tw-form-inputs tw-form-inputs-padding"
                      id={`name-${i}`}
                      name="key"
                      placeholder="Name"
                      type="text"
                      value={value.name}
                      onChange={(e) =>
                        handleReferenceFieldsChange(i, 'name', e.target.value)
                      }
                    />
                  </Field>
                  <Field>
                    <input
                      className="tw-form-inputs tw-form-inputs-padding"
                      id={`url-${i}`}
                      name="endpoint"
                      placeholder="url"
                      type="text"
                      value={value.endpoint}
                      onChange={(e) =>
                        handleReferenceFieldsChange(
                          i,
                          'endpoint',
                          e.target.value
                        )
                      }
                    />
                  </Field>
                </div>
                <button
                  className="focus:tw-outline-none tw-mt-3 tw-w-1/12"
                  onClick={(e) => {
                    removeReferenceFields(i);
                    e.preventDefault();
                  }}>
                  <SVGIcons
                    alt="delete"
                    icon="icon-delete"
                    title="Delete"
                    width="16px"
                  />
                </button>
              </div>
            ))}
            {showErrorMsg.invalidReferences
              ? errorMsg('Endpoints should be valid URL.')
              : null}
          </div>

          <Field>
            <div className="tw-flex tw-items-center tw-mt-4">
              <p className="w-form-label tw-mr-3">Related terms </p>
              <Button
                className="tw-h-5 tw-px-2"
                size="x-small"
                theme="primary"
                variant="contained"
                onClick={() => setShowRelatedTermsModal(true)}>
                <FontAwesomeIcon icon="plus" />
              </Button>
            </div>
            <div className="tw-my-4">
              {Boolean(relatedTerms.length) &&
                relatedTerms.map((d, index) => {
                  return (
                    <Tags
                      editable
                      isRemovable
                      className="tw-bg-gray-200"
                      key={index}
                      removeTag={handleTermRemove}
                      tag={d.name}
                      type="contained"
                    />
                  );
                })}
            </div>
          </Field>
          <Field>
            <div className="tw-flex tw-items-center tw-mt-4">
              <p className="w-form-label tw-mr-3">Reviewers </p>
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
            <div className="tw-my-4">
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
          </Field>

          <Field className="tw-flex tw-justify-end">
            <Button
              data-testid="cancel-glossary-term"
              size="regular"
              theme="primary"
              variant="text"
              onClick={onCancel}>
              Cancel
            </Button>
            {getSaveButton()}
          </Field>
        </div>

        {showRelatedTermsModal && (
          <RelatedTermsModal
            header="Add Related Terms"
            relatedTerms={relatedTerms}
            onCancel={onRelatedTermsModalCancel}
            onSave={handleRelatedTermsSave}
          />
        )}

        {showRevieweModal && (
          <ReviewerModal
            header="Add Reviewers"
            reviewer={reviewer}
            onCancel={onReviewerModalCancel}
            onSave={handleReviewerSave}
          />
        )}
      </div>
    </PageLayout>
  );
};

export default AddGlossaryTerm;
