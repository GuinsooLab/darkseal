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

import { Form, InputNumber, Select, Typography } from 'antd';
import { isNil } from 'lodash';
import React, { Fragment, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { PROFILE_SAMPLE_OPTIONS } from '../../../constants/profiler.constant';
import { FilterPatternEnum } from '../../../enums/filterPattern.enum';
import { FormSubmitType } from '../../../enums/form.enum';
import { ServiceCategory } from '../../../enums/service.enum';
import { ProfileSampleType } from '../../../generated/entity/data/table';
import { PipelineType } from '../../../generated/entity/services/ingestionPipelines/ingestionPipeline';
import { getSeparator } from '../../../utils/CommonUtils';
import { Button } from '../../buttons/Button/Button';
import FilterPattern from '../../common/FilterPattern/FilterPattern';
import RichTextEditor from '../../common/rich-text-editor/RichTextEditor';
import { EditorContentRef } from '../../common/rich-text-editor/RichTextEditor.interface';
import ToggleSwitchV1 from '../../common/toggle-switch/ToggleSwitchV1';
import { Field } from '../../Field/Field';
import SliderWithInput from '../../SliderWithInput/SliderWithInput';
import {
  AddIngestionState,
  ConfigureIngestionProps,
  ShowFilter,
} from '../addIngestion.interface';

const ConfigureIngestion = ({
  data,
  formType,
  getExcludeValue,
  getIncludeValue,
  handleShowFilter,
  onCancel,
  onChange,
  onNext,
  pipelineType,
  serviceCategory,
}: ConfigureIngestionProps) => {
  const { t } = useTranslation();
  const markdownRef = useRef<EditorContentRef>();

  const {
    chartFilterPattern,
    dashboardFilterPattern,
    databaseFilterPattern,
    databaseServiceNames,
    description,
    enableDebugLog,
    includeLineage,
    includeTags,
    includeView,
    ingestionName,
    ingestSampleData,
    markAllDeletedTables,
    markDeletedTables,
    mlModelFilterPattern,
    pipelineFilterPattern,
    profileSample,
    profileSampleType,
    queryLogDuration,
    resultLimit,
    schemaFilterPattern,
    showChartFilter,
    showDashboardFilter,
    showDatabaseFilter,
    showMlModelFilter,
    showPipelineFilter,
    showSchemaFilter,
    showTableFilter,
    showTopicFilter,
    stageFileLocation,
    tableFilterPattern,
    threadCount,
    timeoutSeconds,
    topicFilterPattern,
    useFqnFilter,
  } = useMemo(
    () => ({
      chartFilterPattern: data.chartFilterPattern,
      dashboardFilterPattern: data.dashboardFilterPattern,
      databaseFilterPattern: data.databaseFilterPattern,
      databaseServiceNames: data.databaseServiceNames,
      description: data.description,
      enableDebugLog: data.enableDebugLog,
      includeLineage: data.includeLineage,
      includeTags: data.includeTags,
      includeView: data.includeView,
      ingestionName: data.ingestionName,
      ingestSampleData: data.ingestSampleData,
      markAllDeletedTables: data.markAllDeletedTables,
      markDeletedTables: data.markDeletedTables,
      mlModelFilterPattern: data.mlModelFilterPattern,
      pipelineFilterPattern: data.pipelineFilterPattern,
      profileSample: data.profileSample,
      profileSampleType: data.profileSampleType,
      queryLogDuration: data.queryLogDuration,
      resultLimit: data.resultLimit,
      schemaFilterPattern: data.schemaFilterPattern,
      showChartFilter: data.showChartFilter,
      showDashboardFilter: data.showDashboardFilter,
      showDatabaseFilter: data.showDatabaseFilter,
      showMlModelFilter: data.showMlModelFilter,
      showPipelineFilter: data.showPipelineFilter,
      showSchemaFilter: data.showSchemaFilter,
      showTableFilter: data.showTableFilter,
      showTopicFilter: data.showTopicFilter,
      stageFileLocation: data.stageFileLocation,
      tableFilterPattern: data.tableFilterPattern,
      threadCount: data.threadCount,
      timeoutSeconds: data.timeoutSeconds,
      topicFilterPattern: data.topicFilterPattern,
      useFqnFilter: data.useFqnFilter,
    }),
    [data]
  );

  const toggleField = (field: keyof AddIngestionState) =>
    onChange({ [field]: !data[field] });

  const handleValueParseInt =
    (property: keyof AddIngestionState) =>
    (event: React.ChangeEvent<HTMLInputElement>) =>
      onChange({
        [property]: parseInt(event.target.value),
      });

  const handleValueChange =
    (property: keyof AddIngestionState) =>
    (event: React.ChangeEvent<HTMLInputElement>) =>
      onChange({
        [property]: event.target.value,
      });

  const handleProfileSample = (profileSample: number | undefined | null) =>
    onChange({
      profileSample: profileSample ?? undefined,
    });

  const handleProfileSampleTypeChange = (value: ProfileSampleType) => {
    onChange({
      profileSampleType: value,
    });

    handleProfileSample(undefined);
  };

  const handleDashBoardServiceNames = (inputValue: string) => {
    const separator = ',';

    const databaseNames = inputValue.includes(separator)
      ? inputValue.split(separator)
      : Array(inputValue);

    if (databaseNames) {
      onChange({
        databaseServiceNames: databaseNames,
      });
    }
  };

  const handleEnableDebugLogCheck = () => toggleField('enableDebugLog');

  const handleIncludeLineage = () => toggleField('includeLineage');

  const handleIncludeTags = () => toggleField('includeTags');

  const handleIncludeViewToggle = () => toggleField('includeView');

  const handleIngestSampleToggle = () => toggleField('ingestSampleData');

  const handleMarkAllDeletedTables = () => toggleField('markAllDeletedTables');

  const handleMarkDeletedTables = () => toggleField('markDeletedTables');

  const handleFqnFilter = () => toggleField('useFqnFilter');

  const handleQueryLogDuration = handleValueParseInt('queryLogDuration');

  const handleResultLimit = handleValueParseInt('resultLimit');

  const handleStageFileLocation = handleValueChange('stageFileLocation');

  const handleThreadCount = handleValueParseInt('threadCount');

  const handleTimeoutSeconds = handleValueParseInt('timeoutSeconds');

  const handleIngestionName = handleValueChange('ingestionName');

  const getIngestSampleToggle = (label: string, desc: string) => {
    return (
      <>
        <Field>
          <div className="tw-flex tw-gap-1">
            <label>{label}</label>
            <ToggleSwitchV1
              checked={ingestSampleData}
              handleCheck={handleIngestSampleToggle}
              testId="ingest-sample-data"
            />
          </div>
          <p className="tw-text-grey-muted tw-mt-3">{desc}</p>
        </Field>
        {getSeparator('')}
      </>
    );
  };

  const getDebugLogToggle = () => {
    return (
      <Field>
        <div className="tw-flex tw-gap-1">
          <label>{t('label.enable-debug-log')}</label>
          <ToggleSwitchV1
            checked={enableDebugLog}
            handleCheck={handleEnableDebugLogCheck}
            testId="enable-debug-log"
          />
        </div>
        <p className="tw-text-grey-muted tw-mt-3">
          {t('message.enable-debug-logging')}
        </p>
        {getSeparator('')}
      </Field>
    );
  };

  const getProfileSample = () => {
    return (
      <>
        <Form.Item
          className="m-t-sm"
          initialValue={profileSampleType || ProfileSampleType.Percentage}
          label={t('label.profile-sample-type', {
            type: t('label.type'),
          })}
          name="profileSample">
          <Select
            data-testid="profile-sample"
            options={PROFILE_SAMPLE_OPTIONS}
            value={profileSampleType}
            onChange={handleProfileSampleTypeChange}
          />
        </Form.Item>
        <Form.Item
          className="m-b-xs"
          label={t('label.profile-sample-type', {
            type: t('label.value'),
          })}
          name="profile-sample-value">
          {profileSampleType === ProfileSampleType.Percentage && (
            <>
              <Typography.Paragraph className="text-grey-muted m-t-0 m-b-xs text-sm">
                {t('message.profile-sample-percentage-message')}
              </Typography.Paragraph>
              <SliderWithInput
                value={profileSample || 100}
                onChange={handleProfileSample}
              />
            </>
          )}
          {profileSampleType === ProfileSampleType.Rows && (
            <>
              <Typography.Paragraph className="text-grey-muted m-t-0 m-b-xs text-sm">
                {t('message.profile-sample-row-count-message')}
              </Typography.Paragraph>
              <InputNumber
                className="w-full"
                data-testid="metric-number-input"
                min={0}
                placeholder={t('label.please-enter-value', {
                  name: t('label.row-count-lowercase'),
                })}
                value={profileSample}
                onChange={handleProfileSample}
              />
            </>
          )}
        </Form.Item>
      </>
    );
  };

  const getThreadCount = () => {
    return (
      <div>
        <label>{t('label.thread-count')}</label>
        <p className="tw-text-grey-muted tw-mt-1 tw-mb-2 tw-text-sm">
          {t('message.thread-count-message')}
        </p>
        <input
          className="tw-form-inputs tw-form-inputs-padding tw-w-24"
          data-testid="threadCount"
          id="threadCount"
          name="threadCount"
          placeholder="5"
          type="number"
          value={threadCount}
          onChange={handleThreadCount}
        />
      </div>
    );
  };

  const getTimeoutSeconds = () => {
    return (
      <div>
        <label>{t('label.profiler-timeout-second-plural-label')}</label>
        <p className="tw-text-grey-muted tw-mt-1 tw-mb-2 tw-text-sm">
          {t('message.profiler-timeout-seconds-message')}
        </p>
        <input
          className="tw-form-inputs tw-form-inputs-padding tw-w-24"
          data-testid="timeoutSeconds"
          id="timeoutSeconds"
          name="timeoutSeconds"
          placeholder="43200"
          type="number"
          value={timeoutSeconds}
          onChange={handleTimeoutSeconds}
        />
      </div>
    );
  };

  const getDatabaseFieldToggles = () => {
    return (
      <>
        <div>
          <Field>
            <div className="tw-flex tw-gap-1">
              <label>
                {t('label.include-entity', { entity: t('label.view-plural') })}
              </label>
              <ToggleSwitchV1
                checked={includeView}
                handleCheck={handleIncludeViewToggle}
                testId="include-views"
              />
            </div>
            <p className="tw-text-grey-muted tw-mt-3">
              {t('message.include-assets-message', {
                assets: t('label.view-plural'),
              })}
            </p>
            {getSeparator('')}
          </Field>
          <Field>
            <div className="tw-flex tw-gap-1">
              <label>
                {t('label.include-entity', { entity: t('label.tag-plural') })}
              </label>
              <ToggleSwitchV1
                checked={includeTags}
                handleCheck={handleIncludeTags}
                testId="include-tags"
              />
            </div>
            <p className="tw-text-grey-muted tw-mt-3">
              {t('message.include-assets-message', {
                assets: t('label.tag-plural'),
              })}
            </p>
            {getSeparator('')}
          </Field>
          {getDebugLogToggle()}
          {!isNil(markDeletedTables) && (
            <Field>
              <div className="tw-flex tw-gap-1">
                <label>{t('label.mark-deleted-table-plural')}</label>
                <ToggleSwitchV1
                  checked={markDeletedTables}
                  handleCheck={handleMarkDeletedTables}
                  testId="mark-deleted"
                />
              </div>
              <p className="tw-text-grey-muted tw-mt-3">
                {t('message.mark-deleted-table-message')}
              </p>
              {getSeparator('')}
            </Field>
          )}
          {!isNil(markAllDeletedTables) && (
            <Field>
              <div className="tw-flex tw-gap-1">
                <label>{t('label.mark-all-deleted-table-plural')}</label>
                <ToggleSwitchV1
                  checked={markAllDeletedTables}
                  handleCheck={handleMarkAllDeletedTables}
                  testId="mark-deleted-filter-only"
                />
              </div>
              <p className="tw-text-grey-muted tw-mt-3">
                {t('message.mark-all-deleted-table-message')}
              </p>
              {getSeparator('')}
            </Field>
          )}
        </div>
      </>
    );
  };

  const getPipelineFieldToggles = () => {
    return (
      <div>
        <Field>
          <div className="tw-flex tw-gap-1">
            <label>
              {t('label.include-entity', {
                entity: t('label.lineage-lowercase'),
              })}
            </label>
            <ToggleSwitchV1
              checked={includeLineage}
              handleCheck={handleIncludeLineage}
              testId="include-lineage"
            />
          </div>
          <p className="tw-text-grey-muted tw-mt-3">
            {t('message.include-lineage-message')}
          </p>
          {getSeparator('')}
        </Field>
        {getDebugLogToggle()}
      </div>
    );
  };
  const getFqnForFilteringToggles = () => {
    return (
      <Field>
        <div className="tw-flex tw-gap-1">
          <label>{t('label.use-fqn-for-filtering')}</label>
          <ToggleSwitchV1
            checked={useFqnFilter}
            handleCheck={handleFqnFilter}
            testId="include-lineage"
          />
        </div>
        <p className="tw-text-grey-muted tw-mt-3">
          {t('message.use-fqn-for-filtering-message')}
        </p>
        {getSeparator('')}
      </Field>
    );
  };

  const getDashboardDBServiceName = () => {
    return (
      <Field>
        <label className="tw-block tw-form-label tw-mb-1" htmlFor="name">
          {t('label.database-service-name')}
        </label>
        <p className="tw-text-grey-muted tw-mt-1 tw-mb-2 tw-text-sm">
          {t('message.database-service-name-message')}
        </p>
        <input
          className="tw-form-inputs tw-form-inputs-padding"
          data-testid="name"
          id="name"
          name="name"
          type="text"
          value={databaseServiceNames}
          onChange={(e) => handleDashBoardServiceNames(e.target.value)}
        />
        {getSeparator('')}
      </Field>
    );
  };

  const getFilterPatterns = () => {
    return (
      <div>
        <FilterPattern
          checked={showDatabaseFilter}
          excludePattern={databaseFilterPattern?.excludes ?? []}
          getExcludeValue={getExcludeValue}
          getIncludeValue={getIncludeValue}
          handleChecked={(value) =>
            handleShowFilter(value, ShowFilter.showDatabaseFilter)
          }
          includePattern={databaseFilterPattern?.includes ?? []}
          type={FilterPatternEnum.DATABASE}
        />
        <FilterPattern
          checked={showSchemaFilter}
          excludePattern={schemaFilterPattern?.excludes ?? []}
          getExcludeValue={getExcludeValue}
          getIncludeValue={getIncludeValue}
          handleChecked={(value) =>
            handleShowFilter(value, ShowFilter.showSchemaFilter)
          }
          includePattern={schemaFilterPattern?.includes ?? []}
          type={FilterPatternEnum.SCHEMA}
        />
        <FilterPattern
          checked={showTableFilter}
          excludePattern={tableFilterPattern?.excludes ?? []}
          getExcludeValue={getExcludeValue}
          getIncludeValue={getIncludeValue}
          handleChecked={(value) =>
            handleShowFilter(value, ShowFilter.showTableFilter)
          }
          includePattern={tableFilterPattern?.includes ?? []}
          showSeparator={false}
          type={FilterPatternEnum.TABLE}
        />
      </div>
    );
  };

  const getMetadataFilterPatternField = () => {
    switch (serviceCategory) {
      case ServiceCategory.DATABASE_SERVICES:
        return (
          <Fragment>
            {getFilterPatterns()}
            {getSeparator('')}
            {getFqnForFilteringToggles()}
            {getDatabaseFieldToggles()}
          </Fragment>
        );
      case ServiceCategory.DASHBOARD_SERVICES:
        return (
          <Fragment>
            <FilterPattern
              checked={showDashboardFilter}
              excludePattern={dashboardFilterPattern.excludes ?? []}
              getExcludeValue={getExcludeValue}
              getIncludeValue={getIncludeValue}
              handleChecked={(value) =>
                handleShowFilter(value, ShowFilter.showDashboardFilter)
              }
              includePattern={dashboardFilterPattern.includes ?? []}
              type={FilterPatternEnum.DASHBOARD}
            />
            <FilterPattern
              checked={showChartFilter}
              excludePattern={chartFilterPattern.excludes ?? []}
              getExcludeValue={getExcludeValue}
              getIncludeValue={getIncludeValue}
              handleChecked={(value) =>
                handleShowFilter(value, ShowFilter.showChartFilter)
              }
              includePattern={chartFilterPattern.includes ?? []}
              showSeparator={false}
              type={FilterPatternEnum.CHART}
            />
            {getSeparator('')}
            {getDashboardDBServiceName()}
            {getDebugLogToggle()}
          </Fragment>
        );

      case ServiceCategory.MESSAGING_SERVICES:
        return (
          <Fragment>
            <FilterPattern
              checked={showTopicFilter}
              excludePattern={topicFilterPattern.excludes ?? []}
              getExcludeValue={getExcludeValue}
              getIncludeValue={getIncludeValue}
              handleChecked={(value) =>
                handleShowFilter(value, ShowFilter.showTopicFilter)
              }
              includePattern={topicFilterPattern.includes ?? []}
              showSeparator={false}
              type={FilterPatternEnum.TOPIC}
            />
            {getSeparator('')}
            {getIngestSampleToggle(
              t('label.ingest-sample-data'),
              t('message.ingest-sample-data-for-entity', {
                entity: t('label.topic-lowercase'),
              })
            )}
            {getDebugLogToggle()}
          </Fragment>
        );
      case ServiceCategory.PIPELINE_SERVICES:
        return (
          <Fragment>
            <FilterPattern
              checked={showPipelineFilter}
              excludePattern={pipelineFilterPattern.excludes ?? []}
              getExcludeValue={getExcludeValue}
              getIncludeValue={getIncludeValue}
              handleChecked={(value) =>
                handleShowFilter(value, ShowFilter.showPipelineFilter)
              }
              includePattern={pipelineFilterPattern.includes ?? []}
              showSeparator={false}
              type={FilterPatternEnum.PIPELINE}
            />
            {getSeparator('')}
            {getPipelineFieldToggles()}
          </Fragment>
        );

      case ServiceCategory.ML_MODEL_SERVICES:
        return (
          <Fragment>
            <FilterPattern
              checked={showMlModelFilter}
              excludePattern={mlModelFilterPattern.excludes ?? []}
              getExcludeValue={getExcludeValue}
              getIncludeValue={getIncludeValue}
              handleChecked={(value) =>
                handleShowFilter(value, ShowFilter.showMlModelFilter)
              }
              includePattern={mlModelFilterPattern.includes ?? []}
              showSeparator={false}
              type={FilterPatternEnum.MLMODEL}
            />
            {getSeparator('')}
          </Fragment>
        );
      default:
        return <></>;
    }
  };

  const getMetadataFields = () => {
    return (
      <>
        <Field>
          <label className="tw-block tw-form-label tw-mb-1" htmlFor="name">
            {t('label.name')}
          </label>
          <p className="tw-text-grey-muted tw-mt-1 tw-mb-2 tw-text-sm">
            {t('message.ingestion-pipeline-name-message')}
          </p>
          <input
            className="tw-form-inputs tw-form-inputs-padding"
            data-testid="name"
            disabled={formType === FormSubmitType.EDIT}
            id="name"
            name="name"
            type="text"
            value={ingestionName}
            onChange={handleIngestionName}
          />
          {getSeparator('')}
        </Field>
        <div>{getMetadataFilterPatternField()}</div>
      </>
    );
  };

  const getUsageFields = () => {
    return (
      <>
        <Field>
          <label
            className="tw-block tw-form-label tw-mb-1"
            htmlFor="query-log-duration">
            {t('label.query-log-duration')}
          </label>
          <p className="tw-text-grey-muted tw-mt-1 tw-mb-2 tw-text-sm">
            {t('message.query-log-duration-message')}
          </p>
          <input
            className="tw-form-inputs tw-form-inputs-padding"
            data-testid="query-log-duration"
            id="query-log-duration"
            name="query-log-duration"
            type="number"
            value={queryLogDuration}
            onChange={handleQueryLogDuration}
          />
          {getSeparator('')}
        </Field>
        <Field>
          <label
            className="tw-block tw-form-label tw-mb-1"
            htmlFor="stage-file-location">
            {t('label.stage-file-location')}
          </label>
          <p className="tw-text-grey-muted tw-mt-1 tw-mb-2 tw-text-sm">
            {t('message.stage-file-location-message')}
          </p>
          <input
            className="tw-form-inputs tw-form-inputs-padding"
            data-testid="stage-file-location"
            id="stage-file-location"
            name="stage-file-location"
            type="text"
            value={stageFileLocation}
            onChange={handleStageFileLocation}
          />
          {getSeparator('')}
        </Field>
        <Field>
          <label
            className="tw-block tw-form-label tw-mb-1"
            htmlFor="result-limit">
            {t('label.result-limit')}
          </label>
          <p className="tw-text-grey-muted tw-mt-1 tw-mb-2 tw-text-sm">
            {t('message.result-limit-message')}
          </p>
          <input
            className="tw-form-inputs tw-form-inputs-padding"
            data-testid="result-limit"
            id="result-limit"
            name="result-limit"
            type="number"
            value={resultLimit}
            onChange={handleResultLimit}
          />
          {getSeparator('')}
        </Field>
        {getDebugLogToggle()}
      </>
    );
  };

  const getLineageFields = () => {
    return (
      <>
        <Field>
          <label
            className="tw-block tw-form-label tw-mb-1"
            htmlFor="query-log-duration">
            {t('label.query-log-duration')}
          </label>
          <p className="tw-text-grey-muted tw-mt-1 tw-mb-2 tw-text-sm">
            {t('message.query-log-duration-message')}
          </p>
          <input
            className="tw-form-inputs tw-form-inputs-padding"
            data-testid="query-log-duration"
            id="query-log-duration"
            name="query-log-duration"
            type="number"
            value={queryLogDuration}
            onChange={handleQueryLogDuration}
          />
          {getSeparator('')}
        </Field>
        <Field>
          <label
            className="tw-block tw-form-label tw-mb-1"
            htmlFor="result-limit">
            {t('label.result-limit')}
          </label>
          <p className="tw-text-grey-muted tw-mt-1 tw-mb-2 tw-text-sm">
            {t('message.result-limit-message')}
          </p>
          <input
            className="tw-form-inputs tw-form-inputs-padding"
            data-testid="result-limit"
            id="result-limit"
            name="result-limit"
            type="number"
            value={resultLimit}
            onChange={handleResultLimit}
          />
          {getSeparator('')}
        </Field>
        {getDebugLogToggle()}
      </>
    );
  };

  const getProfilerFields = () => {
    return (
      <>
        <div>
          <Field>
            <label className="tw-block tw-form-label tw-mb-1" htmlFor="name">
              {t('label.name')}
            </label>
            <p className="tw-text-grey-muted tw-mt-1 tw-mb-2 tw-text-sm">
              {t('message.ingestion-pipeline-name-message')}
            </p>
            <input
              className="tw-form-inputs tw-form-inputs-padding"
              data-testid="name"
              id="name"
              name="name"
              type="text"
              value={ingestionName}
              onChange={handleIngestionName}
            />
            {getSeparator('')}
          </Field>
        </div>
        {getFilterPatterns()}
        {getSeparator('')}
        {getProfileSample()}
        {getSeparator('')}
        {getThreadCount()}
        {getSeparator('')}
        {getTimeoutSeconds()}
        {getSeparator('')}
        {getIngestSampleToggle(
          t('label.ingest-sample-data'),
          t('message.ingest-sample-data-for-entity', {
            entity: t('label.profile-lowercase'),
          })
        )}
        {getDebugLogToggle()}
        <div>
          <Field>
            <label className="tw-block tw-form-label tw-mb-1" htmlFor="name">
              {t('label.description')}
            </label>
            <p className="tw-text-grey-muted tw-mt-1 tw-mb-2 tw-text-sm">
              {t('message.pipeline-description-message')}
            </p>
            <RichTextEditor
              data-testid="description"
              initialValue={description}
              ref={markdownRef}
            />
            {getSeparator('')}
          </Field>
        </div>
      </>
    );
  };

  const getIngestionPipelineFields = () => {
    switch (pipelineType) {
      case PipelineType.Usage: {
        return getUsageFields();
      }
      case PipelineType.Lineage: {
        return getLineageFields();
      }
      case PipelineType.Profiler: {
        return getProfilerFields();
      }
      case PipelineType.Metadata:
      default: {
        return getMetadataFields();
      }
    }
  };

  const handleNext = () => {
    onChange({
      description: markdownRef.current?.getEditorContent() || '',
    });
    onNext();
  };

  return (
    <Form
      className="p-x-xs"
      data-testid="configure-ingestion-container"
      layout="vertical">
      {getIngestionPipelineFields()}

      <Field className="tw-flex tw-justify-end">
        <Button
          className="tw-mr-2"
          data-testid="back-button"
          size="regular"
          theme="primary"
          variant="text"
          onClick={onCancel}>
          <span>{t('label.cancel')}</span>
        </Button>

        <Button
          data-testid="next-button"
          size="regular"
          theme="primary"
          variant="contained"
          onClick={handleNext}>
          <span>{t('label.next')}</span>
        </Button>
      </Field>
    </Form>
  );
};

export default ConfigureIngestion;
