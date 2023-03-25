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

import { AxiosError } from 'axios';
import parse from 'html-react-parser';
import { get, isString } from 'lodash';

export const stringToSlug = (dataString: string, slugString = '') => {
  return dataString.toLowerCase().replace(/ /g, slugString);
};

/**
 * Convert a template string into HTML DOM nodes
 * Same as React.createElement(type, options, children)
 * @param  {String} str The template string
 * @return {Node}       The template HTML
 */
export const stringToHTML = function (
  strHTML: string
): string | JSX.Element | JSX.Element[] {
  return strHTML ? parse(strHTML) : strHTML;
};

/**
 * Convert a template string into rendered HTML DOM
 * @param  {String} str The template string
 * @return {BodyNode}   The rendered template HTML
 */
export const stringToDOMElement = function (strHTML: string): HTMLElement {
  const parser = new DOMParser();
  const doc = parser.parseFromString(strHTML, 'text/html');

  return doc.body;
};

export const ordinalize = (num: number): string => {
  const mod10 = num % 10;
  const mod100 = num % 100;
  let ordinalSuffix: string;

  if (mod10 === 1 && mod100 !== 11) {
    ordinalSuffix = 'st';
  } else if (mod10 === 2 && mod100 !== 12) {
    ordinalSuffix = 'nd';
  } else if (mod10 === 3 && mod100 !== 13) {
    ordinalSuffix = 'rd';
  } else {
    ordinalSuffix = 'th';
  }

  return num + ordinalSuffix;
};

export const getJSONFromString = (data: string): string | null => {
  try {
    // Format string if possible and return valid JSON
    return JSON.parse(data);
  } catch (e) {
    // Invalid JSON, return null
    return null;
  }
};

export const isValidJSONString = (data?: string): boolean => {
  if (data) {
    return Boolean(getJSONFromString(data));
  }

  return false;
};

export const bytesToSize = (bytes: number) => {
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0) {
    return `${bytes} ${sizes[0]}`;
  } else if (bytes < 0) {
    return `N/A`;
  } else {
    const i = parseInt(
      Math.floor(Math.log(bytes) / Math.log(1024)).toString(),
      10
    );
    if (i === 0) {
      return `${bytes} ${sizes[i]}`;
    } else {
      return `${(bytes / 1024 ** i).toFixed(2)} ${sizes[i]}`;
    }
  }
};

/**
 * Checks the value and return error text
 * @param value - The value to check
 * @param fallbackText
 * @returns Returns the error text
 */
export const getErrorText = (
  value: AxiosError | string,
  fallbackText: string
): string => {
  let errorText;
  if (isString(value)) {
    return value;
  } else if (value) {
    errorText = get(value, 'response.data.message', '');
    if (!errorText) {
      // if error text is undefined or null or empty, try responseMessage in data
      errorText = get(value, 'response.data.responseMessage', '');
    }
    if (!errorText) {
      errorText = get(value, 'response.data', '');
      errorText = typeof errorText === 'string' ? errorText : null;
    }
  }

  // if error text is still empty, return the fallback text
  return errorText || fallbackText;
};

/**
 *
 * @param fqn - Value to be encoded
 * @returns - Encoded text string as a valid component of a Uniform Resource Identifier (URI).
 */
export const getEncodedFqn = (fqn: string, spaceAsPlus = false) => {
  let uri = encodeURIComponent(fqn);

  if (spaceAsPlus) {
    uri = uri.replaceAll('%20', '+');
  }

  return uri;
};

/**
 *
 * @param fqn - Value to be encoded
 * @returns - Decode text string as a valid component of a Uniform Resource Identifier (URI).
 */
export const getDecodedFqn = (fqn: string, plusAsSpace = false) => {
  let uri = decodeURIComponent(fqn);

  if (plusAsSpace) {
    uri = uri.replaceAll('+', ' ');
  }

  return uri;
};

/**
 *
 * @param url - Url to be check
 * @returns - True if url is external otherwise false
 */
export const isExternalUrl = (url = '') => {
  return /^https?:\/\//.test(url);
};

/**
 *
 * @param a compare value one
 * @param b compare value two
 * @returns sorted array (A-Z) which will have custom value at last
 */
export const customServiceComparator = (a: string, b: string): number => {
  if (a.includes('Custom') || b.includes('Custom')) {
    return a.includes('Custom') ? 1 : -1;
  } else {
    return a.localeCompare(b);
  }
};
