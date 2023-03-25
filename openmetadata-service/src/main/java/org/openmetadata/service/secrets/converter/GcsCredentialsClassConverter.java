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

package org.openmetadata.service.secrets.converter;

import java.util.List;
import org.openmetadata.schema.security.credentials.GCSCredentials;
import org.openmetadata.schema.security.credentials.GCSValues;
import org.openmetadata.service.util.JsonUtils;

/** Converter class to get an `GCSCredentials` object. */
public class GcsCredentialsClassConverter extends ClassConverter {

  private static final List<Class<?>> CONNECTION_CLASSES = List.of(GCSValues.class);

  public GcsCredentialsClassConverter() {
    super(GCSCredentials.class);
  }

  @Override
  public Object convert(Object object) {
    GCSCredentials gcsCredentials = (GCSCredentials) JsonUtils.convertValue(object, this.clazz);

    tryToConvert(gcsCredentials.getGcsConfig(), CONNECTION_CLASSES).ifPresent(gcsCredentials::setGcsConfig);

    return gcsCredentials;
  }
}
