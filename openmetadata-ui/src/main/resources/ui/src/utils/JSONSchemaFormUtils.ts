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

/* eslint-disable @typescript-eslint/ban-types */

import { cloneDeep, isString } from 'lodash';

export function escapeBackwardSlashChar<T>(formData: T): T {
  for (const key in formData) {
    if (typeof formData[key as keyof T] === 'object') {
      escapeBackwardSlashChar(formData[key as keyof T]);
    } else {
      const data = formData[key as keyof T];
      if (isString(data)) {
        formData[key as keyof T] = data.replace(
          /\\n/g,
          '\n'
        ) as unknown as T[keyof T];
      }
    }
  }

  return formData;
}

function formatConnectionFields<T>(formData: T, field: string): T {
  if (formData && formData[field as keyof T]) {
    // Since connection options support value of type string or object
    // try to parse the string value as object
    const options = formData[field as keyof T];

    for (const key in options) {
      const value = options[key];
      try {
        formData[field as keyof T][key] = JSON.parse(
          value as unknown as string
        );
      } catch (_) {
        // ignore exception
      }
    }
  }

  return formData;
}

function formatAdditionalProperties<T>(formData: T): T {
  for (const key in formData) {
    if (typeof formData[key as keyof T] === 'object') {
      formatAdditionalProperties(formData[key as keyof T]);
    } else {
      const data = formData[key as keyof T];
      if (
        key.startsWith('newKey') &&
        data === ('New Value' as unknown as T[keyof T])
      ) {
        delete formData[key];
      }
    }
  }

  return formData;
}

export function formatFormDataForSubmit<T>(formData: T): T {
  formData = cloneDeep(formData);
  formData = escapeBackwardSlashChar(formData);
  formData = formatAdditionalProperties(formData);
  formData = formatConnectionFields(formData, 'connectionArguments');

  return formData;
}

function formatConnectionFieldsForRender<T extends object>(
  formData: T,
  field: string
): T {
  if (formData && formData[field as keyof T]) {
    // Since connection options support value of type string or object
    // convert object into string
    const options = formData[field as keyof T];

    for (const key in options) {
      const value = options[key];
      if (typeof value === 'object') {
        formData[field as keyof T][key] = JSON.stringify(
          value
        ) as unknown as T[keyof T][Extract<keyof T[keyof T], string>];
      }
    }
  }

  return formData;
}

export function formatFormDataForRender<T extends object>(formData: T): T {
  formData = cloneDeep(formData);
  formData = formatConnectionFieldsForRender(formData, 'connectionArguments');

  return formData;
}
