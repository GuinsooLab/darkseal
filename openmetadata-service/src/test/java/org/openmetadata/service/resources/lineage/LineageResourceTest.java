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

package org.openmetadata.service.resources.lineage;

import static javax.ws.rs.core.Response.Status.BAD_REQUEST;
import static javax.ws.rs.core.Response.Status.FORBIDDEN;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.openmetadata.service.Entity.ADMIN_USER_NAME;
import static org.openmetadata.service.exception.CatalogExceptionMessage.permissionNotAllowed;
import static org.openmetadata.service.security.SecurityUtil.authHeaders;
import static org.openmetadata.service.util.TestUtils.ADMIN_AUTH_HEADERS;
import static org.openmetadata.service.util.TestUtils.assertResponse;

import java.io.IOException;
import java.net.URISyntaxException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import javax.ws.rs.client.WebTarget;
import javax.ws.rs.core.Response.Status;
import lombok.extern.slf4j.Slf4j;
import org.apache.http.client.HttpResponseException;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInfo;
import org.junit.jupiter.api.TestMethodOrder;
import org.openmetadata.schema.api.data.CreateTable;
import org.openmetadata.schema.api.lineage.AddLineage;
import org.openmetadata.schema.entity.data.Table;
import org.openmetadata.schema.entity.teams.Role;
import org.openmetadata.schema.entity.teams.User;
import org.openmetadata.schema.type.ColumnLineage;
import org.openmetadata.schema.type.Edge;
import org.openmetadata.schema.type.EntitiesEdge;
import org.openmetadata.schema.type.EntityLineage;
import org.openmetadata.schema.type.EntityReference;
import org.openmetadata.schema.type.LineageDetails;
import org.openmetadata.schema.type.MetadataOperation;
import org.openmetadata.service.Entity;
import org.openmetadata.service.OpenMetadataApplicationTest;
import org.openmetadata.service.resources.databases.TableResourceTest;
import org.openmetadata.service.resources.teams.RoleResource;
import org.openmetadata.service.resources.teams.RoleResourceTest;
import org.openmetadata.service.resources.teams.UserResourceTest;
import org.openmetadata.service.util.TestUtils;

@Slf4j
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class LineageResourceTest extends OpenMetadataApplicationTest {
  public static final List<Table> TABLES = new ArrayList<>();
  public static final int TABLE_COUNT = 10;

  private static final String DATA_STEWARD_ROLE_NAME = "DataSteward";

  @BeforeAll
  public static void setup(TestInfo test) throws IOException, URISyntaxException {
    // Create TABLE_COUNT number of tables
    TableResourceTest tableResourceTest = new TableResourceTest();
    tableResourceTest.setup(test); // Initialize TableResourceTest for using helper methods
    for (int i = 0; i < TABLE_COUNT; i++) {
      CreateTable createTable = tableResourceTest.createRequest(test, i);
      TABLES.add(tableResourceTest.createEntity(createTable, ADMIN_AUTH_HEADERS));
    }
  }

  @Order(1)
  @Test
  void put_delete_lineage_withAuthorizer() throws HttpResponseException {
    // Random user cannot update lineage.
    UserResourceTest userResourceTest = new UserResourceTest();
    User randomUser =
        userResourceTest.createEntity(userResourceTest.createRequest("lineage_user", "", "", null), ADMIN_AUTH_HEADERS);

    // User with Data Steward role. Data Steward role has a default policy to allow update for lineage.
    RoleResourceTest roleResourceTest = new RoleResourceTest();
    Role dataStewardRole =
        roleResourceTest.getEntityByName(DATA_STEWARD_ROLE_NAME, null, RoleResource.FIELDS, ADMIN_AUTH_HEADERS);
    User userWithDataStewardRole =
        userResourceTest.createEntity(
            userResourceTest
                .createRequest("lineage_user_data_steward", "", "", null)
                .withRoles(List.of(dataStewardRole.getId())),
            ADMIN_AUTH_HEADERS);

    // Admins are able to add or delete edges.
    checkAuthorization(ADMIN_USER_NAME, false);
    // User with Data Steward role is able to add or delete edges.
    checkAuthorization(userWithDataStewardRole.getName(), false);
    // Random user is not able to add or delete edges.
    checkAuthorization(randomUser.getName(), true);
  }

  private void checkAuthorization(String userName, boolean shouldThrowException) throws HttpResponseException {
    Map<String, String> authHeaders = authHeaders(userName + "@open-metadata.org");

    if (shouldThrowException) {
      assertResponse(
          () -> addEdge(TABLES.get(1), TABLES.get(2), null, authHeaders),
          FORBIDDEN,
          permissionNotAllowed(userName, List.of(MetadataOperation.EDIT_LINEAGE)));
      assertResponse(
          () -> deleteEdge(TABLES.get(1), TABLES.get(2), authHeaders),
          FORBIDDEN,
          permissionNotAllowed(userName, List.of(MetadataOperation.EDIT_LINEAGE)));
      return;
    }

    addEdge(TABLES.get(1), TABLES.get(2), null, authHeaders(userName + "@open-metadata.org"));
    deleteEdge(TABLES.get(1), TABLES.get(2), authHeaders(userName + "@open-metadata.org"));
  }

  @Order(2)
  @Test
  void put_delete_lineage_200() throws HttpResponseException {
    // Add lineage table4-->table5
    addEdge(TABLES.get(4), TABLES.get(5));

    // Add lineage table5-->table6
    addEdge(TABLES.get(5), TABLES.get(6));
    addEdge(TABLES.get(5), TABLES.get(6)); // PUT operation again with the same edge

    //
    // Add edges to this lineage graph
    //          table2-->      -->table9
    // table0-->table3-->table4-->table5->table6->table7
    //          table1-->      -->table8
    addEdge(TABLES.get(0), TABLES.get(3));
    addEdge(TABLES.get(2), TABLES.get(4));
    addEdge(TABLES.get(3), TABLES.get(4));
    addEdge(TABLES.get(1), TABLES.get(4));
    addEdge(TABLES.get(4), TABLES.get(9));
    addEdge(TABLES.get(4), TABLES.get(5));
    addEdge(TABLES.get(4), TABLES.get(8));
    addEdge(TABLES.get(5), TABLES.get(6));
    addEdge(TABLES.get(6), TABLES.get(7));

    // Test table4 lineage
    Edge[] expectedUpstreamEdges = {
      getEdge(TABLES.get(2), TABLES.get(4)),
      getEdge(TABLES.get(3), TABLES.get(4)),
      getEdge(TABLES.get(1), TABLES.get(4)),
      getEdge(TABLES.get(0), TABLES.get(3))
    };
    Edge[] expectedDownstreamEdges = {
      getEdge(TABLES.get(4), TABLES.get(9)),
      getEdge(TABLES.get(4), TABLES.get(5)),
      getEdge(TABLES.get(4), TABLES.get(8)),
      getEdge(TABLES.get(5), TABLES.get(6)),
      getEdge(TABLES.get(6), TABLES.get(7))
    };

    // GET lineage by id and fqn and ensure it is correct
    assertLineage(
        Entity.TABLE,
        TABLES.get(4).getId(),
        TABLES.get(4).getFullyQualifiedName(),
        3,
        3,
        expectedUpstreamEdges,
        expectedDownstreamEdges);

    // Test table4 partial lineage with various upstream and downstream depths
    // First upstream and downstream depth of 0
    assertLineage(
        Entity.TABLE,
        TABLES.get(4).getId(),
        TABLES.get(4).getFullyQualifiedName(),
        0,
        0,
        Arrays.copyOfRange(expectedUpstreamEdges, 0, 0),
        Arrays.copyOfRange(expectedDownstreamEdges, 0, 0));
    // Upstream and downstream depth of 1
    assertLineage(
        Entity.TABLE,
        TABLES.get(4).getId(),
        TABLES.get(4).getFullyQualifiedName(),
        1,
        1,
        Arrays.copyOfRange(expectedUpstreamEdges, 0, 3),
        Arrays.copyOfRange(expectedDownstreamEdges, 0, 3));
    // Upstream and downstream depth of 2
    assertLineage(
        Entity.TABLE,
        TABLES.get(4).getId(),
        TABLES.get(4).getFullyQualifiedName(),
        2,
        2,
        Arrays.copyOfRange(expectedUpstreamEdges, 0, 4),
        Arrays.copyOfRange(expectedDownstreamEdges, 0, 4));

    // Upstream and downstream depth as null to test for default value of 1
    assertLineage(
        Entity.TABLE,
        TABLES.get(4).getId(),
        TABLES.get(4).getFullyQualifiedName(),
        null,
        null,
        Arrays.copyOfRange(expectedUpstreamEdges, 0, 3),
        Arrays.copyOfRange(expectedDownstreamEdges, 0, 3));

    //
    // Delete all the lineage edges
    //          table2-->      -->table9
    // table0-->table3-->table4-->table5->table6->table7
    //          table1-->      -->table8
    deleteEdge(TABLES.get(0), TABLES.get(3));
    deleteEdge(TABLES.get(3), TABLES.get(4));
    deleteEdge(TABLES.get(2), TABLES.get(4));
    deleteEdge(TABLES.get(1), TABLES.get(4));
    deleteEdge(TABLES.get(4), TABLES.get(9));
    deleteEdge(TABLES.get(4), TABLES.get(5));
    deleteEdge(TABLES.get(4), TABLES.get(8));
    deleteEdge(TABLES.get(5), TABLES.get(6));
    deleteEdge(TABLES.get(6), TABLES.get(7));

    // Ensure upstream and downstream lineage is empty
    assertLineage(
        Entity.TABLE, TABLES.get(4).getId(), TABLES.get(4).getFullyQualifiedName(), 2, 2, new Edge[0], new Edge[0]);
  }

  @Order(3)
  @Test
  void put_lineageWithDetails() throws HttpResponseException {
    // Add column lineage table1.c1 -> table2.c1
    LineageDetails details = new LineageDetails();
    String t1c1FQN = TABLES.get(0).getColumns().get(0).getFullyQualifiedName();
    String t1c2FQN = TABLES.get(0).getColumns().get(1).getFullyQualifiedName();
    String t1c3FQN = TABLES.get(0).getColumns().get(2).getFullyQualifiedName();
    String t2c1FQN = TABLES.get(1).getColumns().get(0).getFullyQualifiedName();
    String t2c2FQN = TABLES.get(1).getColumns().get(1).getFullyQualifiedName();
    String t2c3FQN = TABLES.get(1).getColumns().get(2).getFullyQualifiedName();
    String t3c1FQN = TABLES.get(2).getColumns().get(0).getFullyQualifiedName();
    String t3c2FQN = TABLES.get(2).getColumns().get(1).getFullyQualifiedName();
    String t3c3FQN = TABLES.get(2).getColumns().get(2).getFullyQualifiedName();

    details.getColumnsLineage().add(new ColumnLineage().withFromColumns(List.of(t1c1FQN)).withToColumn(t2c1FQN));
    addEdge(TABLES.get(0), TABLES.get(1), details, ADMIN_AUTH_HEADERS);

    // Add invalid column lineage (from column or to column are invalid)
    details
        .getColumnsLineage()
        .add(new ColumnLineage().withFromColumns(List.of("invalidColumn")).withToColumn(t2c1FQN));
    assertResponse(
        () -> addEdge(TABLES.get(0), TABLES.get(1), details, ADMIN_AUTH_HEADERS),
        BAD_REQUEST,
        "Invalid fully qualified column name invalidColumn");
    details
        .getColumnsLineage()
        .add(new ColumnLineage().withFromColumns(List.of(t1c1FQN)).withToColumn("invalidColumn"));
    assertResponse(
        () -> addEdge(TABLES.get(0), TABLES.get(1), details, ADMIN_AUTH_HEADERS),
        BAD_REQUEST,
        "Invalid fully qualified column name invalidColumn");

    // Add column level lineage with multiple fromColumns (t1c1 + t3c1) to t2c1
    details.getColumnsLineage().clear();
    details
        .getColumnsLineage()
        .add(new ColumnLineage().withFromColumns(List.of(t1c1FQN, t3c1FQN)).withToColumn(t2c1FQN));
    addEdge(TABLES.get(0), TABLES.get(1), details, ADMIN_AUTH_HEADERS);

    // Finally, add detailed column level lineage
    details.getColumnsLineage().clear();
    List<ColumnLineage> lineage = details.getColumnsLineage();
    lineage.add(new ColumnLineage().withFromColumns(List.of(t1c1FQN, t3c1FQN)).withToColumn(t2c1FQN));
    lineage.add(new ColumnLineage().withFromColumns(List.of(t1c2FQN, t3c2FQN)).withToColumn(t2c2FQN));
    lineage.add(new ColumnLineage().withFromColumns(List.of(t1c3FQN, t3c3FQN)).withToColumn(t2c3FQN));

    addEdge(TABLES.get(0), TABLES.get(1), details, ADMIN_AUTH_HEADERS);
  }

  public Edge getEdge(Table from, Table to) {
    return getEdge(from.getId(), to.getId(), null);
  }

  public static Edge getEdge(UUID from, UUID to, LineageDetails details) {
    return new Edge().withFromEntity(from).withToEntity(to).withLineageDetails(details);
  }

  public void addEdge(Table from, Table to) throws HttpResponseException {
    addEdge(from, to, null, ADMIN_AUTH_HEADERS);
  }

  private void addEdge(Table from, Table to, LineageDetails details, Map<String, String> authHeaders)
      throws HttpResponseException {
    if (details != null) {
      details.setSqlQuery("select *;");
    }
    EntitiesEdge edge =
        new EntitiesEdge()
            .withFromEntity(from.getEntityReference())
            .withToEntity(to.getEntityReference())
            .withLineageDetails(details);
    AddLineage addLineage = new AddLineage().withEdge(edge);
    addLineageAndCheck(addLineage, authHeaders);
  }

  public void deleteEdge(Table from, Table to) throws HttpResponseException {
    deleteEdge(from, to, ADMIN_AUTH_HEADERS);
  }

  private void deleteEdge(Table from, Table to, Map<String, String> authHeaders) throws HttpResponseException {
    EntitiesEdge edge =
        new EntitiesEdge().withFromEntity(from.getEntityReference()).withToEntity(to.getEntityReference());
    deleteLineageAndCheck(edge, authHeaders);
  }

  public void addLineageAndCheck(AddLineage addLineage, Map<String, String> authHeaders) throws HttpResponseException {
    addLineage(addLineage, authHeaders);
    validateLineage(addLineage, authHeaders);
  }

  public void deleteLineageAndCheck(EntitiesEdge deleteEdge, Map<String, String> authHeaders)
      throws HttpResponseException {
    deleteLineage(deleteEdge, authHeaders);
    validateLineageDeleted(deleteEdge, authHeaders);
  }

  public void addLineage(AddLineage addLineage, Map<String, String> authHeaders) throws HttpResponseException {
    TestUtils.put(getResource("lineage"), addLineage, Status.OK, authHeaders);
  }

  public void deleteLineage(EntitiesEdge edge, Map<String, String> authHeaders) throws HttpResponseException {
    WebTarget target =
        getResource(
            String.format(
                "lineage/%s/%s/%s/%s",
                edge.getFromEntity().getType(),
                edge.getFromEntity().getId(),
                edge.getToEntity().getType(),
                edge.getToEntity().getId()));
    TestUtils.delete(target, authHeaders);
  }

  private void validateLineage(AddLineage addLineage, Map<String, String> authHeaders) throws HttpResponseException {
    EntityReference from = addLineage.getEdge().getFromEntity();
    EntityReference to = addLineage.getEdge().getToEntity();
    Edge expectedEdge = getEdge(from.getId(), to.getId(), addLineage.getEdge().getLineageDetails());

    // Check fromEntity ---> toEntity downstream edge of 'from' is returned
    EntityLineage lineage = getLineage(from.getType(), from.getId(), 0, 1, authHeaders);
    assertEdge(lineage, expectedEdge, true);

    // Check fromEntity ---> toEntity upstream edge 'to' is returned
    lineage = getLineage(to.getType(), to.getId(), 1, 0, authHeaders);
    assertEdge(lineage, expectedEdge, false);
  }

  private void validateLineageDeleted(EntitiesEdge deletedEdge, Map<String, String> authHeaders)
      throws HttpResponseException {
    EntityReference from = deletedEdge.getFromEntity();
    EntityReference to = deletedEdge.getToEntity();
    Edge expectedEdge = getEdge(from.getId(), to.getId(), deletedEdge.getLineageDetails());

    // Check fromEntity ---> toEntity downstream edge is returned
    EntityLineage lineage = getLineage(from.getType(), from.getId(), 0, 1, authHeaders);
    assertDeleted(lineage, expectedEdge, true);

    // Check fromEntity ---> toEntity upstream edge is returned
    lineage = getLineage(to.getType(), to.getId(), 1, 0, authHeaders);
    assertDeleted(lineage, expectedEdge, false);
  }

  private static void validateLineage(EntityLineage lineage) {
    TestUtils.validateEntityReference(lineage.getEntity());
    lineage.getNodes().forEach(TestUtils::validateEntityReference);

    // Total number of from and to points in an edge must be equal to the number of nodes
    List<UUID> ids = new ArrayList<>();
    lineage
        .getUpstreamEdges()
        .forEach(
            edge -> {
              ids.add(edge.getFromEntity());
              ids.add(edge.getToEntity());
            });
    lineage
        .getDownstreamEdges()
        .forEach(
            edge -> {
              ids.add(edge.getFromEntity());
              ids.add(edge.getToEntity());
            });
    if (lineage.getNodes().size() != 0) {
      assertEquals((int) ids.stream().distinct().count(), lineage.getNodes().size() + 1);
    }
  }

  public void assertLineage(
      String entityType,
      UUID id,
      String fqn,
      Integer upstreamDepth,
      Integer downstreamDepth,
      Edge[] expectedUpstreamEdges,
      Edge[] expectedDownstreamEdges)
      throws HttpResponseException {
    EntityLineage lineageById = getLineage(entityType, id, upstreamDepth, downstreamDepth, ADMIN_AUTH_HEADERS);
    assertEdges(lineageById, expectedUpstreamEdges, expectedDownstreamEdges);

    EntityLineage lineageByName = getLineageByName(entityType, fqn, upstreamDepth, downstreamDepth, ADMIN_AUTH_HEADERS);
    assertEdges(lineageByName, expectedUpstreamEdges, expectedDownstreamEdges);

    // Finally, ensure lineage by Id matches lineage by name
    assertEquals(lineageById, lineageByName);
  }

  public EntityLineage getLineage(
      String entity, UUID id, Integer upstreamDepth, Integer downStreamDepth, Map<String, String> authHeaders)
      throws HttpResponseException {
    WebTarget target = getResource("lineage/" + entity + "/" + id);
    target = upstreamDepth != null ? target.queryParam("upstreamDepth", upstreamDepth) : target;
    target = downStreamDepth != null ? target.queryParam("downstreamDepth", downStreamDepth) : target;
    EntityLineage lineage = TestUtils.get(target, EntityLineage.class, authHeaders);
    validateLineage((lineage));
    return lineage;
  }

  public EntityLineage getLineageByName(
      String entity, String fqn, Integer upstreamDepth, Integer downStreamDepth, Map<String, String> authHeaders)
      throws HttpResponseException {
    WebTarget target = getResource("lineage/" + entity + "/name/").path(fqn);
    target = upstreamDepth != null ? target.queryParam("upstreamDepth", upstreamDepth) : target;
    target = downStreamDepth != null ? target.queryParam("downstreamDepth", downStreamDepth) : target;
    EntityLineage lineage = TestUtils.get(target, EntityLineage.class, authHeaders);
    validateLineage((lineage));
    return lineage;
  }

  public void assertEdge(EntityLineage lineage, Edge expectedEdge, boolean downstream) {
    if (downstream) {
      assertTrue(lineage.getDownstreamEdges().contains(expectedEdge));
    } else {
      assertTrue(lineage.getUpstreamEdges().contains(expectedEdge));
    }
  }

  public void assertDeleted(EntityLineage lineage, Edge expectedEdge, boolean downstream) {
    if (downstream) {
      assertFalse(lineage.getDownstreamEdges().contains(expectedEdge));
    } else {
      assertFalse(lineage.getUpstreamEdges().contains(expectedEdge));
    }
  }

  public void assertEdges(EntityLineage lineage, Edge[] expectedUpstreamEdges, Edge[] expectedDownstreamEdges) {
    assertEquals(lineage.getUpstreamEdges().size(), expectedUpstreamEdges.length);
    for (Edge expectedUpstreamEdge : expectedUpstreamEdges) {
      assertTrue(lineage.getUpstreamEdges().contains(expectedUpstreamEdge));
    }
    assertEquals(lineage.getDownstreamEdges().size(), expectedDownstreamEdges.length);
    for (Edge expectedDownstreamEdge : expectedDownstreamEdges) {
      assertTrue(lineage.getDownstreamEdges().contains(expectedDownstreamEdge));
    }
  }
}
