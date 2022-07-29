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

package org.openmetadata.catalog.fernet;

import static org.openmetadata.catalog.exception.CatalogExceptionMessage.FERNET_KEY_NULL;
import static org.openmetadata.catalog.exception.CatalogExceptionMessage.FIELD_ALREADY_TOKENIZED;
import static org.openmetadata.catalog.exception.CatalogExceptionMessage.FIELD_NOT_TOKENIZED;

import com.google.common.annotations.VisibleForTesting;
import com.macasaet.fernet.Key;
import com.macasaet.fernet.StringValidator;
import com.macasaet.fernet.Token;
import com.macasaet.fernet.Validator;
import java.lang.reflect.Method;
import java.time.Duration;
import java.time.Instant;
import java.time.temporal.TemporalAmount;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;
import lombok.NonNull;
import org.openmetadata.catalog.CatalogApplicationConfig;
import org.openmetadata.catalog.api.services.CreateDashboardService;
import org.openmetadata.catalog.api.services.CreateDatabaseService;
import org.openmetadata.catalog.api.services.CreatePipelineService;
import org.openmetadata.catalog.api.services.DatabaseConnection;
import org.openmetadata.catalog.exception.InvalidServiceConnectionException;
import org.openmetadata.catalog.type.DashboardConnection;
import org.openmetadata.catalog.type.PipelineConnection;
import org.openmetadata.catalog.util.JsonUtils;

public class Fernet {
  private static Fernet instance;
  private String fernetKey;
  public static final String FERNET_PREFIX = "fernet:";
  public static final String FERNET_NO_ENCRYPTION = "no_encryption_at_rest";
  private final Validator<String> validator =
      new StringValidator() {
        @Override
        public TemporalAmount getTimeToLive() {
          return Duration.ofSeconds(Instant.MAX.getEpochSecond());
        }
      };

  private Fernet() {}

  public static Fernet getInstance() {
    if (instance == null) {
      instance = new Fernet();
    }
    return instance;
  }

  public void setFernetKey(CatalogApplicationConfig config) {
    FernetConfiguration fernetConfiguration = config.getFernetConfiguration();
    if (fernetConfiguration != null && !FERNET_NO_ENCRYPTION.equals(fernetConfiguration.getFernetKey())) {
      setFernetKey(fernetConfiguration.getFernetKey());
    }
  }

  @VisibleForTesting
  public Fernet(String fernetKey) {
    this.setFernetKey(fernetKey);
  }

  @VisibleForTesting
  public void setFernetKey(String fernetKey) {
    if (fernetKey != null) {
      // convert base64 to base64url
      this.fernetKey = fernetKey.replace("/", "_").replace("+", "-").replace("=", "");
    } else {
      this.fernetKey = null;
    }
  }

  @VisibleForTesting
  public String getFernetKey() {
    return this.fernetKey;
  }

  public boolean isKeyDefined() {
    return fernetKey != null;
  }

  public String encrypt(@NonNull String secret) {
    if (secret.startsWith(FERNET_PREFIX)) {
      throw new IllegalArgumentException(FIELD_ALREADY_TOKENIZED);
    }
    if (isKeyDefined()) {
      Key key = new Key(fernetKey.split(",")[0]);
      return FERNET_PREFIX + Token.generate(key, secret).serialise();
    }
    throw new IllegalArgumentException(FERNET_KEY_NULL);
  }

  public static boolean isTokenized(String tokenized) {
    return tokenized != null && tokenized.startsWith(FERNET_PREFIX);
  }

  public String decrypt(String tokenized) {
    if (!isKeyDefined()) {
      throw new IllegalArgumentException(FERNET_KEY_NULL);
    }
    if (tokenized != null && tokenized.startsWith(FERNET_PREFIX)) {
      String str = tokenized.split(FERNET_PREFIX, 2)[1];
      Token token = Token.fromString(str);
      List<Key> keys = Arrays.stream(fernetKey.split(",")).map(Key::new).collect(Collectors.toList());
      return token.validateAndDecrypt(keys, validator);
    }
    throw new IllegalArgumentException(FIELD_NOT_TOKENIZED);
  }

  public String decryptIfTokenized(String tokenized) {
    if (tokenized == null) {
      return null;
    }
    Fernet fernet = Fernet.getInstance();
    if (fernet.isKeyDefined() && isTokenized(tokenized)) {
      return fernet.decrypt(tokenized);
    }
    return tokenized;
  }

  public void encryptOrDecryptDatabaseConnection(
      DatabaseConnection databaseConnection,
      CreateDatabaseService.DatabaseServiceType databaseServiceType,
      Boolean encrypt) {
    try {
      Object connectionConfig = databaseConnection.getConfig();
      String clazzName =
          "org.openmetadata.catalog.services.connections.database." + databaseServiceType.value() + "Connection";
      Class<?> clazz = Class.forName(clazzName);
      Object object = JsonUtils.convertValue(connectionConfig, clazz);
      Method getPasswordMethod = clazz.getMethod("getPassword");
      Method setPasswordMethod = clazz.getMethod("setPassword", String.class);
      String password = (String) getPasswordMethod.invoke(object);
      if (password != null) {
        if (!isTokenized(password) && encrypt) {
          password = encrypt(password);
        } else if (isTokenized(password) && !encrypt) {
          password = decrypt(password);
        }
        setPasswordMethod.invoke(object, password);
      }
      databaseConnection.setConfig(object);
    } catch (NoSuchMethodException ignored) {
    } catch (Exception e) {
      throw InvalidServiceConnectionException.byMessage(
          databaseServiceType.value(),
          String.format("Failed to construct connection instance of %s", databaseServiceType.value()));
    }
  }

  public void encryptOrDecryptDashboardConnection(
      DashboardConnection dashboardConnection,
      CreateDashboardService.DashboardServiceType dashboardServiceType,
      Boolean encrypt) {
    try {
      Object connectionConfig = dashboardConnection.getConfig();
      String clazzName =
          "org.openmetadata.catalog.services.connections.dashboard." + dashboardServiceType.value() + "Connection";
      Class<?> clazz = Class.forName(clazzName);
      Object object = JsonUtils.convertValue(connectionConfig, clazz);
      Method getPasswordMethod = clazz.getMethod("getPassword");
      Method setPasswordMethod = clazz.getMethod("setPassword", String.class);
      String password = (String) getPasswordMethod.invoke(object);
      if (password != null) {
        if (!isTokenized(password) && encrypt) {
          password = encrypt(password);
        } else if (isTokenized(password) && !encrypt) {
          password = decrypt(password);
        }
        setPasswordMethod.invoke(object, password);
      }
      dashboardConnection.setConfig(object);
    } catch (NoSuchMethodException ignored) {
    } catch (Exception e) {
      throw InvalidServiceConnectionException.byMessage(
          dashboardServiceType.value(),
          String.format("Failed to construct connection instance of %s", dashboardServiceType.value()));
    }
  }

  public void encryptOrDecryptPipelineConnection(
      PipelineConnection pipelineConnection,
      CreatePipelineService.PipelineServiceType pipelineServiceType,
      Boolean encrypt) {
    try {
      Object connectionConfig = pipelineConnection.getConfig();
      String clazzName =
          "org.openmetadata.catalog.services.connections.pipeline." + pipelineServiceType.value() + "Connection";
      Class<?> clazz = Class.forName(clazzName);
      Object object = JsonUtils.convertValue(connectionConfig, clazz);
      Method getPasswordMethod = clazz.getMethod("getPassword");
      Method setPasswordMethod = clazz.getMethod("setPassword", String.class);
      String password = (String) getPasswordMethod.invoke(object);
      if (password != null) {
        if (!isTokenized(password) && encrypt) {
          password = encrypt(password);
        } else if (isTokenized(password) && !encrypt) {
          password = decrypt(password);
        }
        setPasswordMethod.invoke(object, password);
      }
      pipelineConnection.setConfig(object);
    } catch (NoSuchMethodException ignored) {
    } catch (Exception e) {
      throw InvalidServiceConnectionException.byMessage(
          pipelineServiceType.value(),
          String.format("Failed to construct connection instance of %s", pipelineServiceType.value()));
    }
  }
}
