package org.openmetadata.service.resources.query;

import static javax.ws.rs.core.Response.Status.BAD_REQUEST;
import static javax.ws.rs.core.Response.Status.OK;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.openmetadata.service.util.TestUtils.ADMIN_AUTH_HEADERS;
import static org.openmetadata.service.util.TestUtils.LONG_ENTITY_NAME;
import static org.openmetadata.service.util.TestUtils.assertListNotNull;
import static org.openmetadata.service.util.TestUtils.assertListNull;
import static org.openmetadata.service.util.TestUtils.assertResponse;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import javax.ws.rs.client.WebTarget;
import javax.ws.rs.core.Response;
import lombok.SneakyThrows;
import lombok.extern.slf4j.Slf4j;
import org.apache.http.client.HttpResponseException;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInfo;
import org.openmetadata.schema.api.VoteRequest;
import org.openmetadata.schema.api.data.CreateQuery;
import org.openmetadata.schema.api.data.CreateTable;
import org.openmetadata.schema.entity.data.Query;
import org.openmetadata.schema.entity.data.Table;
import org.openmetadata.schema.type.ChangeEvent;
import org.openmetadata.schema.type.Column;
import org.openmetadata.schema.type.ColumnDataType;
import org.openmetadata.schema.type.EntityReference;
import org.openmetadata.service.Entity;
import org.openmetadata.service.resources.EntityResourceTest;
import org.openmetadata.service.resources.databases.TableResourceTest;
import org.openmetadata.service.util.JsonUtils;
import org.openmetadata.service.util.QueryUtil;
import org.openmetadata.service.util.TestUtils;

@Slf4j
public class QueryResourceTest extends EntityResourceTest<Query, CreateQuery> {
  private EntityReference TABLE_REF;
  private String QUERY;
  private String QUERY_CHECKSUM;

  public QueryResourceTest() {
    super(Entity.QUERY, Query.class, QueryResource.QueryList.class, "queries", QueryResource.FIELDS);
    supportsSoftDelete = false;
  }

  @BeforeAll
  @SneakyThrows
  public void setupQuery(TestInfo test) {
    TableResourceTest tableResourceTest = new TableResourceTest();
    // Create Table Entity
    List<Column> columns = List.of(TableResourceTest.getColumn(C1, ColumnDataType.INT, null));
    CreateTable create =
        tableResourceTest
            .createRequest(test)
            .withName(String.format(getEntityName(test)))
            .withColumns(columns)
            .withOwner(EntityResourceTest.USER1_REF);
    Table createdTable = tableResourceTest.createAndCheckEntity(create, ADMIN_AUTH_HEADERS);
    TABLE_REF = createdTable.getEntityReference();
    QUERY = "select * from sales";
    QUERY_CHECKSUM = QueryUtil.getCheckSum(QUERY);
  }

  @Override
  public CreateQuery createRequest(String type) {
    return new CreateQuery()
        .withName(type)
        .withOwner(USER1_REF)
        .withUsers(List.of(USER2.getName()))
        .withQueryUsedIn(List.of(TABLE_REF))
        .withQuery(QUERY)
        .withDuration(0.0)
        .withQueryDate(1673857635064L);
  }

  @Override
  public void validateCreatedEntity(Query createdEntity, CreateQuery request, Map<String, String> authHeaders)
      throws HttpResponseException {
    assertEquals(request.getQuery(), createdEntity.getQuery());
    assertEquals(request.getQueryDate(), createdEntity.getQueryDate());
    assertEntityReferences(request.getQueryUsedIn(), createdEntity.getQueryUsedIn());
  }

  @Override
  public void compareEntities(Query expected, Query updated, Map<String, String> authHeaders)
      throws HttpResponseException {}

  @Override
  public Query validateGetWithDifferentFields(Query entity, boolean byName) throws HttpResponseException {
    String fields = "";
    entity =
        byName
            ? getEntityByName(entity.getFullyQualifiedName(), fields, ADMIN_AUTH_HEADERS)
            : getEntity(entity.getId(), null, ADMIN_AUTH_HEADERS);
    assertListNull(entity.getOwner(), entity.getUsers(), entity.getQueryUsedIn());
    fields = "owner,tags,followers,users,queryUsedIn"; // Not testing for kpiResult field
    entity =
        byName
            ? getEntityByName(entity.getFullyQualifiedName(), fields, ADMIN_AUTH_HEADERS)
            : getEntity(entity.getId(), fields, ADMIN_AUTH_HEADERS);
    assertListNotNull(entity.getOwner(), entity.getUsers(), entity.getQueryUsedIn());
    return entity;
  }

  @Override
  public void assertFieldChange(String fieldName, Object expected, Object actual) throws IOException {}

  @Test
  public void post_valid_query_test_created(TestInfo test) throws IOException {
    CreateQuery create = createRequest(getEntityName(test));
    createEntity(create, ADMIN_AUTH_HEADERS);
    assertNotNull(create);
  }

  @Test
  public void post_without_query_400() {
    CreateQuery create = new CreateQuery().withDuration(0.0).withQueryDate(1673857635064L);
    assertResponse(
        () -> createEntity(create, ADMIN_AUTH_HEADERS), Response.Status.BAD_REQUEST, "[query must not be null]");
  }

  @Test
  void post_same_query_forSameEntityType_409(TestInfo test) throws HttpResponseException {
    CreateQuery create = createRequest(getEntityName(test));
    createEntity(create, ADMIN_AUTH_HEADERS);

    CreateQuery create1 = createRequest(getEntityName(test));

    assertResponse(() -> createEntity(create1, ADMIN_AUTH_HEADERS), Response.Status.CONFLICT, "Entity already exists");
  }

  @Test
  void put_vote_queryUsage_update(TestInfo test) throws IOException {
    // create query with vote 1
    CreateQuery create = createRequest(getEntityName(test));
    Query createdEntity = createAndCheckEntity(create, ADMIN_AUTH_HEADERS);
    // 1
    VoteRequest request = new VoteRequest().withUpdatedVoteType(VoteRequest.VoteType.VOTED_UP);
    WebTarget target = getResource(String.format("%s/%s/vote", collectionName, createdEntity.getId().toString()));
    ChangeEvent changeEvent = TestUtils.put(target, request, ChangeEvent.class, OK, ADMIN_AUTH_HEADERS);
    Query updatedEntity = JsonUtils.convertValue(changeEvent.getEntity(), Query.class);
    assertEquals(1, updatedEntity.getVotes().getUpVotes());
    assertEquals(0, updatedEntity.getVotes().getDownVotes());

    // 2
    VoteRequest request2 = new VoteRequest().withUpdatedVoteType(VoteRequest.VoteType.VOTED_DOWN);
    ChangeEvent changeEvent2 = TestUtils.put(target, request2, ChangeEvent.class, OK, ADMIN_AUTH_HEADERS);
    Query updatedEntity2 = JsonUtils.convertValue(changeEvent2.getEntity(), Query.class);
    assertEquals(0, updatedEntity2.getVotes().getUpVotes());
    assertEquals(1, updatedEntity2.getVotes().getDownVotes());
  }

  @Test
  @SneakyThrows
  @Override
  protected void post_entityCreateWithInvalidName_400() {
    // Note: in case of Query empty name works fine since we internally use Checksum
    // Create an entity with mandatory name field null
    final CreateQuery request = createRequest(null, "description", "displayName", null).withQuery(QUERY);
    Query entity = createEntity(request, ADMIN_AUTH_HEADERS);
    assertEquals(QUERY_CHECKSUM, entity.getName());

    // Create an entity with mandatory name field empty
    final CreateQuery request1 = createRequest("TestQueryName", "description", "displayName", null);
    entity = createEntity(request1, ADMIN_AUTH_HEADERS);
    assertEquals("TestQueryName", entity.getName());

    // Create an entity with mandatory name field too long
    final CreateQuery request2 = createRequest(LONG_ENTITY_NAME, "description", "displayName", null);
    assertResponse(
        () -> createEntity(request2, ADMIN_AUTH_HEADERS), BAD_REQUEST, TestUtils.getEntityNameLengthError(entityClass));
  }
}
