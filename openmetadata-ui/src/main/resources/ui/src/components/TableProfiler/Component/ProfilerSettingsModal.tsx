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

import { PlusOutlined } from '@ant-design/icons';
import {
  Button,
  InputNumber,
  Modal,
  Select,
  Space,
  Switch,
  TreeSelect,
} from 'antd';
import Form from 'antd/lib/form';
import { FormProps, List } from 'antd/lib/form/Form';
import { Col, Row } from 'antd/lib/grid';
import { AxiosError } from 'axios';
import classNames from 'classnames';
import 'codemirror/addon/fold/foldgutter.css';
import { isEmpty, isEqual, isUndefined, omit, startCase } from 'lodash';
import React, {
  Reducer,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useState,
} from 'react';
import { Controlled as CodeMirror } from 'react-codemirror2';
import { useTranslation } from 'react-i18next';
import { getTableProfilerConfig, putTableProfileConfig } from 'rest/tableAPI';
import {
  codeMirrorOption,
  DEFAULT_INCLUDE_PROFILE,
  INTERVAL_TYPE_OPTIONS,
  INTERVAL_UNIT_OPTIONS,
  PROFILER_METRIC,
  PROFILE_SAMPLE_OPTIONS,
  SUPPORTED_PARTITION_TYPE,
} from '../../../constants/profiler.constant';
import {
  ProfileSampleType,
  TableProfilerConfig,
} from '../../../generated/entity/data/table';
import jsonData from '../../../jsons/en';
import { reducerWithoutAction } from '../../../utils/CommonUtils';
import SVGIcons, { Icons } from '../../../utils/SvgUtils';
import { showErrorToast, showSuccessToast } from '../../../utils/ToastUtils';
import SliderWithInput from '../../SliderWithInput/SliderWithInput';
import {
  ProfilerSettingModalState,
  ProfilerSettingsModalProps,
} from '../TableProfiler.interface';
import '../tableProfiler.less';

const ProfilerSettingsModal: React.FC<ProfilerSettingsModalProps> = ({
  tableId,
  columns,
  visible,
  onVisibilityChange,
}) => {
  const { t } = useTranslation();
  const [form] = Form.useForm();

  const [isLoading, setIsLoading] = useState(false);

  const initialState: ProfilerSettingModalState = useMemo(
    () => ({
      data: undefined,
      sqlQuery: '',
      profileSample: 100,
      excludeCol: [],
      includeCol: DEFAULT_INCLUDE_PROFILE,
      enablePartition: false,
      partitionData: undefined,
      selectedProfileSampleType: ProfileSampleType.Percentage,
    }),
    []
  );
  const [state, dispatch] = useReducer<
    Reducer<ProfilerSettingModalState, Partial<ProfilerSettingModalState>>
  >(reducerWithoutAction, initialState);

  const handleStateChange = useCallback(
    (newState: Partial<ProfilerSettingModalState>) => {
      dispatch(newState);
    },
    []
  );

  const selectOptions = useMemo(() => {
    return columns.map(({ name }) => ({
      label: name,
      value: name,
    }));
  }, [columns]);
  const metricsOptions = useMemo(() => {
    const metricsOptions = [
      {
        title: t('label.all'),
        value: 'all',
        key: 'all',
        children: PROFILER_METRIC.map((metric) => ({
          title: startCase(metric),
          value: metric,
          key: metric,
        })),
      },
    ];

    return metricsOptions;
  }, [columns]);

  const { partitionColumnOptions, isPartitionDisabled } = useMemo(() => {
    const partitionColumnOptions = columns.reduce((result, column) => {
      if (SUPPORTED_PARTITION_TYPE.includes(column.dataType)) {
        return [
          ...result,
          {
            value: column.name,
            label: column.name,
          },
        ];
      }

      return result;
    }, [] as { value: string; label: string }[]);
    const isPartitionDisabled = partitionColumnOptions.length === 0;

    return {
      partitionColumnOptions,
      isPartitionDisabled,
    };
  }, [columns]);

  const updateInitialConfig = (tableProfilerConfig: TableProfilerConfig) => {
    const {
      includeColumns,
      partitioning,
      profileQuery,
      profileSample,
      profileSampleType,
      excludeColumns,
    } = tableProfilerConfig;
    handleStateChange({
      sqlQuery: profileQuery || '',
      profileSample: profileSample,
      excludeCol: excludeColumns || [],
      selectedProfileSampleType:
        profileSampleType || ProfileSampleType.Percentage,
    });

    const profileSampleTypeCheck =
      profileSampleType === ProfileSampleType.Percentage;
    form.setFieldsValue({
      profileSampleType,
      profileSamplePercentage: profileSampleTypeCheck
        ? profileSample || 100
        : 100,
      profileSampleRows: !profileSampleTypeCheck
        ? profileSample || 100
        : undefined,
    });

    if (includeColumns && includeColumns?.length > 0) {
      const includeColValue = includeColumns.map((col) => {
        if (
          isUndefined(col.metrics) ||
          (col.metrics && col.metrics.length === 0)
        ) {
          col.metrics = ['all'];
        }

        return col;
      });
      form.setFieldsValue({ includeColumns: includeColValue });
      handleStateChange({
        includeCol: includeColValue,
      });
    }
    if (partitioning) {
      handleStateChange({
        enablePartition: partitioning.enablePartitioning || false,
      });

      form.setFieldsValue({ ...partitioning });
    }
  };

  const fetchProfileConfig = async () => {
    try {
      const response = await getTableProfilerConfig(tableId);
      if (response) {
        const { tableProfilerConfig } = response;
        if (tableProfilerConfig) {
          handleStateChange({
            data: tableProfilerConfig,
          });

          updateInitialConfig(tableProfilerConfig);
        }
      } else {
        throw jsonData['api-error-messages'][
          'fetch-table-profiler-config-error'
        ];
      }
    } catch (error) {
      showErrorToast(
        error as AxiosError,
        jsonData['api-error-messages']['fetch-table-profiler-config-error']
      );
    }
  };

  const getIncludesColumns = () => {
    const includeCols = state.includeCol.filter(
      ({ columnName }) => !isUndefined(columnName)
    );

    handleStateChange({
      includeCol: includeCols,
    });

    return includeCols.map((col) => {
      if (col.metrics && col.metrics[0] === 'all') {
        return {
          columnName: col.columnName,
        };
      }

      return col;
    });
  };

  const handleSave: FormProps['onFinish'] = useCallback(
    async (data) => {
      const {
        excludeCol,
        sqlQuery,
        includeCol,
        enablePartition,
        partitionData,
      } = state;

      setIsLoading(true);
      const { profileSamplePercentage, profileSampleRows, profileSampleType } =
        data;

      const profileConfig: TableProfilerConfig = {
        excludeColumns: excludeCol.length > 0 ? excludeCol : undefined,
        profileQuery: !isEmpty(sqlQuery) ? sqlQuery : undefined,
        ...{
          profileSample:
            profileSampleType === ProfileSampleType.Percentage
              ? profileSamplePercentage
              : profileSampleRows,
          profileSampleType: profileSampleType,
        },
        includeColumns: !isEqual(includeCol, DEFAULT_INCLUDE_PROFILE)
          ? getIncludesColumns()
          : undefined,
        partitioning: enablePartition
          ? {
              ...partitionData,
              enablePartitioning: enablePartition,
            }
          : undefined,
      };
      try {
        const data = await putTableProfileConfig(tableId, profileConfig);
        if (data) {
          showSuccessToast(
            jsonData['api-success-messages']['update-profile-congif-success']
          );
          onVisibilityChange(false);
        } else {
          throw jsonData['api-error-messages']['update-profiler-config-error'];
        }
      } catch (error) {
        showErrorToast(
          error as AxiosError,
          jsonData['api-error-messages']['update-profiler-config-error']
        );
      } finally {
        setIsLoading(false);
      }
    },
    [state, getIncludesColumns]
  );

  const handleCancel = useCallback(() => {
    const { data } = state;
    data && updateInitialConfig(data);
    onVisibilityChange(false);
  }, [state]);

  const handleProfileSampleType = useCallback(
    (selectedProfileSampleType) =>
      handleStateChange({
        selectedProfileSampleType,
      }),
    []
  );

  const handleProfileSample = useCallback(
    (value) =>
      handleStateChange({
        profileSample: Number(value),
      }),
    []
  );

  const handleCodeMirrorChange = useCallback(
    (_Editor, _EditorChange, value) => {
      handleStateChange({
        sqlQuery: value,
      });
    },
    []
  );

  const handleIncludeColumnsProfiler = useCallback((_, data) => {
    handleStateChange({
      includeCol: data.includeColumns,
      partitionData: omit(data, 'includeColumns'),
    });
  }, []);

  const handleChange =
    (field: keyof ProfilerSettingModalState) =>
    (value: ProfilerSettingModalState[keyof ProfilerSettingModalState]) =>
      handleStateChange({
        [field]: value,
      });

  const handleExcludeCol = handleChange('excludeCol');

  const handleEnablePartition = handleChange('enablePartition');

  useEffect(() => {
    fetchProfileConfig();
  }, []);

  return (
    <Modal
      centered
      destroyOnClose
      bodyStyle={{
        maxHeight: 600,
        overflowY: 'scroll',
      }}
      cancelButtonProps={{
        type: 'link',
      }}
      closable={false}
      confirmLoading={isLoading}
      data-testid="profiler-settings-modal"
      maskClosable={false}
      okButtonProps={{
        form: 'profiler-setting-form',
        htmlType: 'submit',
      }}
      okText={t('label.save')}
      open={visible}
      title={t('label.setting-plural')}
      width={630}
      onCancel={handleCancel}>
      <Row gutter={[16, 16]}>
        <Col data-testid="profile-sample-container" span={24}>
          <Form
            data-testid="configure-ingestion-container"
            form={form}
            initialValues={{
              profileSampleType: state?.selectedProfileSampleType,
              profileSamplePercentage: state?.profileSample || 100,
            }}
            layout="vertical">
            <Form.Item
              label={t('label.profile-sample-type', {
                type: '',
              })}
              name="profileSampleType">
              <Select
                className="w-full"
                data-testid="profile-sample"
                options={PROFILE_SAMPLE_OPTIONS}
                onChange={handleProfileSampleType}
              />
            </Form.Item>

            {state?.selectedProfileSampleType ===
            ProfileSampleType.Percentage ? (
              <Form.Item
                className="m-b-0"
                label={t('label.profile-sample-type', {
                  type: t('label.value'),
                })}
                name="profileSamplePercentage">
                <SliderWithInput
                  className="p-x-xs"
                  value={state?.profileSample || 0}
                  onChange={handleProfileSample}
                />
              </Form.Item>
            ) : (
              <Form.Item
                className="m-b-0"
                label={t('label.profile-sample-type', {
                  type: t('label.value'),
                })}
                name="profileSampleRows">
                <InputNumber
                  className="w-full"
                  data-testid="metric-number-input"
                  min={0}
                  placeholder={t('label.please-enter-value', {
                    name: t('label.row-count-lowercase'),
                  })}
                />
              </Form.Item>
            )}
          </Form>
        </Col>
        <Col data-testid="sql-editor-container" span={24}>
          <p className="tw-mb-1.5">
            {t('label.profile-sample-type', {
              type: t('label.query'),
            })}{' '}
          </p>
          <CodeMirror
            className="profiler-setting-sql-editor"
            data-testid="profiler-setting-sql-editor"
            options={codeMirrorOption}
            value={state?.sqlQuery}
            onBeforeChange={handleCodeMirrorChange}
            onChange={handleCodeMirrorChange}
          />
        </Col>
        <Col data-testid="exclude-column-container" span={24}>
          <p className="tw-mb-4">{t('message.enable-column-profile')}</p>
          <p className="tw-text-xs tw-mb-1.5">{t('label.exclude')}:</p>
          <Select
            allowClear
            className="tw-w-full"
            data-testid="exclude-column-select"
            mode="tags"
            options={selectOptions}
            placeholder={t('label.select-column-plural-to-exclude')}
            size="middle"
            value={state?.excludeCol}
            onChange={handleExcludeCol}
          />
        </Col>

        <Col span={24}>
          <Form
            autoComplete="off"
            form={form}
            id="profiler-setting-form"
            initialValues={{
              includeColumns: state?.includeCol,
              ...state?.data?.partitioning,
            }}
            layout="vertical"
            name="includeColumnsProfiler"
            onFinish={handleSave}
            onValuesChange={handleIncludeColumnsProfiler}>
            <List name="includeColumns">
              {(fields, { add, remove }) => (
                <>
                  <div className="tw-flex tw-items-center tw-mb-1.5">
                    <p className="w-form-label tw-text-xs tw-mr-3">
                      {`${t('label.include')}:`}
                    </p>
                    <Button
                      className="include-columns-add-button"
                      icon={<PlusOutlined />}
                      size="small"
                      type="primary"
                      onClick={() => add({ metrics: ['all'] })}
                    />
                  </div>
                  <div
                    className={classNames({
                      'tw-max-h-40 tw-overflow-y-auto':
                        state?.includeCol.length > 1,
                    })}
                    data-testid="include-column-container">
                    {fields.map(({ key, name, ...restField }) => (
                      <Row gutter={16} key={key}>
                        <Col span={12}>
                          <Form.Item
                            className="w-full m-b-md"
                            {...restField}
                            name={[name, 'columnName']}>
                            <Select
                              className="w-full"
                              data-testid="exclude-column-select"
                              options={selectOptions}
                              placeholder={t(
                                'label.select-column-plural-to-include'
                              )}
                              size="middle"
                            />
                          </Form.Item>
                        </Col>
                        <Col className="flex" span={12}>
                          <Form.Item
                            className="w-full m-b-md"
                            {...restField}
                            name={[name, 'metrics']}>
                            <TreeSelect
                              treeCheckable
                              className="w-full"
                              maxTagCount={2}
                              placeholder={t('label.please-select')}
                              showCheckedStrategy="SHOW_PARENT"
                              treeData={metricsOptions}
                            />
                          </Form.Item>
                          <Button
                            icon={
                              <SVGIcons
                                alt={t('label.delete')}
                                className="w-4"
                                icon={Icons.DELETE}
                              />
                            }
                            type="text"
                            onClick={() => remove(name)}
                          />
                        </Col>
                      </Row>
                    ))}
                  </div>
                </>
              )}
            </List>
            <Form.Item className="m-b-xs">
              <Space size={12}>
                <p>{t('label.enable-partition')}</p>
                <Switch
                  checked={state?.enablePartition}
                  data-testid="enable-partition-switch"
                  disabled={isPartitionDisabled}
                  onChange={handleEnablePartition}
                />
              </Space>
            </Form.Item>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Form.Item
                  className="m-b-0"
                  label={
                    <span className="text-xs">
                      {t('label.column-entity', {
                        entity: t('label.name'),
                      })}
                    </span>
                  }
                  labelCol={{
                    style: {
                      paddingBottom: 8,
                    },
                  }}
                  name="partitionColumnName"
                  rules={[
                    {
                      required: state?.enablePartition,
                      message: t('message.field-text-is-required', {
                        fieldText: t('label.column-entity', {
                          entity: t('label.name'),
                        }),
                      }),
                    },
                  ]}>
                  <Select
                    allowClear
                    className="w-full"
                    data-testid="column-name"
                    disabled={!state?.enablePartition}
                    options={partitionColumnOptions}
                    placeholder={t('message.select-column-name')}
                    size="middle"
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  className="m-b-0"
                  label={
                    <span className="text-xs">{t('label.interval-type')}</span>
                  }
                  labelCol={{
                    style: {
                      paddingBottom: 8,
                    },
                  }}
                  name="partitionIntervalType"
                  rules={[
                    {
                      required: state?.enablePartition,
                      message: t('message.field-text-is-required', {
                        fieldText: t('label.interval-type'),
                      }),
                    },
                  ]}>
                  <Select
                    allowClear
                    className="w-full"
                    data-testid="interval-type"
                    disabled={!state?.enablePartition}
                    options={INTERVAL_TYPE_OPTIONS}
                    placeholder={t('message.select-interval-type')}
                    size="middle"
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  className="m-b-0"
                  label={<span className="text-xs">{t('label.interval')}</span>}
                  labelCol={{
                    style: {
                      paddingBottom: 8,
                    },
                  }}
                  name="partitionInterval"
                  rules={[
                    {
                      required: state?.enablePartition,
                      message: t('message.field-text-is-required', {
                        fieldText: t('label.interval'),
                      }),
                    },
                  ]}>
                  <InputNumber
                    className="w-full"
                    data-testid="interval-required"
                    disabled={!state?.enablePartition}
                    placeholder={t('message.enter-interval')}
                    size="middle"
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  className="m-b-0"
                  label={
                    <span className="text-xs">{t('label.interval-unit')}</span>
                  }
                  labelCol={{
                    style: {
                      paddingBottom: 8,
                    },
                  }}
                  name="partitionIntervalUnit"
                  rules={[
                    {
                      required: state?.enablePartition,
                      message: t('message.field-text-is-required', {
                        fieldText: t('label.interval-unit'),
                      }),
                    },
                  ]}>
                  <Select
                    allowClear
                    className="w-full"
                    data-testid="select-interval-unit"
                    disabled={!state?.enablePartition}
                    options={INTERVAL_UNIT_OPTIONS}
                    placeholder={t('message.select-interval-unit')}
                    size="middle"
                  />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Col>
      </Row>
    </Modal>
  );
};

export default ProfilerSettingsModal;
