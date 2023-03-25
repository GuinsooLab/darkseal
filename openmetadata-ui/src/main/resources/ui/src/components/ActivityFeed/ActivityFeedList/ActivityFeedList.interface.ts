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
import { FeedFilter } from '../../../enums/mydata.enum';
import { Thread, ThreadType } from '../../../generated/entity/feed/thread';
import { ThreadUpdatedFunc } from '../../../interface/feed.interface';
import { ConfirmState } from '../ActivityFeedCard/ActivityFeedCard.interface';

export type UpdatedFeedList = Array<Thread & { relativeDay: string }>;

export interface ActivityFeedListProp extends HTMLAttributes<HTMLDivElement> {
  feedList: Thread[];
  withSidePanel?: boolean;
  isEntityFeed?: boolean;
  isFeedLoading?: boolean;
  entityName?: string;
  hideFeedFilter?: boolean;
  hideThreadFilter?: boolean;
  refreshFeedCount?: number;
  appliedFeedFilter?: FeedFilter;
  stickyFilter?: boolean;
  onRefreshFeeds?: () => void;
  postFeedHandler?: (value: string, id: string) => void;
  deletePostHandler?: (
    threadId: string,
    postId: string,
    isThread: boolean
  ) => void;
  updateThreadHandler: ThreadUpdatedFunc;
  onFeedFiltersUpdate?: (feedType: FeedFilter, threadType?: ThreadType) => void;
}

export interface FeedListSeparatorProp extends HTMLAttributes<HTMLDivElement> {
  relativeDay: string;
}

export interface FeedListBodyProp
  extends HTMLAttributes<HTMLDivElement>,
    Pick<FeedListSeparatorProp, 'relativeDay'>,
    Pick<
      ActivityFeedListProp,
      | 'isEntityFeed'
      | 'withSidePanel'
      | 'deletePostHandler'
      | 'updateThreadHandler'
    > {
  updatedFeedList: UpdatedFeedList;
  selectedThreadId: string;
  onThreadIdSelect: (value: string) => void;
  onThreadIdDeselect: () => void;
  onThreadSelect: (value: string) => void;
  postFeed: (value: string) => void;
  onViewMore: () => void;
  onConfirmation?: (data: ConfirmState) => void;
}
