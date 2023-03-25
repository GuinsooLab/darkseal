package org.openmetadata.service.jdbi3;

import static org.openmetadata.common.utils.CommonUtil.listOrEmpty;
import static org.openmetadata.schema.type.Include.ALL;
import static org.openmetadata.service.Entity.CONTAINER;
import static org.openmetadata.service.Entity.FIELD_FOLLOWERS;
import static org.openmetadata.service.Entity.FIELD_TAGS;
import static org.openmetadata.service.Entity.OBJECT_STORE_SERVICE;

import com.google.common.collect.Lists;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import org.openmetadata.schema.EntityInterface;
import org.openmetadata.schema.entity.data.Container;
import org.openmetadata.schema.entity.services.ObjectStoreService;
import org.openmetadata.schema.type.Column;
import org.openmetadata.schema.type.EntityReference;
import org.openmetadata.schema.type.Include;
import org.openmetadata.schema.type.Relationship;
import org.openmetadata.schema.type.TagLabel;
import org.openmetadata.service.Entity;
import org.openmetadata.service.resources.objectstores.ContainerResource;
import org.openmetadata.service.util.EntityUtil;
import org.openmetadata.service.util.FullyQualifiedName;

public class ContainerRepository extends EntityRepository<Container> {

  private static final String CONTAINER_UPDATE_FIELDS = "dataModel,owner,tags,extension";
  private static final String CONTAINER_PATCH_FIELDS = "dataModel,owner,tags,extension";

  public ContainerRepository(CollectionDAO dao) {
    super(
        ContainerResource.COLLECTION_PATH,
        Entity.CONTAINER,
        Container.class,
        dao.containerDAO(),
        dao,
        CONTAINER_PATCH_FIELDS,
        CONTAINER_UPDATE_FIELDS);
  }

  @Override
  public Container setFields(Container container, EntityUtil.Fields fields) throws IOException {
    setDefaultFields(container);
    container.setChildren(fields.contains("children") ? getChildrenContainers(container) : null);
    container.setParent(fields.contains("parent") ? getParentContainer(container) : null);
    container.setDataModel(fields.contains("dataModel") ? container.getDataModel() : null);
    if (container.getDataModel() != null) {
      populateDataModelColumnTags(fields.contains(FIELD_TAGS), container.getDataModel().getColumns());
    }
    container.setFollowers(fields.contains(FIELD_FOLLOWERS) ? getFollowers(container) : null);
    return container;
  }

  private void populateDataModelColumnTags(boolean setTags, List<Column> columns) {
    for (Column c : listOrEmpty(columns)) {
      c.setTags(setTags ? getTags(c.getFullyQualifiedName()) : null);
      populateDataModelColumnTags(setTags, c.getChildren());
    }
  }

  private EntityReference getParentContainer(Container container) throws IOException {
    if (container == null) return null;
    return getFromEntityRef(container.getId(), Relationship.CONTAINS, CONTAINER, false);
  }

  private void setDefaultFields(Container container) throws IOException {
    EntityReference parentObjectStoreServiceRef =
        getFromEntityRef(container.getId(), Relationship.CONTAINS, OBJECT_STORE_SERVICE, true);
    container.withService(parentObjectStoreServiceRef);
  }

  private List<EntityReference> getChildrenContainers(Container container) throws IOException {
    if (container == null) {
      return Collections.emptyList();
    }
    List<CollectionDAO.EntityRelationshipRecord> childContainerIds =
        findTo(container.getId(), CONTAINER, Relationship.CONTAINS, CONTAINER);
    return EntityUtil.populateEntityReferences(childContainerIds, CONTAINER);
  }

  @Override
  public void setFullyQualifiedName(Container container) {
    if (container.getParent() != null) {
      container.setFullyQualifiedName(
          FullyQualifiedName.add(container.getParent().getFullyQualifiedName(), container.getName()));
    } else {
      container.setFullyQualifiedName(
          FullyQualifiedName.add(container.getService().getFullyQualifiedName(), container.getName()));
    }
    if (container.getDataModel() != null) {
      setColumnFQN(container.getFullyQualifiedName(), container.getDataModel().getColumns());
    }
  }

  private void setColumnFQN(String parentFQN, List<Column> columns) {
    columns.forEach(
        c -> {
          String columnFqn = FullyQualifiedName.add(parentFQN, c.getName());
          c.setFullyQualifiedName(columnFqn);
          if (c.getChildren() != null) {
            setColumnFQN(columnFqn, c.getChildren());
          }
        });
  }

  @Override
  public void prepare(Container container) throws IOException {
    // the objectStoreService is not fully filled in terms of props - go to the db and get it in full and re-set it
    ObjectStoreService objectStoreService = Entity.getEntity(container.getService(), "", Include.NON_DELETED);
    container.setService(objectStoreService.getEntityReference());
    container.setServiceType(objectStoreService.getServiceType());

    if (container.getParent() != null) {
      Container parent = Entity.getEntity(container.getParent(), "owner", ALL);
      container.withParent(parent.getEntityReference());
    }
  }

  @Override
  public void storeEntity(Container container, boolean update) throws IOException {
    EntityReference objectStoreService = container.getService();
    EntityReference parent = container.getParent();
    List<EntityReference> children = container.getChildren();
    EntityReference owner = container.getOwner();
    List<TagLabel> tags = container.getTags();

    container.withService(null).withParent(null).withChildren(null).withOwner(null).withHref(null).withTags(null);

    // Don't store datamodel column tags as JSON but build it on the fly based on relationships
    List<Column> columnWithTags = Lists.newArrayList();
    if (container.getDataModel() != null) {
      columnWithTags.addAll(container.getDataModel().getColumns());
      container.getDataModel().setColumns(ColumnUtil.cloneWithoutTags(columnWithTags));
      container.getDataModel().getColumns().forEach(column -> column.setTags(null));
    }

    store(container, update);

    // Restore the relationships
    container.withService(objectStoreService).withParent(parent).withChildren(children).withOwner(owner).withTags(tags);
    if (container.getDataModel() != null) {
      container.getDataModel().setColumns(columnWithTags);
    }
  }

  @Override
  public void restorePatchAttributes(Container original, Container updated) {
    // Patch can't make changes to following fields. Ignore the changes
    updated
        .withFullyQualifiedName(original.getFullyQualifiedName())
        .withService(original.getService())
        .withParent(original.getParent())
        .withName(original.getName())
        .withId(original.getId());
  }

  @Override
  public void storeRelationships(Container container) throws IOException {

    // store each relationship separately in the entity_relationship table
    EntityReference service = container.getService();
    addRelationship(service.getId(), container.getId(), service.getType(), CONTAINER, Relationship.CONTAINS);

    // parent container if exists
    EntityReference parentReference = container.getParent();
    if (parentReference != null) {
      addRelationship(parentReference.getId(), container.getId(), CONTAINER, CONTAINER, Relationship.CONTAINS);
    }
    storeOwner(container, container.getOwner());
    applyTags(container);
  }

  @Override
  public EntityUpdater getUpdater(Container original, Container updated, Operation operation) {
    return new ContainerUpdater(original, updated, operation);
  }

  @Override
  public List<TagLabel> getAllTags(EntityInterface entity) {
    List<TagLabel> allTags = new ArrayList<>();
    Container container = (Container) entity;
    EntityUtil.mergeTags(allTags, container.getTags());
    if (container.getDataModel() != null) {
      for (Column column : listOrEmpty(container.getDataModel().getColumns())) {
        EntityUtil.mergeTags(allTags, column.getTags());
      }
    }
    return allTags;
  }

  /** Handles entity updated from PUT and POST operations */
  public class ContainerUpdater extends ColumnEntityUpdater {
    public ContainerUpdater(Container original, Container updated, Operation operation) {
      super(original, updated, operation);
    }

    @Override
    public void entitySpecificUpdate() throws IOException {
      updateDataModel(original, updated);
    }

    private void updateDataModel(Container original, Container updated) throws IOException {

      if (original.getDataModel() == null || updated.getDataModel() == null) {
        recordChange("dataModel", original.getDataModel(), updated.getDataModel(), true);
      }

      if (original.getDataModel() != null && updated.getDataModel() != null) {
        updateColumns(
            "dataModel.columns",
            original.getDataModel().getColumns(),
            updated.getDataModel().getColumns(),
            EntityUtil.columnMatch);
        recordChange(
            "dataModel.partition",
            original.getDataModel().getIsPartitioned(),
            updated.getDataModel().getIsPartitioned());
      }
    }
  }
}
