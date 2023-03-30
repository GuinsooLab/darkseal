---
title: thread
slug: /main-concepts/metadata-standard/schemas/entity/feed/thread
---

# Thread

*This schema defines the Thread entity. A Thread is a collection of posts made by the users. The first post that starts a thread is **about** a data asset **from** a user. Other users can respond to this post by creating new posts in the thread. Note that bot users can also interact with a thread. A post can contains links that mention Users or other Data Assets.*

## Properties

- **`id`**: Unique identifier that identifies an entity instance. Refer to *../../type/basic.json#/definitions/uuid*.
- **`type`**: Refer to *#/definitions/threadType*.
- **`href`**: Link to the resource corresponding to this entity. Refer to *../../type/basic.json#/definitions/href*.
- **`threadTs`**: Timestamp of the when the first post created the thread in Unix epoch time milliseconds. Refer to *../../type/basic.json#/definitions/timestamp*.
- **`about`**: Data asset about which this thread is created for with format <#E::{entities}::{entityName}::{field}::{fieldValue}. Refer to *../../type/basic.json#/definitions/entityLink*.
- **`entityId`**: Entity Id of the entity that the thread belongs to. Refer to *../../type/basic.json#/definitions/uuid*.
- **`addressedTo`**: User or team this thread is addressed to in format <#E::{entities}::{entityName}::{field}::{fieldValue}. Refer to *../../type/basic.json#/definitions/entityLink*.
- **`createdBy`** *(string)*: User who created the thread.
- **`updatedAt`**: Last update time corresponding to the new version of the entity in Unix epoch time milliseconds. Refer to *../../type/basic.json#/definitions/timestamp*.
- **`updatedBy`** *(string)*: User who made the update.
- **`resolved`** *(boolean)*: When `true` indicates the thread has been resolved. Default: `False`.
- **`message`** *(string)*: The main message of the thread in markdown format.
- **`postsCount`** *(integer)*: The total count of posts in the thread. Default: `0`.
- **`posts`** *(array)*
  - **Items**: Refer to *#/definitions/post*.
- **`reactions`**: Reactions for the thread. Refer to *../../type/reaction.json#/definitions/reactionList*.
- **`task`**: Details about the task. This is only applicable if thread is of type task. Refer to *#/definitions/taskDetails*.
## Definitions

- **`taskType`** *(string)*: Type of a task. Must be one of: `['RequestDescription', 'UpdateDescription', 'RequestTag', 'UpdateTag', 'Generic']`.
- **`taskDetails`** *(object)*: Details about the task. This is only applicable if thread is of type task. Cannot contain additional properties.
  - **`id`** *(integer)*: Unique identifier that identifies the task.
  - **`type`**: Refer to *#/definitions/taskType*.
  - **`assignees`**: List of users or teams the task is assigned to. Refer to *../../type/entityReference.json#/definitions/entityReferenceList*.
  - **`status`**: Refer to *#/definitions/threadTaskStatus*.
  - **`closedBy`** *(string)*: The user that closed the task.
  - **`closedAt`**: Timestamp when the task was closed in Unix epoch time milliseconds. Refer to *../../type/basic.json#/definitions/timestamp*.
  - **`oldValue`** *(string)*: The value of old object for which the task is created.
  - **`suggestion`** *(string)*: The suggestion object to replace the old value for which the task is created.
  - **`newValue`** *(string)*: The new value object that was accepted to complete the task.
- **`threadTaskStatus`** *(string)*: Status of a task. Must be one of: `['Open', 'Closed']`. Default: `Open`.
- **`threadType`** *(string)*: Type of thread. Must be one of: `['Conversation', 'Task', 'Announcement']`. Default: `Conversation`.
- **`post`** *(object)*: Post within a feed. Cannot contain additional properties.
  - **`id`**: Unique identifier that identifies the post. Refer to *../../type/basic.json#/definitions/uuid*.
  - **`message`** *(string)*: Message in markdown format. See markdown support for more details.
  - **`postTs`**: Timestamp of the post in Unix epoch time milliseconds. Refer to *../../type/basic.json#/definitions/timestamp*.
  - **`from`** *(string)*: Name of the User posting the message.
  - **`reactions`**: Reactions for the post. Refer to *../../type/reaction.json#/definitions/reactionList*.


Documentation file automatically generated at 2022-07-14 10:51:34.749986.
