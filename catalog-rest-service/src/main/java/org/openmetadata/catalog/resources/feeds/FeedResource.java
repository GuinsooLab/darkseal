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

package org.openmetadata.catalog.resources.feeds;

import static org.openmetadata.catalog.security.SecurityUtil.ADMIN;
import static org.openmetadata.catalog.security.SecurityUtil.BOT;
import static org.openmetadata.catalog.security.SecurityUtil.OWNER;

import io.swagger.annotations.Api;
import io.swagger.v3.oas.annotations.ExternalDocumentation;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.parameters.RequestBody;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import javax.json.JsonPatch;
import javax.validation.Valid;
import javax.validation.constraints.Max;
import javax.validation.constraints.Min;
import javax.ws.rs.Consumes;
import javax.ws.rs.DELETE;
import javax.ws.rs.DefaultValue;
import javax.ws.rs.GET;
import javax.ws.rs.PATCH;
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
import org.openmetadata.catalog.api.feed.CloseTask;
import org.openmetadata.catalog.api.feed.CreatePost;
import org.openmetadata.catalog.api.feed.CreateThread;
import org.openmetadata.catalog.api.feed.ResolveTask;
import org.openmetadata.catalog.api.feed.ThreadCount;
import org.openmetadata.catalog.entity.feed.Thread;
import org.openmetadata.catalog.jdbi3.CollectionDAO;
import org.openmetadata.catalog.jdbi3.FeedRepository;
import org.openmetadata.catalog.jdbi3.FeedRepository.FilterType;
import org.openmetadata.catalog.jdbi3.FeedRepository.PaginationType;
import org.openmetadata.catalog.resources.Collection;
import org.openmetadata.catalog.security.Authorizer;
import org.openmetadata.catalog.security.SecurityUtil;
import org.openmetadata.catalog.type.CreateTaskDetails;
import org.openmetadata.catalog.type.EntityReference;
import org.openmetadata.catalog.type.Post;
import org.openmetadata.catalog.type.TaskDetails;
import org.openmetadata.catalog.type.TaskStatus;
import org.openmetadata.catalog.type.ThreadType;
import org.openmetadata.catalog.util.RestUtil;
import org.openmetadata.catalog.util.RestUtil.PatchResponse;
import org.openmetadata.catalog.util.ResultList;

@Path("/v1/feed")
@Api(value = "Feeds collection", tags = "Feeds collection")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@Collection(name = "feeds")
public class FeedResource {
  public static final String COLLECTION_PATH = "/v1/feed/";

  private final FeedRepository dao;
  private final Authorizer authorizer;

  public static void addHref(UriInfo uriInfo, List<Thread> threads) {
    threads.forEach(t -> addHref(uriInfo, t));
  }

  public static Thread addHref(UriInfo uriInfo, Thread thread) {
    thread.setHref(RestUtil.getHref(uriInfo, COLLECTION_PATH, thread.getId()));
    return thread;
  }

  public FeedResource(CollectionDAO dao, Authorizer authorizer) {
    Objects.requireNonNull(dao, "FeedRepository must not be null");
    this.dao = new FeedRepository(dao);
    this.authorizer = authorizer;
  }

  static class ThreadList extends ResultList<Thread> {
    @SuppressWarnings("unused") // Used for deserialization
    ThreadList() {}

    ThreadList(List<Thread> data) {
      super(data);
    }
  }

  public static class PostList extends ResultList<Post> {
    @SuppressWarnings("unused") /* Required for tests */
    public PostList() {}

    public PostList(List<Post> data, String beforeCursor, String afterCursor, int total) {
      super(data, beforeCursor, afterCursor, total);
    }

    public PostList(List<Post> listPosts) {
      super(listPosts);
    }
  }

  @GET
  @Operation(
      operationId = "listThreads",
      summary = "List threads",
      tags = "feeds",
      description = "Get a list of threads, optionally filtered by `entityLink`.",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "List of threads",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = ThreadList.class)))
      })
  public ResultList<Thread> list(
      @Context UriInfo uriInfo,
      @Parameter(
              description = "Limit the number of posts sorted by chronological order (1 to 1000000, default = 3)",
              schema = @Schema(type = "integer"))
          @Min(0)
          @Max(1000000)
          @DefaultValue("3")
          @QueryParam("limitPosts")
          int limitPosts,
      @Parameter(description = "Limit the number of threads returned. (1 to 1000000, default = 10)")
          @DefaultValue("10")
          @Min(1)
          @Max(1000000)
          @QueryParam("limit")
          int limitParam,
      @Parameter(description = "Returns list of threads before this cursor", schema = @Schema(type = "string"))
          @QueryParam("before")
          String before,
      @Parameter(description = "Returns list of threads after this cursor", schema = @Schema(type = "string"))
          @QueryParam("after")
          String after,
      @Parameter(
              description = "Filter threads by entity link",
              schema = @Schema(type = "string", example = "<E#/{entityType}/{entityFQN}/{fieldName}>"))
          @QueryParam("entityLink")
          String entityLink,
      @Parameter(
              description =
                  "Filter threads by user id. This filter requires a 'filterType' query param. The default filter type is 'OWNER'. This filter cannot be combined with the entityLink filter.",
              schema = @Schema(type = "string"))
          @QueryParam("userId")
          String userId,
      @Parameter(
              description =
                  "Filter type definition for the user filter. It can take one of 'OWNER', 'FOLLOWS', 'MENTIONS'. This must be used with the 'user' query param",
              schema = @Schema(implementation = FilterType.class))
          @QueryParam("filterType")
          FilterType filterType,
      @Parameter(description = "Filter threads by whether they are resolved or not. By default resolved is false")
          @DefaultValue("false")
          @QueryParam("resolved")
          boolean resolved,
      @Parameter(
              description =
                  "The type of thread to filter the results. It can take one of 'Conversation', 'Task', 'Announcement'",
              schema = @Schema(implementation = ThreadType.class))
          @QueryParam("type")
          ThreadType threadType,
      @Parameter(
              description =
                  "The status of tasks to filter the results. It can take one of 'Open', 'Closed'. This filter will take effect only when type is set to Task",
              schema = @Schema(implementation = TaskStatus.class))
          @QueryParam("taskStatus")
          TaskStatus taskStatus)
      throws IOException {
    RestUtil.validateCursors(before, after);

    ResultList<Thread> threads;
    if (before != null) { // Reverse paging
      threads =
          dao.list(
              entityLink,
              limitPosts,
              userId,
              filterType,
              limitParam,
              before,
              resolved,
              PaginationType.BEFORE,
              threadType,
              taskStatus);
    } else { // Forward paging or first page
      threads =
          dao.list(
              entityLink,
              limitPosts,
              userId,
              filterType,
              limitParam,
              after,
              resolved,
              PaginationType.AFTER,
              threadType,
              taskStatus);
    }
    addHref(uriInfo, threads.getData());
    return threads;
  }

  @GET
  @Path("/{id}")
  @Operation(
      operationId = "getThreadByID",
      summary = "Get a thread",
      tags = "feeds",
      description = "Get a thread by `id`.",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "The thread",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = Thread.class))),
        @ApiResponse(responseCode = "404", description = "Thread for instance {id} is not found")
      })
  public Thread get(@Context UriInfo uriInfo, @PathParam("id") String id) throws IOException {
    return addHref(uriInfo, dao.get(id));
  }

  @GET
  @Path("/tasks/{id}")
  @Operation(
      operationId = "getTaskByID",
      summary = "Get a task thread by task id",
      tags = "feeds",
      description = "Get a task thread by `task id`.",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "The task thread",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = Thread.class))),
        @ApiResponse(responseCode = "404", description = "Task for instance {id} is not found")
      })
  public Thread getTask(@Context UriInfo uriInfo, @PathParam("id") String id) throws IOException {
    return addHref(uriInfo, dao.getTask(Integer.parseInt(id)));
  }

  @PUT
  @Path("/tasks/{id}/resolve")
  @Operation(
      operationId = "resolveTask",
      summary = "Resolve a task",
      tags = "feeds",
      description = "Resolve a task.",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "The task thread",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = Thread.class))),
        @ApiResponse(responseCode = "400", description = "Bad request")
      })
  public Response resolveTask(
      @Context UriInfo uriInfo,
      @Context SecurityContext securityContext,
      @PathParam("id") String id,
      @Valid ResolveTask resolveTask)
      throws IOException {
    Thread task = dao.getTask(Integer.parseInt(id));
    return dao.resolveTask(uriInfo, task, securityContext.getUserPrincipal().getName(), resolveTask).toResponse();
  }

  @PUT
  @Path("/tasks/{id}/close")
  @Operation(
      operationId = "closeTask",
      summary = "Close a task",
      tags = "feeds",
      description = "Close a task without making any changes to the entity.",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "The task thread.",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = Thread.class))),
        @ApiResponse(responseCode = "400", description = "Bad request")
      })
  public Response closeTask(
      @Context UriInfo uriInfo,
      @Context SecurityContext securityContext,
      @PathParam("id") String id,
      @Valid CloseTask closeTask)
      throws IOException {
    Thread task = dao.getTask(Integer.parseInt(id));
    return dao.closeTask(uriInfo, task, securityContext.getUserPrincipal().getName(), closeTask).toResponse();
  }

  @PATCH
  @Path("/{id}")
  @Operation(
      operationId = "patchThread",
      summary = "Update a thread by `id`.",
      tags = "feeds",
      description = "Update an existing thread using JsonPatch.",
      externalDocs = @ExternalDocumentation(description = "JsonPatch RFC", url = "https://tools.ietf.org/html/rfc6902"))
  @Consumes(MediaType.APPLICATION_JSON_PATCH_JSON)
  public Response updateThread(
      @Context UriInfo uriInfo,
      @Context SecurityContext securityContext,
      @PathParam("id") String id,
      @RequestBody(
              description = "JsonPatch with array of operations",
              content =
                  @Content(
                      mediaType = MediaType.APPLICATION_JSON_PATCH_JSON,
                      examples = {
                        @ExampleObject("[" + "{op:remove, path:/a}," + "{op:add, path: /b, value: val}" + "]")
                      }))
          JsonPatch patch)
      throws IOException {
    PatchResponse<Thread> response =
        dao.patchThread(uriInfo, UUID.fromString(id), securityContext.getUserPrincipal().getName(), patch);
    return response.toResponse();
  }

  @GET
  @Path("/count")
  @Operation(
      operationId = "countThreads",
      summary = "count of threads",
      tags = "feeds",
      description = "Get a count of threads, optionally filtered by `entityLink` for each of the entities.",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "Count of threads",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = ThreadCount.class)))
      })
  public ThreadCount getThreadCount(
      @Context UriInfo uriInfo,
      @Parameter(
              description = "Filter threads by entity link",
              schema = @Schema(type = "string", example = "<E#/{entityType}/{entityFQN}/{fieldName}>"))
          @QueryParam("entityLink")
          String entityLink,
      @Parameter(
              description =
                  "The type of thread to filter the results. It can take one of 'Conversation', 'Task', 'Announcement'",
              schema = @Schema(implementation = ThreadType.class))
          @QueryParam("type")
          ThreadType threadType,
      @Parameter(
              description =
                  "The status of tasks to filter the results. It can take one of 'Open', 'Closed'. This filter will take effect only when type is set to Task",
              schema = @Schema(implementation = TaskStatus.class))
          @QueryParam("taskStatus")
          TaskStatus taskStatus,
      @Parameter(description = "Filter threads by whether it is active or resolved", schema = @Schema(type = "boolean"))
          @DefaultValue("false")
          @QueryParam("isResolved")
          Boolean isResolved) {
    return dao.getThreadsCount(entityLink, threadType, taskStatus, isResolved);
  }

  @POST
  @Operation(
      operationId = "createThread",
      summary = "Create a thread",
      tags = "feeds",
      description = "Create a new thread. A thread is created about a data asset when a user posts the first post.",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "The thread",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = Thread.class))),
        @ApiResponse(responseCode = "400", description = "Bad request")
      })
  public Response createThread(
      @Context UriInfo uriInfo, @Context SecurityContext securityContext, @Valid CreateThread create)
      throws IOException {
    Thread thread = getThread(securityContext, create);
    addHref(uriInfo, dao.create(thread));
    return Response.created(thread.getHref()).entity(thread).build();
  }

  @POST
  @Path("/{id}/posts")
  @Operation(
      operationId = "addPostToThread",
      summary = "Add post to a thread",
      tags = "feeds",
      description = "Add a post to an existing thread.",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "The post",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = Thread.class))),
        @ApiResponse(responseCode = "400", description = "Bad request")
      })
  public Response addPost(
      @Context SecurityContext securityContext,
      @Context UriInfo uriInfo,
      @PathParam("id") String id,
      @Valid CreatePost createPost)
      throws IOException {
    Post post = getPost(createPost);
    Thread thread = addHref(uriInfo, dao.addPostToThread(id, post, securityContext.getUserPrincipal().getName()));
    return Response.created(thread.getHref()).entity(thread).build();
  }

  @PATCH
  @Path("/{threadId}/posts/{postId}")
  @Operation(
      operationId = "patchPostOfThread",
      summary = "Update post of a thread by `id`.",
      tags = "feeds",
      description = "Update a post of an existing thread using JsonPatch.",
      externalDocs = @ExternalDocumentation(description = "JsonPatch RFC", url = "https://tools.ietf.org/html/rfc6902"),
      responses = {
        @ApiResponse(responseCode = "400", description = "Bad request"),
        @ApiResponse(responseCode = "404", description = "post with {postId} is not found")
      })
  @Consumes(MediaType.APPLICATION_JSON_PATCH_JSON)
  public Response patchPost(
      @Context SecurityContext securityContext,
      @Context UriInfo uriInfo,
      @PathParam("threadId") String threadId,
      @PathParam("postId") String postId,
      @RequestBody(
              description = "JsonPatch with array of operations",
              content =
                  @Content(
                      mediaType = MediaType.APPLICATION_JSON_PATCH_JSON,
                      examples = {
                        @ExampleObject("[" + "{op:remove, path:/a}," + "{op:add, path: /b, value: val}" + "]")
                      }))
          JsonPatch patch)
      throws IOException {
    // validate and get thread & post
    Thread thread = dao.get(threadId);
    Post post = dao.getPostById(thread, postId);

    PatchResponse<Post> response = dao.patchPost(thread, post, securityContext.getUserPrincipal().getName(), patch);
    return response.toResponse();
  }

  @DELETE
  @Path("/{threadId}/posts/{postId}")
  @Operation(
      operationId = "deletePostFromThread",
      summary = "Delete a post from its thread",
      tags = "feeds",
      description = "Delete a post from an existing thread.",
      responses = {
        @ApiResponse(responseCode = "200", description = "OK"),
        @ApiResponse(responseCode = "404", description = "post with {postId} is not found"),
        @ApiResponse(responseCode = "400", description = "Bad request")
      })
  public Response deletePost(
      @Context SecurityContext securityContext,
      @Parameter(description = "ThreadId of the post to be deleted", schema = @Schema(type = "string"))
          @PathParam("threadId")
          String threadId,
      @Parameter(description = "PostId of the post to be deleted", schema = @Schema(type = "string"))
          @PathParam("postId")
          String postId)
      throws IOException {
    // validate and get thread & post
    Thread thread = dao.get(threadId);
    Post post = dao.getPostById(thread, postId);
    // delete post only if the admin/bot/author tries to delete it
    SecurityUtil.authorize(authorizer, securityContext, null, dao.getOwnerOfPost(post), ADMIN | BOT | OWNER);
    return dao.deletePost(thread, post, securityContext.getUserPrincipal().getName()).toResponse();
  }

  @GET
  @Path("/{id}/posts")
  @Operation(
      operationId = "getAllPostOfThread",
      summary = "Get all the posts of a thread",
      tags = "feeds",
      description = "Get all the posts of an existing thread.",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "The posts of the given thread.",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = PostList.class))),
      })
  public PostList getPosts(@Context UriInfo uriInfo, @PathParam("id") String id) throws IOException {
    return new PostList(dao.listPosts(id));
  }

  private Thread getThread(SecurityContext securityContext, CreateThread create) {
    return new Thread()
        .withId(UUID.randomUUID())
        .withThreadTs(System.currentTimeMillis())
        .withMessage(create.getMessage())
        .withCreatedBy(create.getFrom())
        .withAbout(create.getAbout())
        .withAddressedTo(create.getAddressedTo())
        .withReactions(Collections.emptyList())
        .withType(create.getType())
        .withTask(getTaskDetails(create.getTaskDetails()))
        .withUpdatedBy(securityContext.getUserPrincipal().getName())
        .withUpdatedAt(System.currentTimeMillis());
  }

  private Post getPost(CreatePost create) {
    return new Post()
        .withId(UUID.randomUUID())
        .withMessage(create.getMessage())
        .withFrom(create.getFrom())
        .withReactions(Collections.emptyList())
        .withPostTs(System.currentTimeMillis());
  }

  private TaskDetails getTaskDetails(CreateTaskDetails create) {
    if (create != null) {
      return new TaskDetails()
          .withAssignees(formatAssignees(create.getAssignees()))
          .withType(create.getType())
          .withStatus(TaskStatus.Open)
          .withOldValue(create.getOldValue())
          .withSuggestion(create.getSuggestion());
    }
    return null;
  }

  private List<EntityReference> formatAssignees(List<EntityReference> assignees) {
    List<EntityReference> result = new ArrayList<>();
    assignees.forEach(
        assignee -> {
          result.add(new EntityReference().withId(assignee.getId()).withType(assignee.getType()));
        });
    return result;
  }
}
