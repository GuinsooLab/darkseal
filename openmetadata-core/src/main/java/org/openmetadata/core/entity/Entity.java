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

package org.openmetadata.core.entity;

import static org.openmetadata.core.util.CommonUtil.listOrEmpty;

import com.fasterxml.jackson.annotation.JsonPropertyOrder;
import java.io.IOException;
import java.net.URI;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import javax.ws.rs.core.UriInfo;
import lombok.NonNull;
import org.openmetadata.catalog.type.EntityReference;
import org.openmetadata.catalog.type.Include;
import org.openmetadata.core.entity.interfaces.EntityDAO;
import org.openmetadata.core.entity.interfaces.EntityInterface;
import org.openmetadata.core.entity.repository.EntityRepository;
import org.openmetadata.core.exception.CatalogExceptionMessage;
import org.openmetadata.core.exception.EntityNotFoundException;
import org.openmetadata.core.util.EntityUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public final class Entity {
  private static final Logger LOG = LoggerFactory.getLogger(Entity.class);
  // Fully qualified name separator
  public static final String SEPARATOR = ".";

  // Lower case entity name to canonical entity name map
  private static final Map<String, String> CANONICAL_ENTITY_NAME_MAP = new HashMap<>();

  // Canonical entity name to corresponding EntityDAO map
  private static final Map<String, EntityDAO<?>> DAO_MAP = new HashMap<>();

  // Canonical entity name to corresponding EntityRepository map
  private static final Map<String, EntityRepository<?>> ENTITY_REPOSITORY_MAP = new HashMap<>();

  // Common field names
  public static final String FIELD_OWNER = "owner";
  public static final String FIELD_NAME = "name";
  public static final String FIELD_DESCRIPTION = "description";
  public static final String FIELD_SERVICE = "service";
  public static final String FIELD_FOLLOWERS = "followers";
  public static final String FIELD_TAGS = "tags";
  public static final String FIELD_DELETED = "deleted";
  public static final String FIELD_PIPELINE_STATUSES = "pipelineStatuses";
  public static final String FIELD_DISPLAY_NAME = "displayName";
  public static final String FIELD_EXTENSION = "extension";

  //
  // Service entities
  //
  public static final String DATABASE_SERVICE = "databaseService";
  public static final String MESSAGING_SERVICE = "messagingService";
  public static final String DASHBOARD_SERVICE = "dashboardService";
  public static final String PIPELINE_SERVICE = "pipelineService";
  public static final String STORAGE_SERVICE = "storageService";
  public static final String MLMODEL_SERVICE = "mlmodelService";

  //
  // Data asset entities
  //
  public static final String TABLE = "table";
  public static final String DATABASE = "database";
  public static final String DATABASE_SCHEMA = "databaseSchema";
  public static final String METRICS = "metrics";
  public static final String DASHBOARD = "dashboard";
  public static final String PIPELINE = "pipeline";
  public static final String CHART = "chart";
  public static final String REPORT = "report";
  public static final String TOPIC = "topic";
  public static final String MLMODEL = "mlmodel";
  public static final String BOT = "bot";
  public static final String THREAD = "THREAD";
  public static final String LOCATION = "location";
  public static final String GLOSSARY = "glossary";
  public static final String GLOSSARY_TERM = "glossaryTerm";
  public static final String TAG = "tag";
  public static final String TAG_CATEGORY = "tagCategory";
  public static final String TYPE = "type";

  //
  // Policy entity
  //
  public static final String POLICY = "policy";

  //
  // Role, team and user entities
  //
  public static final String ROLE = "role";
  public static final String USER = "user";
  public static final String TEAM = "team";

  //
  // Operation related entities
  //
  public static final String INGESTION_PIPELINE = "ingestionPipeline";
  public static final String WEBHOOK = "webhook";

  //
  // List of entities whose changes should not be published to the Activity Feed
  //
  public static final List<String> ACTIVITY_FEED_EXCLUDED_ENTITIES =
      List.of(
          USER,
          TEAM,
          ROLE,
          POLICY,
          BOT,
          INGESTION_PIPELINE,
          DATABASE_SERVICE,
          PIPELINE_SERVICE,
          DASHBOARD_SERVICE,
          STORAGE_SERVICE,
          MESSAGING_SERVICE);

  private Entity() {}

  public static <T extends EntityInterface> void registerEntity(
      Class<T> clazz, String entity, EntityDAO<T> dao, EntityRepository<T> entityRepository) {
    DAO_MAP.put(entity, dao);
    ENTITY_REPOSITORY_MAP.put(entity, entityRepository);
    CANONICAL_ENTITY_NAME_MAP.put(entity.toLowerCase(Locale.ROOT), entity);
    LOG.info(
        "Registering entity {} {} {} {}",
        clazz,
        entity,
        dao.getEntityClass().getSimpleName(),
        entityRepository.getClass().getSimpleName());
  }

  public static EntityReference getEntityReference(EntityReference ref) throws IOException {
    return ref == null ? null : getEntityReferenceById(ref.getType(), ref.getId(), Include.NON_DELETED);
  }

  public static EntityReference getEntityReferenceById(@NonNull String entityType, @NonNull UUID id, Include include)
      throws IOException {
    EntityRepository<?> repository = ENTITY_REPOSITORY_MAP.get(entityType);
    if (repository == null) {
      throw EntityNotFoundException.byMessage(CatalogExceptionMessage.entityTypeNotFound(entityType));
    }
    include = repository.supportsSoftDelete ? Include.ALL : include;
    return repository.dao.findEntityReferenceById(id, include);
  }

  public static EntityReference getEntityReferenceByName(
      @NonNull String entityType, @NonNull String fqn, Include include) {
    EntityDAO<?> dao = DAO_MAP.get(entityType);
    if (dao == null) {
      throw EntityNotFoundException.byMessage(CatalogExceptionMessage.entityTypeNotFound(entityType));
    }
    return dao.findEntityReferenceByName(fqn, include);
  }

  public static EntityReference getOwner(@NonNull EntityReference reference) throws IOException {
    EntityRepository<?> repository = getEntityRepository(reference.getType());
    return repository.getOwner(reference);
  }

  public static void withHref(UriInfo uriInfo, List<EntityReference> list) {
    listOrEmpty(list).forEach(ref -> withHref(uriInfo, ref));
  }

  public static void withHref(UriInfo uriInfo, EntityReference ref) {
    if (ref == null) {
      return;
    }
    String entityType = ref.getType();
    EntityRepository<?> entityRepository = getEntityRepository(entityType);
    URI href = entityRepository.getHref(uriInfo, ref.getId());
    ref.withHref(href);
  }

  public static boolean shouldHaveOwner(@NonNull String entityType) {
    // Team does not have an owner. (yet?)
    return !entityType.equals(TEAM);
  }

  /** Returns true if the change events of the given entity type should be published to the activity feed. */
  public static boolean shouldDisplayEntityChangeOnFeed(@NonNull String entityType) {
    return !ACTIVITY_FEED_EXCLUDED_ENTITIES.contains(entityType);
  }

  public static <T> T getEntity(EntityReference ref, EntityUtil.Fields fields, Include include) throws IOException {
    return getEntity(ref.getType(), ref.getId(), fields, include);
  }

  /** Retrieve the entity using id from given entity reference and fields */
  public static <T> T getEntity(String entityType, UUID id, EntityUtil.Fields fields, Include include)
      throws IOException {
    EntityRepository<?> entityRepository = Entity.getEntityRepository(entityType);
    @SuppressWarnings("unchecked")
    T entity = (T) entityRepository.get(null, id.toString(), fields, include);
    if (entity == null) {
      throw EntityNotFoundException.byMessage(CatalogExceptionMessage.entityNotFound(entityType, id));
    }
    return entity;
  }

  /** Retrieve the corresponding entity repository for a given entity name. */
  public static <T extends EntityInterface> EntityRepository<T> getEntityRepository(@NonNull String entityType) {
    @SuppressWarnings("unchecked")
    EntityRepository<T> entityRepository = (EntityRepository<T>) ENTITY_REPOSITORY_MAP.get(entityType);
    if (entityRepository == null) {
      throw EntityNotFoundException.byMessage(CatalogExceptionMessage.entityTypeNotFound(entityType));
    }
    return entityRepository;
  }

  public static void deleteEntity(
      String updatedBy, String entityType, UUID entityId, boolean recursive, boolean hardDelete) throws IOException {
    EntityRepository<?> dao = getEntityRepository(entityType);
    dao.delete(updatedBy, entityId.toString(), recursive, hardDelete);
  }

  public static void restoreEntity(String updatedBy, String entityType, UUID entityId) throws IOException {
    EntityRepository<?> dao = getEntityRepository(entityType);
    dao.restoreEntity(updatedBy, entityType, entityId);
  }

  public static <T> String getEntityTypeFromClass(Class<T> clz) {
    return CANONICAL_ENTITY_NAME_MAP.get(clz.getSimpleName().toLowerCase(Locale.ROOT));
  }

  public static String getEntityTypeFromObject(Object object) {
    return CANONICAL_ENTITY_NAME_MAP.get(object.getClass().getSimpleName().toLowerCase(Locale.ROOT));
  }

  /**
   * Get list of all the entity field names from JsonPropertyOrder annotation from generated java class from entity.json
   */
  public static <T> List<String> getEntityFields(Class<T> clz) {
    JsonPropertyOrder propertyOrder = clz.getAnnotation(JsonPropertyOrder.class);
    return new ArrayList<>(Arrays.asList(propertyOrder.value()));
  }

  public static <T> List<String> getAllowedFields(Class<T> clz) {
    String entityType = getEntityTypeFromClass(clz);
    EntityRepository<?> repository = getEntityRepository(entityType);
    return repository.getAllowedFields();
  }

  /** Class for getting validated entity list from a queryParam with list of entities. */
  public static class EntityList {
    private EntityList() {}

    public static List<String> getEntityList(String name, String entitiesParam) {
      if (entitiesParam == null) {
        return Collections.emptyList();
      }
      entitiesParam = entitiesParam.replace(" ", "");
      if (entitiesParam.equals("*")) {
        return List.of("*");
      }
      List<String> list = Arrays.asList(entitiesParam.split(","));
      validateEntities(name, list);
      return list;
    }

    private static void validateEntities(String name, List<String> list) {
      for (String entity : list) {
        if (ENTITY_REPOSITORY_MAP.get(entity) == null) {
          throw new IllegalArgumentException(String.format("Invalid entity %s in query param %s", entity, name));
        }
      }
    }
  }
}
