/*
 *  Copyright 2022 Collate.
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

import { HTMLAttributes } from 'react';
import { ReactionOperation } from '../../../enums/reactions.enum';
import { AnnouncementDetails } from '../../../generated/api/feed/createThread';
import {
  Post,
  TaskDetails,
  ThreadType,
} from '../../../generated/entity/feed/thread';
import { ReactionType } from '../../../generated/type/reaction';
import { ThreadUpdatedFunc } from '../../../interface/feed.interface';

export interface ConfirmState {
  state: boolean;
  threadId: string | undefined;
  postId: string | undefined;
  isThread: boolean;
}
export interface ActivityFeedCardProp extends HTMLAttributes<HTMLDivElement> {
  feed: Post;
  feedType: ThreadType;
  entityLink?: string;
  repliedUsers?: Array<string>;
  replies?: number;
  isEntityFeed?: boolean;
  threadId?: string;
  lastReplyTimeStamp?: number;
  isFooterVisible?: boolean;
  isThread?: boolean;
  taskDetails?: TaskDetails;
  announcementDetails?: AnnouncementDetails;
  onThreadSelect?: (id: string) => void;
  onConfirmation?: (data: ConfirmState) => void;
  updateThreadHandler: ThreadUpdatedFunc;
  onReply?: () => void;
}
export interface FeedHeaderProp
  extends HTMLAttributes<HTMLDivElement>,
    Pick<ActivityFeedCardProp, 'isEntityFeed' | 'feedType' | 'taskDetails'> {
  createdBy: string;
  timeStamp?: number;
  entityType: string;
  entityFQN: string;
  entityField: string;
}
export interface FeedBodyProp
  extends HTMLAttributes<HTMLDivElement>,
    Pick<ActivityFeedCardProp, 'isThread' | 'announcementDetails'> {
  message: string;
  reactions: Post['reactions'];
  onReactionSelect: (
    reactionType: ReactionType,
    reactionOperation: ReactionOperation
  ) => void;
  isEditPost: boolean;
  onPostUpdate: (message: string) => void;
  onCancelPostUpdate: () => void;
}
export interface FeedFooterProp
  extends HTMLAttributes<HTMLDivElement>,
    Pick<
      ActivityFeedCardProp,
      | 'replies'
      | 'repliedUsers'
      | 'threadId'
      | 'onThreadSelect'
      | 'lastReplyTimeStamp'
      | 'isFooterVisible'
    > {}
