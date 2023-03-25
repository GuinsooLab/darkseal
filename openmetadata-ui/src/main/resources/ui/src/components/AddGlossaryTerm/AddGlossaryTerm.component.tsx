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

import { CheckOutlined, PlusOutlined } from '@ant-design/icons';
import { Space, Switch } from 'antd';
import classNames from 'classnames';
import Tags from 'components/Tag/Tags/tags';
import { t } from 'i18next';
import { cloneDeep, isEmpty, isUndefined } from 'lodash';
import { EntityTags } from 'Models';
import React, { useEffect, useRef, useState } from 'react';
import { allowedNameRegEx } from '../../constants/regex.constants';
import { PageLayoutType } from '../../enums/layout.enum';
import { CreateGlossaryTerm } from '../../generated/api/data/createGlossaryTerm';
import {
  GlossaryTerm,
  TermReference,
} from '../../generated/entity/data/glossaryTerm';
import { EntityReference } from '../../generated/type/entityReference';
import { errorMsg, isValidUrl, requiredField } from '../../utils/CommonUtils';
import SVGIcons from '../../utils/SvgUtils';
import { AddTags } from '../AddTags/add-tags.component';
import { Button } from '../buttons/Button/Button';
import RichTextEditor from '../common/rich-text-editor/RichTextEditor';
import { EditorContentRef } from '../common/rich-text-editor/RichTextEditor.interface';
import TitleBreadcrumb from '../common/title-breadcrumb/title-breadcrumb.component';
import PageLayout from '../containers/PageLayout';
import Loader from '../Loader/Loader';
import RelatedTermsModal from '../Modals/RelatedTermsModal/RelatedTermsModal';
import ReviewerModal from '../Modals/ReviewerModal/ReviewerModal.component';
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
  const [showReviewerModal, setShowReviewerModal] = useState(false);
  const [showRelatedTermsModal, setShowRelatedTermsModal] = useState(false);
  const [reviewer, setReviewer] = useState<Array<EntityReference>>([]);
  const [tags, setTags] = useState<EntityTags[]>([]);
  const [relatedTerms, setRelatedTerms] = useState<GlossaryTerm[]>([]);
  const [synonyms, setSynonyms] = useState('');
  const [mutuallyExclusive, setMutuallyExclusive] = useState(false);
  const [references, setReferences] = useState<TermReference[]>([]);

  useEffect(() => {
    if (glossaryData?.reviewers && glossaryData?.reviewers.length) {
      setReviewer(glossaryData?.reviewers);
    }
  }, [glossaryData]);

  const getDescription = () => {
    return markdownRef.current?.getEditorContent() || '';
  };

  const onRelatedTermsModalCancel = () => {
    setShowRelatedTermsModal(false);
  };

  const handleRelatedTermsSave = (terms: GlossaryTerm[]) => {
    setRelatedTerms(terms);
    onRelatedTermsModalCancel();
  };

  const onReviewerModalCancel = () => {
    setShowReviewerModal(false);
  };

  const handleReviewerSave = (reviewer: Array<EntityReference>) => {
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
      invalidName: allowedNameRegEx.test(name),
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

    const updatedTerms = relatedTerms.map(function (term) {
      return term.fullyQualifiedName || '';
    });
    const updatedReviewers = reviewer.map(function (r) {
      return r.fullyQualifiedName || '';
    });

    if (validateForm(updatedReference)) {
      const updatedName = name.trim();
      const data: CreateGlossaryTerm = {
        name: updatedName,
        displayName: updatedName,
        description: getDescription(),
        reviewers: updatedReviewers.length > 0 ? updatedReviewers : undefined,
        relatedTerms: relatedTerms.length > 0 ? updatedTerms : undefined,
        references: updatedReference.length > 0 ? updatedReference : undefined,
        parent: !isUndefined(parentGlossaryData)
          ? parentGlossaryData.fullyQualifiedName
          : undefined,
        synonyms: synonyms ? synonyms.split(',') : undefined,
        mutuallyExclusive,
        glossary: glossaryData.name,
        tags: tags,
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
            <CheckOutlined />
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
            {t('label.save')}
          </Button>
        )}
      </>
    ) : null;
  };

  const fetchRightPanel = () => {
    return (
      <>
        <h6 className="tw-heading tw-text-base">
          {t('label.configure-entity', {
            entity: t('label.glossary-term'),
          })}
        </h6>
        <div className="tw-mb-5">
          {t('message.configure-glossary-term-description')}
        </div>
      </>
    );
  };

  return (
    <PageLayout
      classes="tw-max-w-full-hd tw-h-full tw-pt-4"
      header={<TitleBreadcrumb titleLinks={slashedBreadcrumb} />}
      layout={PageLayoutType['2ColRTL']}
      pageTitle={t('label.add-entity', { entity: t('label.glossary-term') })}
      rightPanel={fetchRightPanel()}>
      <div className="tw-form-container">
        <h6 className="tw-heading tw-text-base">
          {t('label.add-entity', {
            entity: t('label.glossary-term'),
          })}
        </h6>
        <div className="tw-pb-3" data-testid="add-glossary-term">
          <Field>
            <label className="tw-block tw-form-label" htmlFor="name">
              {requiredField(`${t('label.name')}:`)}
            </label>

            <input
              className="tw-form-inputs tw-form-inputs-padding"
              data-testid="name"
              id="name"
              name="name"
              placeholder={t('label.name')}
              type="text"
              value={name}
              onChange={handleValidation}
            />

            {showErrorMsg.name
              ? errorMsg(
                  t('message.field-text-is-required', {
                    fieldText: `${t('label.glossary-term')} ${t('label.name')}`,
                  })
                )
              : showErrorMsg.invalidName
              ? errorMsg(
                  t('message.field-text-is-invalid', {
                    fieldText: `${t('label.glossary-term')} ${t('label.name')}`,
                  })
                )
              : null}
          </Field>

          <Field>
            <label
              className="tw-block tw-form-label tw-mb-0"
              htmlFor="description">
              {requiredField(`${t('label.description')}:`)}
            </label>
            <RichTextEditor
              data-testid="description"
              initialValue={description}
              readonly={!allowAccess}
              ref={markdownRef}
            />
            {showErrorMsg.description &&
              errorMsg(
                t('label.field-required', {
                  field: t('label.description'),
                })
              )}
          </Field>

          <Field>
            <Space
              className="w-full"
              data-testid="tags-container"
              direction="vertical">
              <label htmlFor="tags">{`${t('label.tag-plural')}:`}</label>
              <AddTags
                data-testid="tags"
                setTags={(tag: EntityTags[]) => setTags(tag)}
              />
            </Space>
          </Field>

          <Field>
            <label className="tw-block tw-form-label" htmlFor="synonyms">
              {`${t('label.synonym-plural')}:`}
            </label>

            <input
              className="tw-form-inputs tw-form-inputs-padding"
              data-testid="synonyms"
              id="synonyms"
              name="synonyms"
              placeholder={t('message.enter-comma-separated-field', {
                field: t('label.keyword-lowercase-plural'),
              })}
              type="text"
              value={synonyms}
              onChange={handleValidation}
            />
          </Field>

          <div className="m-t-lg">
            <Field>
              <Space align="end">
                <label
                  className="tw-form-label m-b-0"
                  data-testid="mutually-exclusive-label"
                  htmlFor="mutuallyExclusive">
                  {t('label.mutually-exclusive')}
                </label>
                <Switch
                  checked={mutuallyExclusive}
                  data-testid="mutually-exclusive-button"
                  id="mutuallyExclusive"
                  onChange={(value) => setMutuallyExclusive(value)}
                />
              </Space>
            </Field>

            <Field>
              <Space align="end" data-testid="references">
                <label className="tw-form-label m-b-0">
                  {t('label.reference-plural')}
                </label>
                <Button
                  className="tw-h-5 tw-px-2"
                  data-testid="add-reference"
                  size="x-small"
                  theme="primary"
                  variant="contained"
                  onClick={addReferenceFields}>
                  <PlusOutlined />
                </Button>
              </Space>
            </Field>

            {references.map((value, i) => (
              <div className="tw-flex tw-items-center" key={i}>
                <div className="tw-grid tw-grid-cols-2 tw-gap-x-2 tw-w-11/12">
                  <Field>
                    <input
                      className="tw-form-inputs tw-form-inputs-padding"
                      id={`name-${i}`}
                      name="key"
                      placeholder={t('label.name')}
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
                      placeholder={t('label.url-lowercase')}
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
                    alt={t('message.valid-url-endpoint')}
                    icon="icon-delete"
                    title="Delete"
                    width="16px"
                  />
                </button>
              </div>
            ))}
            {showErrorMsg.invalidReferences
              ? errorMsg(t('message.valid-url-endpoint'))
              : null}
          </div>

          <Field>
            <div className="tw-flex tw-items-center tw-mt-4">
              <p className="w-form-label tw-mr-3">
                {t('label.related-term-plural')}
              </p>
              <Button
                className="tw-h-5 tw-px-2"
                data-testid="add-related-terms"
                size="x-small"
                theme="primary"
                variant="contained"
                onClick={() => setShowRelatedTermsModal(true)}>
                <PlusOutlined />
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
                      tag={d.name ?? ''}
                      type="contained"
                    />
                  );
                })}
            </div>
          </Field>
          <Field>
            <div className="tw-flex tw-items-center tw-mt-4">
              <p className="w-form-label tw-mr-3">
                {t('label.reviewer-plural')}
              </p>
              <Button
                className="tw-h-5 tw-px-2"
                data-testid="add-reviewers"
                size="x-small"
                theme="primary"
                variant="contained"
                onClick={() => setShowReviewerModal(true)}>
                <PlusOutlined />
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
                      tag={d.name ?? ''}
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
              {t('label.cancel')}
            </Button>
            {getSaveButton()}
          </Field>
        </div>

        <RelatedTermsModal
          header={t('label.add-entity', {
            entity: t('label.related-term-plural'),
          })}
          relatedTerms={relatedTerms}
          visible={showRelatedTermsModal}
          onCancel={onRelatedTermsModalCancel}
          onSave={handleRelatedTermsSave}
        />

        <ReviewerModal
          header={t('label.add-entity', {
            entity: t('label.reviewer-plural'),
          })}
          reviewer={reviewer}
          visible={showReviewerModal}
          onCancel={onReviewerModalCancel}
          onSave={handleReviewerSave}
        />
      </div>
    </PageLayout>
  );
};

export default AddGlossaryTerm;
