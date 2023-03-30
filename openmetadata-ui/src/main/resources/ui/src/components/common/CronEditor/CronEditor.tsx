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

import { isEmpty, toNumber } from 'lodash';
import React, { FC, useMemo, useState } from 'react';
import { pluralize } from '../../../utils/CommonUtils';
import { getCron } from '../../../utils/CronUtils';
import {
  combinations,
  getDayOptions,
  getHourOptions,
  getMinuteOptions,
  getMinuteSegmentOptions,
  getMonthDaysOptions,
  getMonthOptions,
  getPeriodOptions,
  toDisplay,
} from './CronEditor.constant';
import {
  Combination,
  CronEditorProp,
  CronOption,
  CronValue,
  SelectedDayOption,
  SelectedHourOption,
  SelectedYearOption,
  StateValue,
  ToDisplay,
} from './CronEditor.interface';

const CronEditor: FC<CronEditorProp> = (props) => {
  const getCronType = (cronStr: string) => {
    for (const t in combinations) {
      if (combinations[t as keyof Combination].test(cronStr)) {
        return t;
      }
    }

    return undefined;
  };
  const getStateValue = (valueStr: string) => {
    const stateVal: StateValue = {
      selectedPeriod: '',
      selectedMinOption: {
        min: 5,
      },
      selectedHourOption: {
        min: 0,
      },
      selectedDayOption: {
        hour: 0,
        min: 0,
      },
      selectedWeekOption: {
        dow: 1,
        hour: 0,
        min: 0,
      },
      selectedMonthOption: {
        dom: 1,
        hour: 0,
        min: 0,
      },
      selectedYearOption: {
        dom: 1,
        mon: 1,
        hour: 0,
        min: 0,
      },
    };
    const t = getCronType(valueStr);

    const d = valueStr ? valueStr.split(' ') : [];
    const v: CronValue = {
      min: d[0],
      hour: d[1],
      dom: d[2],
      mon: d[3],
      dow: d[4],
    };

    stateVal.selectedPeriod = t || stateVal.selectedPeriod;

    if (!isEmpty(t)) {
      const stateIndex = `selected${t?.charAt(0).toUpperCase()}${t?.substring(
        1
      )}Option`;
      const selectedPeriodObj = stateVal[
        stateIndex as keyof StateValue
      ] as SelectedYearOption;

      const targets = toDisplay[t as keyof ToDisplay];

      for (let i = 0; i < targets.length; i++) {
        const tgt = targets[i];

        if (tgt === 'time') {
          selectedPeriodObj.hour = toNumber(v.hour);
          selectedPeriodObj.min = toNumber(v.min);
        } else {
          selectedPeriodObj[tgt as keyof SelectedYearOption] = toNumber(
            v[tgt as keyof CronValue]
          );
        }
      }
    }

    return stateVal;
  };
  const [value, setCronValue] = useState(props.value || '');
  const [state, setState] = useState(getStateValue(value));
  const [periodOptions] = useState(getPeriodOptions());
  const [minuteSegmentOptions] = useState(getMinuteSegmentOptions());
  const [minuteOptions] = useState(getMinuteOptions());
  const [hourOptions] = useState(getHourOptions());
  const [dayOptions] = useState(getDayOptions());
  const [monthDaysOptions] = useState(getMonthDaysOptions());
  const [monthOptions] = useState(getMonthOptions());

  const filteredPeriodOptions = useMemo(() => {
    const { includePeriodOptions } = props;
    if (includePeriodOptions) {
      return periodOptions.filter((option) =>
        includePeriodOptions.includes(option.label)
      );
    } else {
      return periodOptions;
    }
  }, [props, periodOptions]);

  const { className, disabled } = props;
  const { selectedPeriod } = state;

  const startText = 'Scheduled to run every';
  const cronPeriodString = `${startText} ${selectedPeriod}`;

  const changeValue = (state: StateValue) => {
    const { onChange } = props;

    setCronValue(getCron(state) ?? '');
    onChange(getCron(state) ?? '');
  };

  const onPeriodSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
    changeValue({ ...state, selectedPeriod: event.target.value });
    setState((prev) => ({ ...prev, selectedPeriod: event.target.value }));
  };

  const onHourOptionSelect = (
    event: React.ChangeEvent<HTMLSelectElement>,
    key: string
  ) => {
    const value = event.target.value;
    const obj = { [key]: value };

    const { selectedHourOption } = state;
    const hourOption = Object.assign({}, selectedHourOption, obj);
    changeValue({ ...state, selectedHourOption: hourOption });
    setState((prev) => ({ ...prev, selectedHourOption: hourOption }));
  };

  const onMinOptionSelect = (
    event: React.ChangeEvent<HTMLSelectElement>,
    key: string
  ) => {
    const selectedValue = event.target.value;
    const obj = { [key]: selectedValue };

    const { selectedMinOption } = state;
    const minOption = Object.assign({}, selectedMinOption, obj);
    changeValue({ ...state, selectedMinOption: minOption });
    setState((prev) => ({ ...prev, selectedMinOption: minOption }));
  };

  const onDayOptionSelect = (
    event: React.ChangeEvent<HTMLSelectElement>,
    key: string
  ) => {
    const value = parseInt(event.target.value);
    const obj = { [key]: value };

    const { selectedDayOption } = state;
    const dayOption = Object.assign({}, selectedDayOption, obj);
    changeValue({ ...state, selectedDayOption: dayOption });
    setState((prev) => ({ ...prev, selectedDayOption: dayOption }));
  };

  const onWeekOptionSelect = (
    event: React.ChangeEvent<HTMLSelectElement>,
    key: string
  ) => {
    const value = event.target.value || event.target.dataset.value;
    const numberValue = value ? parseInt(value) : '';
    const obj = { [key]: numberValue };

    const { selectedWeekOption } = state;
    const weekOption = Object.assign({}, selectedWeekOption, obj);
    changeValue({ ...state, selectedWeekOption: weekOption });
    setState((prev) => ({ ...prev, selectedWeekOption: weekOption }));
  };

  const onMonthOptionSelect = (
    event: React.ChangeEvent<HTMLSelectElement>,
    key: string
  ) => {
    const value = event.target.value || event.target.dataset.value;
    const obj = { [key]: value };

    const { selectedMonthOption } = state;
    const monthOption = Object.assign({}, selectedMonthOption, obj);
    changeValue({ ...state, selectedMonthOption: monthOption });
    setState((prev) => ({ ...prev, selectedMonthOption: monthOption }));
  };

  const onYearOptionSelect = (
    event: React.ChangeEvent<HTMLSelectElement>,
    key: string
  ) => {
    const value = event.target.value || event.target.dataset.value;
    const obj = { [key]: value };

    const { selectedYearOption } = state;
    const yearOption = Object.assign({}, selectedYearOption, obj);
    changeValue({ ...state, selectedYearOption: yearOption });
    setState((prev) => ({ ...prev, selectedYearOption: yearOption }));
  };

  const getOptionComponent = (key: string) => {
    const optionRenderer = (o: CronOption, i: number) => {
      return (
        <option key={`${key}_${i}`} value={o.value}>
          {o.label}
        </option>
      );
    };

    return optionRenderer;
  };

  const getTextComp = (str: string) => {
    return <div>{str}</div>;
  };

  const findHourOption = (hour: number) => {
    return hourOptions.find((h) => {
      return h.value === hour;
    });
  };

  const findMinuteOption = (min: number) => {
    return minuteOptions.find((h) => {
      return h.value === min;
    });
  };

  const getHourSelect = (
    selectedOption: SelectedDayOption,
    onChangeCB: (e: React.ChangeEvent<HTMLSelectElement>) => void
  ) => {
    const { disabled } = props;

    return (
      <select
        className="tw-form-inputs tw-py-1 tw-px-1"
        data-testid="hour-options"
        disabled={disabled}
        value={selectedOption.hour}
        onChange={(e) => {
          e.persist();
          onChangeCB(e);
        }}>
        {hourOptions.map(getOptionComponent('hour_option'))}
      </select>
    );
  };
  const getMinuteSelect = (
    selectedOption: SelectedHourOption,
    onChangeCB: (e: React.ChangeEvent<HTMLSelectElement>) => void
  ) => {
    const { disabled } = props;

    return (
      <select
        className="tw-form-inputs tw-py-1 tw-px-1"
        data-testid="minute-options"
        disabled={disabled}
        value={selectedOption.min}
        onChange={(e) => {
          e.persist();
          onChangeCB(e);
        }}>
        {minuteOptions.map(getOptionComponent('minute_option'))}
      </select>
    );
  };

  const getMinuteSegmentSelect = (
    selectedOption: SelectedHourOption,
    onChangeCB: (e: React.ChangeEvent<HTMLSelectElement>) => void
  ) => {
    return (
      <select
        className="tw-form-inputs tw-py-1 tw-px-1"
        data-testid="minute-segment-options"
        disabled={props.disabled}
        value={selectedOption.min}
        onChange={(e) => {
          e.persist();
          onChangeCB(e);
        }}>
        {minuteSegmentOptions.map(getOptionComponent('minute_option'))}
      </select>
    );
  };

  const getBadgeOptions = (
    options: CronOption[],
    value: number,
    substrVal: number,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onClick: (e: any) => void
  ) => {
    const { disabled } = props;
    const optionComps: JSX.Element[] = [];

    options.forEach((o, i) => {
      let strVal = o.label;

      if (substrVal) {
        strVal = strVal.substr(0, substrVal);
      }
      const comp = (
        <span
          className={`cron-badge-option ${o.value === value ? 'active' : ''} ${
            disabled || !onClick ? 'disabled' : ''
          }`}
          data-value={o.value}
          key={i}
          onClick={(e) => onClick?.(e)}>
          {strVal}
        </span>
      );

      optionComps.push(comp);
    });

    return optionComps;
  };

  const getMinuteComponent = (cronPeriodString: string) => {
    const { selectedMinOption } = state;

    return (
      state.selectedPeriod === 'minute' && (
        <>
          <div className="tw-mb-1.5" data-testid="minute-segment-container">
            <label>Minute :</label>
            {getMinuteSegmentSelect(
              selectedMinOption,
              (e: React.ChangeEvent<HTMLSelectElement>) =>
                onMinOptionSelect(e, 'min')
            )}
          </div>
          <div className="tw-col-span-2">
            {getTextComp(
              `${cronPeriodString} ${selectedMinOption.min} minutes`
            )}
          </div>
        </>
      )
    );
  };

  const getHourComponent = (cronPeriodString: string) => {
    const { selectedHourOption } = state;

    return (
      state.selectedPeriod === 'hour' && (
        <>
          <div className="tw-mb-1.5" data-testid="hour-segment-container">
            <label>Minute :</label>
            {getMinuteSelect(
              selectedHourOption,
              (e: React.ChangeEvent<HTMLSelectElement>) =>
                onHourOptionSelect(e, 'min')
            )}
          </div>
          <div className="tw-col-span-2">
            {getTextComp(
              `${cronPeriodString} ${pluralize(
                +selectedHourOption.min,
                'minute'
              )} past the hour`
            )}
          </div>
        </>
      )
    );
  };

  const getDayComponent = (cronPeriodString: string) => {
    const { selectedDayOption } = state;

    const hourLabel = findHourOption(selectedDayOption.hour)?.label;
    const minuteLabel = findMinuteOption(selectedDayOption.min)?.label;

    return (
      state.selectedPeriod === 'day' && (
        <>
          <div className="tw-mb-1.5" data-testid="day-segment-container">
            <label>Time :</label>
            <div className="tw-flex" data-testid="time-option-container">
              {getHourSelect(
                selectedDayOption,
                (e: React.ChangeEvent<HTMLSelectElement>) =>
                  onDayOptionSelect(e, 'hour')
              )}
              <span className="tw-mx-2 tw-self-center">:</span>
              {getMinuteSelect(
                selectedDayOption,
                (e: React.ChangeEvent<HTMLSelectElement>) =>
                  onDayOptionSelect(e, 'min')
              )}
            </div>
          </div>
          <div className="tw-col-span-2">
            {getTextComp(`${cronPeriodString} at ${hourLabel}:${minuteLabel}`)}
          </div>
        </>
      )
    );
  };

  const getWeekComponent = (cronPeriodString: string) => {
    const { selectedWeekOption } = state;

    const hourLabel = findHourOption(selectedWeekOption.hour)?.label;
    const minuteLabel = findMinuteOption(selectedWeekOption.min)?.label;

    const dayLabel = dayOptions.find((d) => {
      return d.value === selectedWeekOption.dow;
    })?.label;

    return (
      state.selectedPeriod === 'week' && (
        <>
          <div className="tw-mb-1.5" data-testid="week-segment-time-container">
            <label>Time :</label>
            <div
              className="tw-flex"
              data-testid="week-segment-time-options-container">
              {getHourSelect(
                selectedWeekOption,
                (e: React.ChangeEvent<HTMLSelectElement>) =>
                  onWeekOptionSelect(e, 'hour')
              )}
              <span className="tw-mx-2 tw-self-center">:</span>
              {getMinuteSelect(
                selectedWeekOption,
                (e: React.ChangeEvent<HTMLSelectElement>) =>
                  onWeekOptionSelect(e, 'min')
              )}
            </div>
          </div>
          <div
            className="tw-pt-2"
            data-testid="week-segment-day-option-container">
            <span>Day : </span>
            <div className="cron-badge-option-container week-opt-container">
              {getBadgeOptions(
                dayOptions,
                selectedWeekOption.dow,
                1,
                (e: React.ChangeEvent<HTMLSelectElement>) =>
                  onWeekOptionSelect(e, 'dow')
              )}
            </div>
          </div>
          <div className="tw-col-span-2">
            {getTextComp(
              `${cronPeriodString} on ${dayLabel} at ${hourLabel}:${minuteLabel}`
            )}
          </div>
        </>
      )
    );
  };

  const getMonthComponent = (cronPeriodString: string) => {
    const { selectedMonthOption } = state;

    const hourLabel = findHourOption(selectedMonthOption.hour)?.label;
    const minuteLabel = findMinuteOption(selectedMonthOption.min)?.label;

    const dateLabel = monthDaysOptions.find((d) => {
      return d.value === selectedMonthOption.dom;
    })?.label;

    return (
      state.selectedPeriod === 'month' && (
        <>
          <div className="cron-field-row">
            <span className="m-l-xs">Date : </span>
            <div className="cron-badge-option-container month-opt-container">
              {getBadgeOptions(
                monthDaysOptions,
                selectedMonthOption.dom,
                0,
                (e: React.ChangeEvent<HTMLSelectElement>) =>
                  onMonthOptionSelect(e, 'dom')
              )}
            </div>
          </div>
          <div className="cron-field-row">
            <span className="m-l-xs">Time : </span>
            {getHourSelect(
              selectedMonthOption,
              (e: React.ChangeEvent<HTMLSelectElement>) =>
                onMonthOptionSelect(e, 'hour')
            )}
            :
            {getMinuteSelect(
              selectedMonthOption,
              (e: React.ChangeEvent<HTMLSelectElement>) =>
                onMonthOptionSelect(e, 'min')
            )}
          </div>
          {getTextComp(
            `${cronPeriodString} on ${dateLabel} at ${hourLabel}:${minuteLabel}`
          )}
        </>
      )
    );
  };

  const getYearComponent = (cronPeriodString: string) => {
    const { selectedYearOption } = state;

    const hourLabel = findHourOption(selectedYearOption.hour)?.label;
    const minuteLabel = findMinuteOption(selectedYearOption.min)?.label;

    const dateLabel = monthDaysOptions.find((d) => {
      return d.value === selectedYearOption.dom;
    })?.label;
    const monthLabel = monthOptions.find((d) => {
      return d.value === selectedYearOption.mon;
    })?.label;

    return (
      state.selectedPeriod === 'year' && (
        <>
          <div className="cron-field-row">
            <span className="m-l-xs">Month : </span>
            <div className="cron-badge-option-container month-opt-container">
              {getBadgeOptions(
                monthOptions,
                selectedYearOption.mon,
                3,
                (e: React.ChangeEvent<HTMLSelectElement>) =>
                  onYearOptionSelect(e, 'mon')
              )}
            </div>
          </div>
          <div className="cron-field-row">
            <span className="m-l-xs">Date : </span>
            <div className="cron-badge-option-container month-opt-container">
              {getBadgeOptions(
                monthDaysOptions,
                selectedYearOption.dom,
                0,
                (e: React.ChangeEvent<HTMLSelectElement>) =>
                  onYearOptionSelect(e, 'dom')
              )}
            </div>
          </div>
          <div className="cron-field-row">
            <span className="m-l-xs">Time : </span>
            {getHourSelect(
              selectedYearOption,
              (e: React.ChangeEvent<HTMLSelectElement>) =>
                onYearOptionSelect(e, 'hour')
            )}
            :
            {getMinuteSelect(
              selectedYearOption,
              (e: React.ChangeEvent<HTMLSelectElement>) =>
                onYearOptionSelect(e, 'min')
            )}
          </div>
          {getTextComp(
            `${cronPeriodString} on ${dateLabel} of ${monthLabel} at ${hourLabel}:${minuteLabel}`
          )}
        </>
      )
    );
  };

  return (
    <div className={`${className} cron-row`} data-testid="cron-container">
      <div className="">
        <div className="tw-grid tw-grid-cols-2 tw-gap-4">
          <div className="tw-mb-1.5" data-testid="time-dropdown-container">
            <label htmlFor="cronType">Every:</label>
            <select
              className="tw-form-inputs tw-px-3 tw-py-1"
              data-testid="cron-type"
              disabled={disabled}
              id="cronType"
              name="cronType"
              value={selectedPeriod}
              onChange={(e) => {
                e.persist();
                onPeriodSelect(e);
              }}>
              {filteredPeriodOptions.map((t, index) => {
                return (
                  <option key={`period_option_${index}`} value={t.value}>
                    {t.label}
                  </option>
                );
              })}
            </select>
          </div>

          {getMinuteComponent(startText)}
          {getHourComponent(cronPeriodString)}
          {getDayComponent(cronPeriodString)}
          {getWeekComponent(cronPeriodString)}
          {getMonthComponent(cronPeriodString)}
          {getYearComponent(cronPeriodString)}
          {isEmpty(value) && (
            <p className="tw-col-span-2" data-testid="manual-segment-container">
              Pipeline will only be triggered manually.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CronEditor;
