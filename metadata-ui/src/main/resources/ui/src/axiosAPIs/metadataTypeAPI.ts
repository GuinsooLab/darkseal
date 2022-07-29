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

import { AxiosResponse } from 'axios';
import { Operation } from 'fast-json-patch';
import { Category, CustomProperty } from '../generated/entity/type';
import APIClient from './index';

export const getTypeListByCategory = (
  category: Category
): Promise<AxiosResponse> => {
  const path = `/metadata/types`;

  const params = { category, limit: '12' };

  return APIClient.get(path, { params });
};

export const getTypeByFQN = (typeFQN: string): Promise<AxiosResponse> => {
  const path = `/metadata/types/name/${typeFQN}`;

  const params = { fields: 'customProperties' };

  return APIClient.get(path, { params });
};

export const addPropertyToEntity = (
  entityTypeId: string,
  data: CustomProperty
): Promise<AxiosResponse> => {
  const path = `/metadata/types/${entityTypeId}`;

  return APIClient.put(path, data);
};

export const updateType = (
  entityTypeId: string,
  data: Operation[]
): Promise<AxiosResponse> => {
  const configOptions = {
    headers: { 'Content-type': 'application/json-patch+json' },
  };
  const path = `/metadata/types/${entityTypeId}`;

  return APIClient.patch(path, data, configOptions);
};
