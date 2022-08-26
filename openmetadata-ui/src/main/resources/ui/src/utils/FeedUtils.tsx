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

import { faAngleRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { AxiosError, AxiosResponse } from 'axios';
import { Operation } from 'fast-json-patch';
import { isEqual } from 'lodash';
import {
  EntityFieldThreadCount,
  EntityFieldThreads,
  EntityThreadField,
} from 'Models';
import React from 'react';
import TurndownService from 'turndown';
import {
  deletePostById,
  getFeedById,
  updatePost,
  updateThread,
} from '../axiosAPIs/feedsAPI';
import {
  getInitialEntity,
  getSuggestions,
  getUserSuggestions,
} from '../axiosAPIs/miscAPI';
import {
  entityLinkRegEx,
  entityRegex,
  EntityRegEx,
  entityUrlMap,
  hashtagRegEx,
  linkRegEx,
  mentionRegEx,
} from '../constants/feed.constants';
import { SearchIndex } from '../enums/search.enum';
import { Post, Thread, ThreadType } from '../generated/entity/feed/thread';
import { getEntityPlaceHolder } from './CommonUtils';
import { ENTITY_LINK_SEPARATOR } from './EntityUtils';
import { getEncodedFqn } from './StringsUtils';
import { getRelativeDateByTimeStamp } from './TimeUtils';
import { showErrorToast } from './ToastUtils';

export const getEntityType = (entityLink: string) => {
  const match = EntityRegEx.exec(entityLink);

  return match?.[1];
};
export const getEntityFQN = (entityLink: string) => {
  const match = EntityRegEx.exec(entityLink);

  return match?.[2];
};
export const getEntityField = (entityLink: string) => {
  const match = EntityRegEx.exec(entityLink);

  return match?.[3];
};

export const getFeedListWithRelativeDays = (feedList: Thread[]) => {
  const updatedFeedList = feedList.map((feed) => ({
    ...feed,
    relativeDay: getRelativeDateByTimeStamp(feed.updatedAt || 0),
  }));
  const relativeDays = [...new Set(updatedFeedList.map((f) => f.relativeDay))];

  return { updatedFeedList, relativeDays };
};

export const HTMLToMarkdown = new TurndownService({
  bulletListMarker: '-',
  fence: '```',
  codeBlockStyle: 'fenced',
})
  .addRule('codeblock', {
    filter: ['pre'],
    replacement: function (content: string) {
      return '```\n' + content + '\n```';
    },
  })
  .addRule('strikethrough', {
    filter: ['del', 's'],
    replacement: function (content: string) {
      return '~~' + content + '~~';
    },
  });

export const getReplyText = (
  count: number,
  singular?: string,
  plural?: string
) => {
  if (count === 0) return 'Reply in conversation';
  if (count === 1) return `${count} ${singular ? singular : 'older reply'}`;

  return `${count} ${plural ? plural : 'older replies'}`;
};

export const getEntityFieldThreadCounts = (
  field: EntityThreadField,
  entityFieldThreadCount: EntityFieldThreadCount[]
) => {
  const entityFieldThreads: EntityFieldThreads[] = [];

  entityFieldThreadCount.map((fieldCount) => {
    const entityField = getEntityField(fieldCount.entityLink);
    if (entityField?.startsWith(field)) {
      entityFieldThreads.push({
        entityLink: fieldCount.entityLink,
        count: fieldCount.count,
        entityField,
      });
    }
  });

  return entityFieldThreads;
};

export const getThreadField = (
  value: string,
  separator = ENTITY_LINK_SEPARATOR
) => {
  return value.split(separator).slice(-2);
};

export const getThreadValue = (
  columnName: string,
  columnField: string,
  entityFieldThreads: EntityFieldThreads[]
) => {
  let threadValue;

  entityFieldThreads?.forEach((thread) => {
    const threadField = getThreadField(thread.entityField);
    if (threadField[0] === columnName && threadField[1] === columnField) {
      threadValue = thread;
    }
  });

  return threadValue;
};

export const buildMentionLink = (entityType: string, entityFqn: string) => {
  return `${document.location.protocol}//${document.location.host}/${entityType}/${entityFqn}`;
};

export async function suggestions(searchTerm: string, mentionChar: string) {
  if (mentionChar === '@') {
    let atValues = [];
    if (!searchTerm) {
      const data = await getInitialEntity(SearchIndex.USER);
      const hits = data.data.hits.hits;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      atValues = hits.map((hit: any) => {
        const entityType = hit._source.entityType;

        return {
          id: hit._id,
          value: getEntityPlaceHolder(
            `@${hit._source.name ?? hit._source.display_name}`,
            hit._source.deleted
          ),
          link: buildMentionLink(
            entityUrlMap[entityType as keyof typeof entityUrlMap],
            hit._source.name
          ),
        };
      });
    } else {
      const data = await getUserSuggestions(searchTerm);
      const hits = data.data.suggest['metadata-suggest'][0]['options'];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      atValues = hits.map((hit: any) => {
        const entityType = hit._source.entityType;

        return {
          id: hit._id,
          value: getEntityPlaceHolder(
            `@${hit._source.name ?? hit._source.display_name}`,
            hit._source.deleted
          ),
          link: buildMentionLink(
            entityUrlMap[entityType as keyof typeof entityUrlMap],
            hit._source.name
          ),
        };
      });
    }

    return atValues;
  } else {
    let hashValues = [];
    if (!searchTerm) {
      const data = await getInitialEntity(SearchIndex.TABLE);
      const hits = data.data.hits.hits;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      hashValues = hits.map((hit: any) => {
        const entityType = hit._source.entityType;

        return {
          id: hit._id,
          value: `#${entityType}/${hit._source.name}`,
          link: buildMentionLink(
            entityType,
            getEncodedFqn(hit._source.fullyQualifiedName)
          ),
        };
      });
    } else {
      const data = await getSuggestions(searchTerm);
      const hits = data.data.suggest['metadata-suggest'][0]['options'];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      hashValues = hits.map((hit: any) => {
        const entityType = hit._source.entityType;

        return {
          id: hit._id,
          value: `#${entityType}/${hit._source.name}`,
          link: buildMentionLink(
            entityType,
            getEncodedFqn(hit._source.fullyQualifiedName)
          ),
        };
      });
    }

    return hashValues;
  }
}

export async function matcher(
  searchTerm: string,
  renderList: Function,
  mentionChar: string
) {
  const matches = await suggestions(searchTerm, mentionChar);
  renderList(matches, searchTerm);
}

const getMentionList = (message: string) => {
  return message.match(mentionRegEx);
};

const getHashTagList = (message: string) => {
  return message.match(hashtagRegEx);
};

const getEntityDetail = (item: string) => {
  return item.match(linkRegEx);
};

const getEntityLinkList = (message: string) => {
  return message.match(entityLinkRegEx);
};

const getEntityLinkDetail = (item: string) => {
  return item.match(entityRegex);
};

export const getBackendFormat = (message: string) => {
  let updatedMessage = message;
  const mentionList = [...new Set(getMentionList(message) ?? [])];
  const hashtagList = [...new Set(getHashTagList(message) ?? [])];
  const mentionDetails = mentionList.map((m) => getEntityDetail(m) ?? []);
  const hashtagDetails = hashtagList.map((h) => getEntityDetail(h) ?? []);
  const urlEntries = Object.entries(entityUrlMap);

  mentionList.forEach((m, i) => {
    const updatedDetails = mentionDetails[i].slice(-2);
    const entityType = urlEntries.find((e) => e[1] === updatedDetails[0])?.[0];
    const entityLink = `<#E${ENTITY_LINK_SEPARATOR}${entityType}${ENTITY_LINK_SEPARATOR}${updatedDetails[1]}|${m}>`;
    updatedMessage = updatedMessage.replaceAll(m, entityLink);
  });
  hashtagList.forEach((h, i) => {
    const updatedDetails = hashtagDetails[i].slice(-2);
    const entityLink = `<#E${ENTITY_LINK_SEPARATOR}${updatedDetails[0]}${ENTITY_LINK_SEPARATOR}${updatedDetails[1]}|${h}>`;
    updatedMessage = updatedMessage.replaceAll(h, entityLink);
  });

  return updatedMessage;
};

export const getFrontEndFormat = (message: string) => {
  let updatedMessage = message;
  const entityLinkList = [...new Set(getEntityLinkList(message) ?? [])];
  const entityLinkDetails = entityLinkList.map(
    (m) => getEntityLinkDetail(m) ?? []
  );
  entityLinkList.forEach((m, i) => {
    const markdownLink = entityLinkDetails[i][3];
    updatedMessage = updatedMessage.replaceAll(m, markdownLink);
  });

  return updatedMessage;
};

export const deletePost = (threadId: string, postId: string) => {
  return new Promise<Post>((resolve, reject) => {
    deletePostById(threadId, postId)
      .then((res: AxiosResponse) => {
        if (res.status === 200) {
          resolve(res.data);
        } else {
          reject(res.data);
        }
      })
      .catch((error: AxiosError) => {
        reject(error);
      });
  });
};

export const getUpdatedThread = (id: string) => {
  return new Promise<Thread>((resolve, reject) => {
    getFeedById(id)
      .then((res: AxiosResponse) => {
        if (res.status === 200) {
          resolve(res.data);
        } else {
          reject(res.data);
        }
      })
      .catch((error: AxiosError) => {
        reject(error);
      });
  });
};

/**
 * if entity field is columns::name::description
 * return columns > name > description
 */
export const getEntityFieldDisplay = (entityField: string) => {
  if (entityField && entityField.length) {
    const entityFields = entityField.split(ENTITY_LINK_SEPARATOR);
    const separator = (
      <span className="tw-px-1">
        <FontAwesomeIcon
          className="tw-text-xs tw-cursor-default tw-text-gray-400 tw-align-middle"
          icon={faAngleRight}
        />
      </span>
    );

    return entityFields.map((field, i) => {
      return (
        <span className="tw-font-bold" key={`field-${i}`}>
          {field}
          {i < entityFields.length - 1 ? separator : null}
        </span>
      );
    });
  }

  return null;
};

export const updateThreadData = (
  threadId: string,
  postId: string,
  isThread: boolean,
  data: Operation[],
  callback: (value: React.SetStateAction<Thread[]>) => void
) => {
  if (isThread) {
    updateThread(threadId, data)
      .then((res: AxiosResponse) => {
        callback((prevData) => {
          return prevData.map((thread) => {
            if (isEqual(threadId, thread.id)) {
              return { ...thread, reactions: res.data.reactions };
            } else {
              return thread;
            }
          });
        });
      })
      .catch((err: AxiosError) => {
        showErrorToast(err);
      });
  } else {
    updatePost(threadId, postId, data)
      .then((res: AxiosResponse) => {
        callback((prevData) => {
          return prevData.map((thread) => {
            if (isEqual(threadId, thread.id)) {
              const updatedPosts = (thread.posts || []).map((post) => {
                if (isEqual(postId, post.id)) {
                  return { ...post, reactions: res.data.reactions };
                } else {
                  return post;
                }
              });

              return { ...thread, posts: updatedPosts };
            } else {
              return thread;
            }
          });
        });
      })
      .catch((err: AxiosError) => {
        showErrorToast(err);
      });
  }
};

export const getFeedAction = (type: ThreadType) => {
  if (type === ThreadType.Task) {
    return 'created a task';
  }

  return 'posted on';
};
