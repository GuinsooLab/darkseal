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
import { EditorContentRef } from 'Models';
import React, { Fragment, useEffect, useRef, useState } from 'react';
import { CreateColumnTest } from '../../../generated/api/tests/createColumnTest';
import { ColumnTestType, Table } from '../../../generated/entity/data/table';
import { ModifiedTableColumn } from '../../../interface/dataQuality.interface';
import {
  errorMsg,
  getCurrentUserId,
  requiredField,
} from '../../../utils/CommonUtils';
import {
  filteredColumnTestOption,
  isSupportedTest,
} from '../../../utils/EntityUtils';
import SVGIcons from '../../../utils/SvgUtils';
import { getDataTypeString } from '../../../utils/TableUtils';
import { Button } from '../../buttons/Button/Button';
import RichTextEditor from '../../common/rich-text-editor/RichTextEditor';

type Props = {
  data?: CreateColumnTest;
  selectedColumn: string;
  isTableDeleted?: boolean;
  column: ModifiedTableColumn[];
  handleAddColumnTestCase: (data: CreateColumnTest) => void;
  onFormCancel: () => void;
};

export const Field = ({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return <div className={classNames('tw-mt-4', className)}>{children}</div>;
};

const ColumnTestForm = ({
  selectedColumn,
  data,
  column,
  isTableDeleted,
  handleAddColumnTestCase,
  onFormCancel,
}: Props) => {
  const markdownRef = useRef<EditorContentRef>();
  const [description] = useState(data?.description || '');
  const isAcceptedTypeIsString = useRef<boolean>(true);
  const [columnTest, setColumnTest] = useState<ColumnTestType>(
    data?.testCase?.columnTestType || ('' as ColumnTestType)
  );
  const [columnOptions, setColumnOptions] = useState<Table['columns']>([]);
  const [testTypeOptions, setTestTypeOptions] = useState<string[]>([]);
  const [minValue, setMinValue] = useState<number | undefined>(
    data?.testCase?.config?.minValue
  );
  const [maxValue, setMaxValue] = useState<number | undefined>(
    data?.testCase?.config?.maxValue
  );

  const [forbiddenValues, setForbiddenValues] = useState<(string | number)[]>(
    data?.testCase?.config?.forbiddenValues || ['']
  );

  const [allowedValues, setAllowedValues] = useState<(string | number)[]>(
    data?.testCase?.config?.allowedValues || ['']
  );

  const [isShowError, setIsShowError] = useState({
    testName: false,
    columnName: false,
    regex: false,
    minOrMax: false,
    missingCountValue: false,
    values: false,
    inSetValues: false,
    minMaxValue: false,
    allTestAdded: false,
    notSupported: false,
  });

  const [columnName, setColumnName] = useState(data?.columnName || '');
  const [missingValueMatch, setMissingValueMatch] = useState<string[]>(
    (data?.testCase?.config?.missingValueMatch as Array<string>) || ['']
  );
  const [missingCountValue, setMissingCountValue] = useState<
    number | undefined
  >(data?.testCase?.config?.missingCountValue);

  const [regex, setRegex] = useState<string>(
    data?.testCase?.config?.regex || ''
  );

  const addValueFields = () => {
    setForbiddenValues([...forbiddenValues, '']);
  };

  const removeValueFields = (i: number) => {
    const newFormValues = [...forbiddenValues];
    newFormValues.splice(i, 1);
    setForbiddenValues(newFormValues);
  };

  const handleValueFieldsChange = (i: number, value: string) => {
    const newFormValues = [...forbiddenValues];
    newFormValues[i] = value;
    setForbiddenValues(newFormValues);
    setIsShowError({ ...isShowError, values: false });
  };

  const addInSetValueFields = () => {
    setAllowedValues([...allowedValues, '']);
  };

  const removeInSetValueFields = (i: number) => {
    const newFormValues = [...allowedValues];
    newFormValues.splice(i, 1);
    setAllowedValues(newFormValues);
  };

  const handleInSetValueFieldsChange = (i: number, value: string) => {
    const newFormValues = [...allowedValues];
    newFormValues[i] = value;
    setAllowedValues(newFormValues);
    setIsShowError({ ...isShowError, values: false });
  };

  const addMatchFields = () => {
    setMissingValueMatch([...missingValueMatch, '']);
  };

  const removeMatchFields = (i: number) => {
    const newFormValues = [...missingValueMatch];
    newFormValues.splice(i, 1);
    setMissingValueMatch(newFormValues);
  };

  const handlMatchFieldsChange = (i: number, value: string) => {
    const newFormValues = [...missingValueMatch];
    newFormValues[i] = value;
    setMissingValueMatch(newFormValues);
  };

  const setAllTestOption = (datatype: string) => {
    const newTest = filteredColumnTestOption(datatype);
    setTestTypeOptions(newTest);
    setColumnTest('' as ColumnTestType);
  };

  const handleTestTypeOptionChange = (name: string) => {
    if (!isEmpty(name)) {
      const selectedColumn = column.find((d) => d.name === name);
      const existingTests =
        selectedColumn?.columnTests?.map(
          (d: CreateColumnTest) => d.testCase.columnTestType
        ) || [];
      if (existingTests.length) {
        const newTest = filteredColumnTestOption(
          selectedColumn?.dataType || ''
        ).filter((d) => !existingTests.includes(d));
        setTestTypeOptions(newTest);
        setColumnTest(newTest[0]);
      } else {
        setAllTestOption(selectedColumn?.dataType || '');
      }
    } else {
      setAllTestOption('');
    }
  };

  useEffect(() => {
    if (isUndefined(data)) {
      if (!isEmpty(selectedColumn)) {
        const selectedData = column.find((d) => d.name === selectedColumn);
        const allTestAdded =
          selectedData?.columnTests?.length ===
          filteredColumnTestOption(selectedData?.dataType || '').length;
        const isSupported = isSupportedTest(selectedData?.dataType || '');
        setIsShowError({
          ...isShowError,
          allTestAdded,
          notSupported: isSupported,
        });
      }
      setColumnOptions(column);
      setColumnName(selectedColumn || '');
      handleTestTypeOptionChange(selectedColumn || '');
    } else {
      setColumnOptions(column);
      setTestTypeOptions(Object.values(ColumnTestType));
      setColumnName(data.columnName || '');
    }
  }, [column]);

  const validateForm = () => {
    const errMsg = cloneDeep(isShowError);
    errMsg.columnName = isEmpty(columnName);
    errMsg.testName = isEmpty(columnTest);

    switch (columnTest) {
      case ColumnTestType.ColumnValueLengthsToBeBetween:
      case ColumnTestType.ColumnValuesToBeBetween:
      case ColumnTestType.ColumnValueMaxToBeBetween:
      case ColumnTestType.ColumnValueMinToBeBetween:
      case ColumnTestType.ColumnValuesSumToBeBetween:
      case ColumnTestType.ColumnValueStdDevToBeBetween:
      case ColumnTestType.ColumnValueMeanToBeBetween:
      case ColumnTestType.ColumnValueMedianToBeBetween:
        errMsg.minOrMax = isEmpty(minValue) && isEmpty(maxValue);
        if (!isUndefined(minValue) && !isUndefined(maxValue)) {
          errMsg.minMaxValue = (+minValue as number) > (+maxValue as number);
        }

        break;

      case ColumnTestType.ColumnValuesMissingCountToBeEqual:
        errMsg.missingCountValue = isEmpty(missingCountValue);

        break;

      case ColumnTestType.ColumnValuesToBeNotInSet: {
        const actualValues = forbiddenValues.filter((v) => !isEmpty(v));
        errMsg.values = actualValues.length < 1;

        break;
      }

      case ColumnTestType.ColumnValuesToBeInSet: {
        const actualValues = allowedValues.filter((v) => !isEmpty(v));
        errMsg.inSetValues = actualValues.length < 1;

        break;
      }

      case ColumnTestType.ColumnValuesToNotMatchRegex:
      case ColumnTestType.ColumnValuesToMatchRegex:
        errMsg.regex = isEmpty(regex);

        break;
    }

    setIsShowError(errMsg);

    return !Object.values(errMsg).includes(true);
  };

  const getTestConfi = () => {
    switch (columnTest) {
      case ColumnTestType.ColumnValueLengthsToBeBetween:
        return {
          minLength: !isEmpty(minValue) ? minValue : undefined,
          maxLength: !isEmpty(maxValue) ? maxValue : undefined,
        };
      case ColumnTestType.ColumnValuesToBeBetween:
        return {
          minValue: !isEmpty(minValue) ? minValue : undefined,
          maxValue: !isEmpty(maxValue) ? maxValue : undefined,
        };

      case ColumnTestType.ColumnValueMaxToBeBetween:
        return {
          minValueForMaxInCol: !isEmpty(minValue) ? minValue : undefined,
          maxValueForMaxInCol: !isEmpty(maxValue) ? maxValue : undefined,
        };

      case ColumnTestType.ColumnValueMinToBeBetween:
        return {
          minValueForMinInCol: !isEmpty(minValue) ? minValue : undefined,
          maxValueForMinInCol: !isEmpty(maxValue) ? maxValue : undefined,
        };

      case ColumnTestType.ColumnValuesSumToBeBetween:
        return {
          minValueForColSum: !isEmpty(minValue) ? minValue : undefined,
          maxValueForColSum: !isEmpty(maxValue) ? maxValue : undefined,
        };

      case ColumnTestType.ColumnValueMedianToBeBetween:
        return {
          minValueForMedianInCol: !isEmpty(minValue) ? minValue : undefined,
          maxValueForMedianInCol: !isEmpty(maxValue) ? maxValue : undefined,
        };
      case ColumnTestType.ColumnValueMeanToBeBetween:
        return {
          minValueForMeanInCol: !isEmpty(minValue) ? minValue : undefined,
          maxValueForMeanInCol: !isEmpty(maxValue) ? maxValue : undefined,
        };
      case ColumnTestType.ColumnValueStdDevToBeBetween:
        return {
          minValueForStdDevInCol: !isEmpty(minValue) ? minValue : undefined,
          maxValueForStdDevInCol: !isEmpty(maxValue) ? maxValue : undefined,
        };

      case ColumnTestType.ColumnValuesMissingCountToBeEqual: {
        const filterMatchValue = missingValueMatch.filter(
          (value) => !isEmpty(value)
        );

        return {
          missingCountValue: missingCountValue,
          missingValueMatch: filterMatchValue.length
            ? missingValueMatch
            : undefined,
        };
      }
      case ColumnTestType.ColumnValuesToBeNotInSet:
        return {
          forbiddenValues: forbiddenValues.filter((v) => !isEmpty(v)),
        };

      case ColumnTestType.ColumnValuesToBeInSet:
        return {
          allowedValues: allowedValues.filter((v) => !isEmpty(v)),
        };

      case ColumnTestType.ColumnValuesToMatchRegex:
        return {
          regex: regex,
        };

      case ColumnTestType.ColumnValuesToNotMatchRegex:
        return {
          forbiddenRegex: regex,
        };

      case ColumnTestType.ColumnValuesToBeNotNull:
        return {
          columnValuesToBeNotNull: true,
        };
      case ColumnTestType.ColumnValuesToBeUnique:
        return {
          columnValuesToBeUnique: true,
        };
      default:
        return {};
    }
  };

  const handleSave = () => {
    if (validateForm()) {
      const columnTestObj: CreateColumnTest = {
        columnName: columnName,
        description: markdownRef.current?.getEditorContent() || undefined,
        testCase: {
          config: getTestConfi(),
          columnTestType: columnTest,
        },
        owner: {
          type: 'user',
          id: getCurrentUserId(),
        },
      };
      handleAddColumnTestCase(columnTestObj);
    }
  };

  const handleValidation = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const value = event.target.value;
    const eleName = event.target.name;

    const errorMsg = cloneDeep(isShowError);

    switch (eleName) {
      case 'columTestType': {
        const selectedColumn = column.find((d) => d.name === columnName);
        const columnDataType = getDataTypeString(
          selectedColumn?.dataType as string
        );
        isAcceptedTypeIsString.current =
          columnDataType === 'varchar' || columnDataType === 'boolean';
        setForbiddenValues(['']);
        setAllowedValues(['']);
        setColumnTest(value as ColumnTestType);
        errorMsg.columnName = false;
        errorMsg.regex = false;
        errorMsg.minOrMax = false;
        errorMsg.missingCountValue = false;
        errorMsg.values = false;
        errorMsg.inSetValues = false;
        errorMsg.minMaxValue = false;
        errorMsg.testName = false;

        break;
      }
      case 'min': {
        setMinValue(value as unknown as number);
        errorMsg.minOrMax = false;
        errorMsg.minMaxValue = false;

        break;
      }

      case 'max': {
        setMaxValue(value as unknown as number);
        errorMsg.minOrMax = false;
        errorMsg.minMaxValue = false;

        break;
      }

      case 'columnName': {
        const selectedColumn = column.find((d) => d.name === value);
        const columnDataType = getDataTypeString(
          selectedColumn?.dataType as string
        );
        isAcceptedTypeIsString.current =
          columnDataType === 'varchar' || columnDataType === 'boolean';
        setForbiddenValues(['']);
        setAllowedValues(['']);
        setColumnName(value);
        handleTestTypeOptionChange(value);
        errorMsg.allTestAdded =
          selectedColumn?.columnTests?.length ===
          filteredColumnTestOption(selectedColumn?.dataType || '').length;
        errorMsg.columnName = false;
        errorMsg.testName = false;
        errorMsg.notSupported = isSupportedTest(selectedColumn?.dataType || '');

        break;
      }

      case 'missingCountValue':
        setMissingCountValue(value as unknown as number);
        errorMsg.missingCountValue = false;

        break;

      case 'regex':
        setRegex(value);
        errorMsg.regex = false;

        break;

      default:
        break;
    }

    setIsShowError(errorMsg);
  };

  const getMinMaxField = () => {
    return (
      <Fragment>
        <div className="tw-flex tw-gap-4 tw-w-full">
          <div className="tw-flex-1">
            <label className="tw-block tw-form-label" htmlFor="min">
              Min:
            </label>
            <input
              className="tw-form-inputs tw-form-inputs-padding"
              data-testid="min"
              id="min"
              name="min"
              placeholder="10"
              type="number"
              value={minValue}
              onChange={handleValidation}
            />
          </div>
          <div className="tw-flex-1">
            <label className="tw-block tw-form-label" htmlFor="max">
              Max:
            </label>
            <input
              className="tw-form-inputs tw-form-inputs-padding"
              data-testid="max"
              id="max"
              name="max"
              placeholder="100"
              type="number"
              value={maxValue}
              onChange={handleValidation}
            />
          </div>
        </div>
        {isShowError.minOrMax && errorMsg('Please enter atleast one value.')}
        {isShowError.minMaxValue &&
          errorMsg('Min value should be lower than Max value.')}
      </Fragment>
    );
  };

  const getMissingCountToBeEqualFields = () => {
    return (
      <Fragment>
        <Field>
          <label className="tw-block tw-form-label" htmlFor="missingCountValue">
            {requiredField('Count:')}
          </label>
          <input
            className="tw-form-inputs tw-form-inputs-padding"
            data-testid="missingCountValue"
            id="missingCountValue"
            name="missingCountValue"
            placeholder="Missing count value"
            type="number"
            value={missingCountValue}
            onChange={handleValidation}
          />
          {isShowError.missingCountValue &&
            errorMsg('Count value is required.')}
        </Field>

        <div data-testid="missing-count-to-be-equal">
          <div className="tw-flex tw-items-center tw-mt-6">
            <p className="w-form-label tw-mr-3">Match:</p>
            <Button
              className="tw-h-5 tw-px-2"
              size="x-small"
              theme="primary"
              variant="contained"
              onClick={addMatchFields}>
              <FontAwesomeIcon icon="plus" />
            </Button>
          </div>

          {missingValueMatch.map((value, i) => (
            <div className="tw-flex tw-items-center" key={i}>
              <div className="tw-w-11/12">
                <Field>
                  <input
                    className="tw-form-inputs tw-form-inputs-padding"
                    id={`value-key-${i}`}
                    name="key"
                    placeholder="Missing value to be match"
                    type="text"
                    value={value}
                    onChange={(e) => handlMatchFieldsChange(i, e.target.value)}
                  />
                </Field>
              </div>
              <button
                className="focus:tw-outline-none tw-mt-3 tw-w-1/12"
                onClick={(e) => {
                  e.preventDefault();
                  removeMatchFields(i);
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
        </div>
      </Fragment>
    );
  };

  const getColumnValuesToMatchRegexFields = () => {
    return (
      <Field>
        <label className="tw-block tw-form-label" htmlFor="regex">
          {requiredField('Regex:')}
        </label>
        <input
          className="tw-form-inputs tw-form-inputs-padding"
          data-testid="regex"
          id="regex"
          name="regex"
          placeholder="Regex column entries should match"
          value={regex}
          onChange={handleValidation}
        />
        {isShowError.regex && errorMsg('Regex is required.')}
      </Field>
    );
  };

  const getColumnValuesToBeNotInSetField = () => {
    return (
      <div data-testid="not-in-set-fiel">
        <div className="tw-flex tw-items-center tw-mt-6">
          <p className="w-form-label tw-mr-3">{requiredField('Values')}</p>
          <Button
            className="tw-h-5 tw-px-2"
            size="x-small"
            theme="primary"
            variant="contained"
            onClick={addValueFields}>
            <FontAwesomeIcon icon="plus" />
          </Button>
        </div>

        {forbiddenValues.map((value, i) => (
          <div className="tw-flex tw-items-center" key={i}>
            <div className="tw-w-11/12">
              <Field>
                <input
                  className="tw-form-inputs tw-form-inputs-padding"
                  id={`option-key-${i}`}
                  name="key"
                  placeholder="Values not to be in the set"
                  type={isAcceptedTypeIsString.current ? 'text' : 'number'}
                  value={value}
                  onChange={(e) => handleValueFieldsChange(i, e.target.value)}
                />
              </Field>
            </div>
            <button
              className="focus:tw-outline-none tw-mt-3 tw-w-1/12"
              onClick={(e) => {
                removeValueFields(i);
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

        {isShowError.values && errorMsg('Value is required.')}
      </div>
    );
  };

  const getColumnValuesToBeInSetField = () => {
    return (
      <div data-testid="in-set-field">
        <div className="tw-flex tw-items-center tw-mt-6">
          <p className="w-form-label tw-mr-3">{requiredField('Values')}</p>
          <Button
            className="tw-h-5 tw-px-2"
            size="x-small"
            theme="primary"
            variant="contained"
            onClick={addInSetValueFields}>
            <FontAwesomeIcon icon="plus" />
          </Button>
        </div>

        {allowedValues.map((value, i) => (
          <div className="tw-flex tw-items-center" key={i}>
            <div className="tw-w-11/12">
              <Field>
                <input
                  className="tw-form-inputs tw-form-inputs-padding"
                  id={`option-key-${i}`}
                  name="key"
                  placeholder="Values to be in the set"
                  type={isAcceptedTypeIsString.current ? 'text' : 'number'}
                  value={value}
                  onChange={(e) =>
                    handleInSetValueFieldsChange(i, e.target.value)
                  }
                />
              </Field>
            </div>
            <button
              className="focus:tw-outline-none tw-mt-3 tw-w-1/12"
              onClick={(e) => {
                removeInSetValueFields(i);
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

        {isShowError.values && errorMsg('Value is required.')}
      </div>
    );
  };

  const getColumnTestConfig = () => {
    switch (columnTest) {
      case ColumnTestType.ColumnValueLengthsToBeBetween:
      case ColumnTestType.ColumnValuesToBeBetween:
      case ColumnTestType.ColumnValueMaxToBeBetween:
      case ColumnTestType.ColumnValueMinToBeBetween:
      case ColumnTestType.ColumnValuesSumToBeBetween:
      case ColumnTestType.ColumnValueMeanToBeBetween:
      case ColumnTestType.ColumnValueStdDevToBeBetween:
      case ColumnTestType.ColumnValueMedianToBeBetween:
        return getMinMaxField();

      case ColumnTestType.ColumnValuesMissingCountToBeEqual:
        return getMissingCountToBeEqualFields();

      case ColumnTestType.ColumnValuesToBeNotInSet:
        return getColumnValuesToBeNotInSetField();

      case ColumnTestType.ColumnValuesToBeInSet:
        return getColumnValuesToBeInSetField();

      case ColumnTestType.ColumnValuesToNotMatchRegex:
      case ColumnTestType.ColumnValuesToMatchRegex:
        return getColumnValuesToMatchRegexFields();

      case ColumnTestType.ColumnValuesToBeNotNull:
      case ColumnTestType.ColumnValuesToBeUnique:
      default:
        return <></>;
    }
  };

  return (
    <div>
      <p className="tw-font-medium tw-px-4">
        {isUndefined(data) ? 'Add' : 'Edit'} Column Test
      </p>
      <div className="tw-w-screen-sm">
        <div className="tw-px-4 tw-mx-auto">
          <Field>
            <label className="tw-block tw-form-label" htmlFor="columnName">
              {requiredField('Column Name:')}
            </label>
            <select
              className={classNames('tw-form-inputs tw-form-inputs-padding', {
                'tw-cursor-not-allowed': !isUndefined(data),
              })}
              data-testid="columnName"
              disabled={!isUndefined(data)}
              id="columnName"
              name="columnName"
              value={columnName}
              onChange={handleValidation}>
              <option value="">Select column name</option>
              {columnOptions.map((option) => (
                <option key={option.name} value={option.name}>
                  {option.name}
                </option>
              ))}
            </select>
            {isShowError.columnName && errorMsg('Column name is required.')}
            {isShowError.notSupported &&
              errorMsg('Complex data type is not yet supported for test.')}
            {isShowError.allTestAdded &&
              errorMsg('All the tests have been added to the selected column.')}
          </Field>

          <Field>
            <label className="tw-block tw-form-label" htmlFor="columTestType">
              {requiredField('Test Type:')}
            </label>
            <select
              className={classNames('tw-form-inputs tw-form-inputs-padding', {
                'tw-cursor-not-allowed': !isUndefined(data),
              })}
              data-testid="columTestType"
              disabled={!isUndefined(data)}
              id="columTestType"
              name="columTestType"
              value={columnTest}
              onChange={handleValidation}>
              <option value="">Select column test</option>
              {testTypeOptions &&
                testTypeOptions.length > 0 &&
                testTypeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
            </select>
            {isShowError.testName && errorMsg('Column test is required.')}
          </Field>

          <Field>
            <label
              className="tw-block tw-form-label tw-mb-0"
              htmlFor="description">
              Description:
            </label>
            <RichTextEditor
              data-testid="description"
              initialValue={description}
              ref={markdownRef}
            />
          </Field>

          {getColumnTestConfig()}
        </div>
        <Field>
          <Field className="tw-flex tw-justify-end">
            <Button
              data-testid="cancel-test"
              size="regular"
              theme="primary"
              variant="text"
              onClick={onFormCancel}>
              Cancel
            </Button>
            <Button
              className="tw-w-16 tw-h-10"
              data-testid="save-test"
              disabled={
                isShowError.allTestAdded ||
                isShowError.notSupported ||
                isTableDeleted
              }
              size="regular"
              theme="primary"
              variant="contained"
              onClick={handleSave}>
              Save
            </Button>
          </Field>
        </Field>
      </div>
    </div>
  );
};

export default ColumnTestForm;
