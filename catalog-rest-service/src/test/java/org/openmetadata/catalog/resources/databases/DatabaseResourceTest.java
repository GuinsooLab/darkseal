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

package org.openmetadata.catalog.resources.databases;

import static javax.ws.rs.core.Response.Status.BAD_REQUEST;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.openmetadata.catalog.util.TestUtils.ADMIN_AUTH_HEADERS;
import static org.openmetadata.catalog.util.TestUtils.assertListNotEmpty;
import static org.openmetadata.catalog.util.TestUtils.assertListNotNull;
import static org.openmetadata.catalog.util.TestUtils.assertListNull;
import static org.openmetadata.catalog.util.TestUtils.assertResponse;
import static org.openmetadata.catalog.util.TestUtils.assertResponseContains;

import java.io.IOException;
import java.net.URISyntaxException;
import java.util.HashMap;
import java.util.Map;
import lombok.extern.slf4j.Slf4j;
import org.apache.http.client.HttpResponseException;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInfo;
import org.junit.jupiter.api.TestInstance;
import org.openmetadata.catalog.Entity;
import org.openmetadata.catalog.api.data.CreateDatabase;
import org.openmetadata.catalog.api.data.CreateDatabaseSchema;
import org.openmetadata.catalog.entity.data.Database;
import org.openmetadata.catalog.exception.CatalogExceptionMessage;
import org.openmetadata.catalog.resources.EntityResourceTest;
import org.openmetadata.catalog.resources.databases.DatabaseResource.DatabaseList;
import org.openmetadata.catalog.type.EntityReference;
import org.openmetadata.catalog.util.FullyQualifiedName;
import org.openmetadata.catalog.util.ResultList;
import org.openmetadata.catalog.util.TestUtils;

@Slf4j
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
public class DatabaseResourceTest extends EntityResourceTest<Database, CreateDatabase> {
  public DatabaseResourceTest() {
    super(Entity.DATABASE, Database.class, DatabaseList.class, "databases", DatabaseResource.FIELDS);
  }

  @BeforeAll
  public void setup(TestInfo test) throws IOException, URISyntaxException {
    super.setup(test);
  }

  @Test
  void post_databaseWithInvalidServiceType_4xx(TestInfo test) {
    // Create a database with entity reference to databaseServiceType having invalid serviceType
    CreateDatabase create = createRequest(test);
    EntityReference invalidService = new EntityReference().withId(SNOWFLAKE_REFERENCE.getId()).withType("invalid");
    create.withService(invalidService);
    assertResponse(
        () -> createEntity(create, ADMIN_AUTH_HEADERS),
        BAD_REQUEST,
        CatalogExceptionMessage.invalidServiceEntity("invalid", Entity.DATABASE, Entity.DATABASE_SERVICE));
  }

  @Test
  void post_databaseFQN_as_admin_200_OK(TestInfo test) throws IOException {
    // Create database with different optional fields
    CreateDatabase create = createRequest(test);
    create.setService(new EntityReference().withId(SNOWFLAKE_REFERENCE.getId()).withType("databaseService"));
    Database db = createAndCheckEntity(create, ADMIN_AUTH_HEADERS);
    String expectedFQN = FullyQualifiedName.add(SNOWFLAKE_REFERENCE.getFullyQualifiedName(), create.getName());
    assertEquals(expectedFQN, db.getFullyQualifiedName());
  }

  @Test
  void post_databaseWithoutRequiredService_4xx(TestInfo test) {
    CreateDatabase create = createRequest(test).withService(null);
    assertResponseContains(() -> createEntity(create, ADMIN_AUTH_HEADERS), BAD_REQUEST, "service must not be null");
  }

  @Test
  void post_databaseWithDifferentService_200_ok(TestInfo test) throws IOException {
    EntityReference[] differentServices = {
      MYSQL_REFERENCE, REDSHIFT_REFERENCE, BIGQUERY_REFERENCE, SNOWFLAKE_REFERENCE
    };

    // Create database for each service and test APIs
    for (EntityReference service : differentServices) {
      createAndCheckEntity(createRequest(test).withService(service), ADMIN_AUTH_HEADERS);

      // List databases by filtering on service name and ensure right databases in the response
      Map<String, String> queryParams = new HashMap<>();
      queryParams.put("service", service.getName());

      ResultList<Database> list = listEntities(queryParams, ADMIN_AUTH_HEADERS);
      for (Database db : list.getData()) {
        assertEquals(service.getName(), db.getService().getName());
      }
    }
  }

  @Override
  public Database validateGetWithDifferentFields(Database database, boolean byName) throws HttpResponseException {
    // Add a schema if it already does not exist
    if (database.getDatabaseSchemas() == null) {
      DatabaseSchemaResourceTest databaseSchemaResourceTest = new DatabaseSchemaResourceTest();
      CreateDatabaseSchema create =
          databaseSchemaResourceTest.createRequest("schema", "", "", null).withDatabase(database.getEntityReference());
      databaseSchemaResourceTest.createEntity(create, ADMIN_AUTH_HEADERS);
    }

    String fields = "";
    database =
        byName
            ? getEntityByName(database.getFullyQualifiedName(), fields, ADMIN_AUTH_HEADERS)
            : getEntity(database.getId(), fields, ADMIN_AUTH_HEADERS);
    assertListNotNull(database.getService(), database.getServiceType());
    assertListNull(
        database.getOwner(), database.getDatabaseSchemas(), database.getUsageSummary(), database.getLocation());

    fields = "owner,databaseSchemas,usageSummary,location";
    database =
        byName
            ? getEntityByName(database.getFullyQualifiedName(), fields, ADMIN_AUTH_HEADERS)
            : getEntity(database.getId(), fields, ADMIN_AUTH_HEADERS);
    assertListNotNull(database.getService(), database.getServiceType());
    // Fields usageSummary and location are not set during creation - tested elsewhere
    TestUtils.validateEntityReferences(database.getDatabaseSchemas(), true);
    assertListNotEmpty(database.getDatabaseSchemas());
    // Checks for other owner, tags, and followers is done in the base class
    return database;
  }

  @Override
  public CreateDatabase createRequest(String name) {
    return new CreateDatabase().withName(name).withService(getContainer());
  }

  @Override
  public EntityReference getContainer() {
    return SNOWFLAKE_REFERENCE;
  }

  @Override
  public EntityReference getContainer(Database entity) {
    return entity.getService();
  }

  @Override
  public void validateCreatedEntity(Database database, CreateDatabase createRequest, Map<String, String> authHeaders) {
    // Validate service
    assertNotNull(database.getServiceType());
    assertReference(createRequest.getService(), database.getService());
    assertEquals(
        FullyQualifiedName.add(database.getService().getName(), database.getName()), database.getFullyQualifiedName());
  }

  @Override
  public void compareEntities(Database expected, Database updated, Map<String, String> authHeaders) {
    assertReference(expected.getService(), updated.getService());
    assertEquals(
        FullyQualifiedName.add(updated.getService().getName(), updated.getName()), updated.getFullyQualifiedName());
  }

  @Override
  public void assertFieldChange(String fieldName, Object expected, Object actual) throws IOException {
    assertCommonFieldChange(fieldName, expected, actual);
  }
}
