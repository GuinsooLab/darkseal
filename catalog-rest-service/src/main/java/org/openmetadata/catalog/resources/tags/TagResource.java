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

package org.openmetadata.catalog.resources.tags;

import static org.openmetadata.catalog.security.SecurityUtil.ADMIN;
import static org.openmetadata.catalog.security.SecurityUtil.BOT;
import static org.openmetadata.common.utils.CommonUtil.listOrEmpty;

import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import java.io.IOException;
import java.net.URI;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import javax.validation.Valid;
import javax.ws.rs.Consumes;
import javax.ws.rs.DELETE;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.PUT;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.SecurityContext;
import javax.ws.rs.core.UriInfo;
import lombok.extern.slf4j.Slf4j;
import org.apache.maven.shared.utils.io.IOUtil;
import org.openmetadata.catalog.CatalogApplicationConfig;
import org.openmetadata.catalog.Entity;
import org.openmetadata.catalog.api.tags.CreateTag;
import org.openmetadata.catalog.api.tags.CreateTagCategory;
import org.openmetadata.catalog.entity.tags.Tag;
import org.openmetadata.catalog.jdbi3.CollectionDAO;
import org.openmetadata.catalog.jdbi3.ListFilter;
import org.openmetadata.catalog.jdbi3.TagCategoryRepository;
import org.openmetadata.catalog.jdbi3.TagRepository;
import org.openmetadata.catalog.resources.Collection;
import org.openmetadata.catalog.security.Authorizer;
import org.openmetadata.catalog.security.SecurityUtil;
import org.openmetadata.catalog.type.Include;
import org.openmetadata.catalog.type.TagCategory;
import org.openmetadata.catalog.util.EntityUtil;
import org.openmetadata.catalog.util.EntityUtil.Fields;
import org.openmetadata.catalog.util.FullyQualifiedName;
import org.openmetadata.catalog.util.JsonUtils;
import org.openmetadata.catalog.util.RestUtil;
import org.openmetadata.catalog.util.ResultList;

@Slf4j
@Path("/v1/tags")
@Api(value = "Tags resources collection", tags = "Tags resources collection")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@Collection(name = "tags")
public class TagResource {
  public static final String TAG_COLLECTION_PATH = "/v1/tags/";
  private final TagRepository dao;
  private final TagCategoryRepository daoCategory;
  private final Authorizer authorizer;

  static class CategoryList extends ResultList<TagCategory> {
    @SuppressWarnings("unused") // Empty constructor needed for deserialization
    CategoryList() {}

    CategoryList(List<TagCategory> data) {
      super(data);
    }
  }

  public TagResource(CollectionDAO collectionDAO, Authorizer authorizer) {
    Objects.requireNonNull(collectionDAO, "TagRepository must not be null");
    this.dao = new TagRepository(collectionDAO);
    this.daoCategory = new TagCategoryRepository(collectionDAO, dao);
    this.authorizer = authorizer;
  }

  @SuppressWarnings("unused") // Method used for reflection
  public void initialize(CatalogApplicationConfig config) throws IOException {
    // Find tag definitions and load tag categories from the json file, if necessary
    List<String> tagFiles = EntityUtil.getJsonDataResources(".*json/data/tags/.*\\.json$");
    tagFiles.forEach(
        tagFile -> {
          try {
            LOG.info("Loading tag definitions from file {}", tagFile);
            String tagJson =
                IOUtil.toString(Objects.requireNonNull(getClass().getClassLoader().getResourceAsStream(tagFile)));
            tagJson = tagJson.replace("<separator>", Entity.SEPARATOR);
            TagCategory tagCategory = JsonUtils.readValue(tagJson, TagCategory.class);
            long now = System.currentTimeMillis();
            tagCategory.withId(UUID.randomUUID()).withUpdatedBy("admin").withUpdatedAt(now);
            tagCategory
                .getChildren()
                .forEach(
                    t -> {
                      t.withId(UUID.randomUUID()).withUpdatedBy("admin").withUpdatedAt(now);
                      t.getChildren().forEach(c -> c.withUpdatedBy("admin").withUpdatedAt(now));
                    });
            daoCategory.initCategory(tagCategory);
          } catch (Exception e) {
            LOG.warn("Failed to initialize the tag files {}", tagFile, e);
          }
        });
  }

  static final String FIELDS = "usageCount";
  protected static final List<String> ALLOWED_FIELDS = Entity.getEntityFields(Tag.class);

  @GET
  @Operation(
      operationId = "listTagCategories",
      summary = "List tag categories",
      tags = "tags",
      description = "Get a list of tag categories.",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "The user ",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = CategoryList.class)))
      })
  public ResultList<TagCategory> getCategories(
      @Context UriInfo uriInfo,
      @Context SecurityContext securityContext,
      @Parameter(
              description = "Fields requested in the returned resource",
              schema = @Schema(type = "string", example = FIELDS))
          @QueryParam("fields")
          String fieldsParam)
      throws IOException {
    Fields fields = new Fields(ALLOWED_FIELDS, fieldsParam);
    ListFilter filter = new ListFilter(Include.ALL);
    ResultList<TagCategory> list = daoCategory.listAfter(uriInfo, fields, filter, 10000, null);
    list.getData().forEach(category -> addHref(uriInfo, category));
    return list;
  }

  @GET
  @Path("{category}")
  @Operation(
      operationId = "getTagCategoryByName",
      summary = "Get a tag category",
      tags = "tags",
      description =
          "Get a tag category identified by name. The response includes tag category information along "
              + "with the entire hierarchy of all the children tags.",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "The user ",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = TagCategory.class))),
        @ApiResponse(responseCode = "404", description = "TagCategory for instance {category} is not found")
      })
  public TagCategory getCategory(
      @Context UriInfo uriInfo,
      @Context SecurityContext securityContext,
      @Parameter(description = "Tag category name", schema = @Schema(type = "string")) @PathParam("category")
          String category,
      @Parameter(
              description = "Fields requested in the returned resource",
              schema = @Schema(type = "string", example = FIELDS))
          @QueryParam("fields")
          String fieldsParam)
      throws IOException {
    Fields fields = new Fields(ALLOWED_FIELDS, fieldsParam);
    return addHref(uriInfo, daoCategory.getByName(uriInfo, category, fields, Include.ALL));
  }

  @GET
  @Operation(
      operationId = "getPrimaryTag",
      summary = "Get a primary tag",
      tags = "tags",
      description =
          "Get a primary tag identified by name. The response includes with the entire hierarchy of all"
              + " the children tags.",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "The user ",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = Tag.class))),
        @ApiResponse(responseCode = "404", description = "TagCategory for instance {category} is not found"),
        @ApiResponse(responseCode = "404", description = "Tag for instance {primaryTag} is not found")
      })
  @Path("{category}/{primaryTag}")
  @ApiOperation(value = "Returns tag groups under the given category.", response = Tag.class)
  public Tag getPrimaryTag(
      @Context UriInfo uriInfo,
      @Context SecurityContext securityContext,
      @Parameter(description = "Tag category name", schema = @Schema(type = "string")) @PathParam("category")
          String category,
      @Parameter(
              description = "Primary tag name",
              schema =
                  @Schema(type = "string", example = "<primaryTag> fully qualified name <categoryName>.<primaryTag>"))
          @PathParam("primaryTag")
          String primaryTag,
      @Parameter(
              description = "Fields requested in the returned resource",
              schema = @Schema(type = "string", example = FIELDS))
          @QueryParam("fields")
          String fieldsParam)
      throws IOException {
    String fqn = FullyQualifiedName.add(category, primaryTag);
    Fields fields = new Fields(ALLOWED_FIELDS, fieldsParam);
    Tag tag = dao.getByName(uriInfo, fqn, fields, Include.ALL);
    URI categoryHref = RestUtil.getHref(uriInfo, TAG_COLLECTION_PATH, category);
    return addHref(categoryHref, tag);
  }

  @GET
  @Path("{category}/{primaryTag}/{secondaryTag}")
  @Operation(
      operationId = "getSecondaryTag",
      summary = "Get a secondary tag",
      tags = "tags",
      description = "Get a secondary tag identified by name.",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "The user ",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = Tag.class))),
        @ApiResponse(responseCode = "404", description = "TagCategory for instance {category} is not found"),
        @ApiResponse(responseCode = "404", description = "Tag for instance {primaryTag} is not found"),
        @ApiResponse(responseCode = "404", description = "Tag for instance {secondaryTag} is not found")
      })
  public Tag getSecondaryTag(
      @Context UriInfo uriInfo,
      @Context SecurityContext securityContext,
      @Parameter(description = "Tag category name", schema = @Schema(type = "string")) @PathParam("category")
          String category,
      @Parameter(
              description = "Primary tag name",
              schema =
                  @Schema(type = "string", example = "<primaryTag> fully qualified name <categoryName>.<primaryTag>"))
          @PathParam("primaryTag")
          String primaryTag,
      @Parameter(
              description = "Secondary tag name",
              schema =
                  @Schema(
                      type = "string",
                      example = "<secondaryTag> fully qualified name <categoryName>" + ".<primaryTag>.<SecondaryTag>"))
          @PathParam("secondaryTag")
          String secondaryTag,
      @Parameter(
              description = "Fields requested in the returned resource",
              schema = @Schema(type = "string", example = FIELDS))
          @QueryParam("fields")
          String fieldsParam)
      throws IOException {
    String fqn = FullyQualifiedName.build(category, primaryTag, secondaryTag);
    Fields fields = new Fields(ALLOWED_FIELDS, fieldsParam);
    Tag tag = dao.getByName(uriInfo, fqn, fields, Include.ALL);
    URI categoryHref = RestUtil.getHref(uriInfo, TAG_COLLECTION_PATH, category + "/" + primaryTag);
    return addHref(categoryHref, tag);
  }

  @POST
  @Operation(
      operationId = "createTagCategory",
      summary = "Create a tag category",
      tags = "tags",
      description =
          "Create a new tag category. The request can include the children tags to be created along "
              + "with the tag category.",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "The user ",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = TagCategory.class))),
        @ApiResponse(responseCode = "400", description = "Bad request")
      })
  public Response createCategory(
      @Context UriInfo uriInfo, @Context SecurityContext securityContext, @Valid CreateTagCategory create)
      throws IOException {
    SecurityUtil.authorizeAdmin(authorizer, securityContext, ADMIN | BOT);
    TagCategory category = getTagCategory(securityContext, create);
    category = addHref(uriInfo, daoCategory.create(uriInfo, category));
    return Response.created(category.getHref()).entity(category).build();
  }

  @POST
  @Path("{category}")
  @Operation(
      operationId = "createPrimaryTag",
      summary = "Create a primary tag",
      tags = "tags",
      description = "Create a primary tag in the given tag category.",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "The user ",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = Tag.class))),
        @ApiResponse(responseCode = "400", description = "Bad request")
      })
  public Response createPrimaryTag(
      @Context UriInfo uriInfo,
      @Context SecurityContext securityContext,
      @Parameter(description = "Tag category name", schema = @Schema(type = "string")) @PathParam("category")
          String category,
      @Valid CreateTag create)
      throws IOException {
    SecurityUtil.authorizeAdmin(authorizer, securityContext, ADMIN | BOT);
    Tag tag = getTag(securityContext, create, FullyQualifiedName.build(category));
    URI categoryHref = RestUtil.getHref(uriInfo, TAG_COLLECTION_PATH, category);
    tag = addHref(categoryHref, dao.create(uriInfo, tag));
    return Response.created(tag.getHref()).entity(tag).build();
  }

  @POST
  @Path("{category}/{primaryTag}")
  @Operation(
      operationId = "createSecondaryTag",
      summary = "Create a secondary tag",
      tags = "tags",
      description = "Create a secondary tag under the given primary tag.",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "The user ",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = Tag.class))),
        @ApiResponse(responseCode = "400", description = "Bad request")
      })
  public Response createSecondaryTag(
      @Context UriInfo uriInfo,
      @Context SecurityContext securityContext,
      @Parameter(description = "Tag category name", schema = @Schema(type = "string")) @PathParam("category")
          String category,
      @Parameter(
              description = "Primary tag name",
              schema =
                  @Schema(
                      type = "string",
                      example = "<primaryTag> fully qualified name <categoryName>" + ".<primaryTag>"))
          @PathParam("primaryTag")
          String primaryTag,
      @Valid CreateTag create)
      throws IOException {
    SecurityUtil.authorizeAdmin(authorizer, securityContext, ADMIN | BOT);
    Tag tag = getTag(securityContext, create, FullyQualifiedName.build(category, primaryTag));
    URI categoryHref = RestUtil.getHref(uriInfo, TAG_COLLECTION_PATH, category);
    URI parentHRef = RestUtil.getHref(categoryHref, primaryTag);
    tag = addHref(parentHRef, dao.create(uriInfo, tag));
    return Response.created(tag.getHref()).entity(tag).build();
  }

  @PUT
  @Path("{category}")
  @Operation(
      operationId = "createOrUpdateTagCategory",
      summary = "Update a tag category",
      tags = "tags",
      description = "Update an existing category identify by category name")
  public Response updateCategory(
      @Context UriInfo uriInfo,
      @Context SecurityContext securityContext,
      @Parameter(description = "Tag category name", schema = @Schema(type = "string")) @PathParam("category")
          String categoryName,
      @Valid CreateTagCategory create)
      throws IOException {
    SecurityUtil.authorizeAdmin(authorizer, securityContext, ADMIN | BOT);
    TagCategory category = getTagCategory(securityContext, create);
    // TODO clean this up
    if (categoryName.equals(create.getName())) { // Not changing the name
      category = addHref(uriInfo, daoCategory.createOrUpdate(uriInfo, category).getEntity());
    } else {
      TagCategory origCategory = getTagCategory(securityContext, create).withName(categoryName);
      category = addHref(uriInfo, daoCategory.createOrUpdate(uriInfo, origCategory, category).getEntity());
    }
    return Response.ok(category).build();
  }

  @PUT
  @Path("{category}/{primaryTag}")
  @Operation(
      operationId = "createOrUpdatePrimaryTag",
      summary = "Update a primaryTag",
      tags = "tags",
      description = "Update an existing primaryTag identify by name")
  public Response updatePrimaryTag(
      @Context UriInfo uriInfo,
      @Context SecurityContext securityContext,
      @Parameter(description = "Tag category name", schema = @Schema(type = "string")) @PathParam("category")
          String categoryName,
      @Parameter(
              description = "Primary tag name",
              schema =
                  @Schema(
                      type = "string",
                      example = "<primaryTag> fully qualified name <categoryName>" + ".<primaryTag>"))
          @PathParam("primaryTag")
          String primaryTag,
      @Valid CreateTag create)
      throws IOException {
    SecurityUtil.authorizeAdmin(authorizer, securityContext, ADMIN | BOT);
    Tag tag = getTag(securityContext, create, FullyQualifiedName.build(categoryName));
    URI categoryHref = RestUtil.getHref(uriInfo, TAG_COLLECTION_PATH, categoryName);
    RestUtil.PutResponse response;
    if (primaryTag.equals(create.getName())) { // Not changing the name
      response = dao.createOrUpdate(uriInfo, tag);
    } else {
      Tag origTag = getTag(securityContext, create, FullyQualifiedName.build(categoryName)).withName(primaryTag);
      response = dao.createOrUpdate(uriInfo, origTag, tag);
    }
    tag = addHref(categoryHref, (Tag) response.getEntity());
    return response.toResponse();
  }

  @PUT
  @Path("{category}/{primaryTag}/{secondaryTag}")
  @Operation(
      operationId = "createOrUpdateSecondaryTag",
      summary = "Update a secondaryTag",
      tags = "tags",
      description = "Update an existing secondaryTag identify by name")
  public Response updateSecondaryTag(
      @Context UriInfo uriInfo,
      @Context SecurityContext securityContext,
      @Parameter(description = "Tag category name", schema = @Schema(type = "string")) @PathParam("category")
          String categoryName,
      @Parameter(
              description = "Primary tag name",
              schema =
                  @Schema(
                      type = "string",
                      example = "<primaryTag> fully qualified name <categoryName>" + ".<primaryTag>"))
          @PathParam("primaryTag")
          String primaryTag,
      @Parameter(
              description = "SecondaryTag tag name",
              schema =
                  @Schema(
                      type = "string",
                      example = "<secondaryTag> fully qualified name <categoryName>" + ".<primaryTag>.<secondaryTag>"))
          @PathParam("secondaryTag")
          String secondaryTag,
      @Valid CreateTag create)
      throws IOException {
    SecurityUtil.authorizeAdmin(authorizer, securityContext, ADMIN | BOT);
    Tag tag = getTag(securityContext, create, FullyQualifiedName.build(categoryName, primaryTag));
    URI categoryHref = RestUtil.getHref(uriInfo, TAG_COLLECTION_PATH, categoryName);
    URI parentHRef = RestUtil.getHref(categoryHref, primaryTag);
    RestUtil.PutResponse response;
    // TODO clean this up
    if (secondaryTag.equals(create.getName())) { // Not changing the name
      response = dao.createOrUpdate(uriInfo, tag);
    } else {
      Tag origTag =
          getTag(securityContext, create, FullyQualifiedName.build(categoryName, primaryTag)).withName(secondaryTag);
      response = dao.createOrUpdate(uriInfo, origTag, tag);
    }
    addHref(parentHRef, (Tag) response.getEntity());
    return response.toResponse();
  }

  @DELETE
  @Path("/{id}")
  @Operation(
      operationId = "deleteTagCategory",
      summary = "Delete tag category",
      tags = "tags",
      description = "Delete a tag category and all the tags under it.")
  public Response deleteCategory(
      @Context UriInfo uriInfo,
      @Context SecurityContext securityContext,
      @Parameter(description = "Tag category id", schema = @Schema(type = "string")) @PathParam("id") String id)
      throws IOException {
    SecurityUtil.authorizeAdmin(authorizer, securityContext, ADMIN | BOT);
    TagCategory tagCategory = daoCategory.delete(uriInfo, id);
    addHref(uriInfo, tagCategory);
    return new RestUtil.DeleteResponse<>(tagCategory, RestUtil.ENTITY_DELETED).toResponse();
  }

  @DELETE
  @Path("/{category}/{id}")
  @Operation(
      operationId = "deleteTags",
      summary = "Delete tag",
      tags = "tags",
      description = "Delete a tag and all the tags under it.")
  public Response deleteTags(
      @Context UriInfo uriInfo,
      @Context SecurityContext securityContext,
      @Parameter(description = "Tag id", schema = @Schema(type = "string")) @PathParam("category") String category,
      @Parameter(description = "Tag id", schema = @Schema(type = "string")) @PathParam("id") String id)
      throws IOException {
    SecurityUtil.authorizeAdmin(authorizer, securityContext, ADMIN | BOT);
    Tag tag = dao.delete(uriInfo, id);
    URI categoryHref = RestUtil.getHref(uriInfo, TAG_COLLECTION_PATH, category);
    addHref(categoryHref, tag);
    return new RestUtil.DeleteResponse<>(tag, RestUtil.ENTITY_DELETED).toResponse();
  }

  private TagCategory addHref(UriInfo uriInfo, TagCategory category) {
    category.setHref(RestUtil.getHref(uriInfo, TAG_COLLECTION_PATH, category.getName()));
    addHref(category.getHref(), category.getChildren());
    return category;
  }

  private void addHref(URI parentHref, List<Tag> tags) {
    for (Tag tag : listOrEmpty(tags)) {
      addHref(parentHref, tag);
    }
  }

  private Tag addHref(URI parentHref, Tag tag) {
    tag.setHref(RestUtil.getHref(parentHref, tag.getName()));
    addHref(tag.getHref(), tag.getChildren());
    return tag;
  }

  private TagCategory getTagCategory(SecurityContext securityContext, CreateTagCategory create) {
    return new TagCategory()
        .withId(UUID.randomUUID())
        .withName(create.getName())
        .withFullyQualifiedName(create.getName())
        .withCategoryType(create.getCategoryType())
        .withDescription(create.getDescription())
        .withUpdatedBy(securityContext.getUserPrincipal().getName())
        .withUpdatedAt(System.currentTimeMillis());
  }

  private Tag getTag(SecurityContext securityContext, CreateTag create, String parentFQN) {
    return new Tag()
        .withId(UUID.randomUUID())
        .withName(create.getName())
        .withFullyQualifiedName(FullyQualifiedName.add(parentFQN, create.getName()))
        .withDescription(create.getDescription())
        .withUpdatedBy(securityContext.getUserPrincipal().getName())
        .withUpdatedAt(System.currentTimeMillis());
  }
}
