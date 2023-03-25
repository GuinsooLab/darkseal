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

import { cloneDeep } from 'lodash';
import { COMMON_UI_SCHEMA } from '../constants/Services.constant';
import { MetadataServiceType } from '../generated/entity/services/metadataService';
import amundsenConnection from '../jsons/connectionSchemas/connections/metadata/amundsenConnection.json';
import atlasConnection from '../jsons/connectionSchemas/connections/metadata/atlasConnection.json';
import openMetadataConnection from '../jsons/connectionSchemas/connections/metadata/openMetadataConnection.json';

export const getMetadataConfig = (type: MetadataServiceType) => {
  let schema = {};
  const uiSchema = { ...COMMON_UI_SCHEMA };
  switch (type) {
    case MetadataServiceType.Atlas: {
      schema = atlasConnection;

      break;
    }
    case MetadataServiceType.Amundsen: {
      schema = amundsenConnection;

      break;
    }
    case MetadataServiceType.OpenMetadata: {
      schema = openMetadataConnection;

      break;
    }
  }

  return cloneDeep({ schema, uiSchema });
};
