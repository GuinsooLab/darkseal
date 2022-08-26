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

import { orderBy } from 'lodash';
import { getTableDetails } from '../axiosAPIs/tableAPI';
import { SearchIndex } from '../enums/search.enum';
import { getRelativeTime } from './TimeUtils';

// if more value is added, also update its interface file at -> interface/types.d.ts
export const formatDataResponse = (hits) => {
  const formattedData = hits.map((hit) => {
    const newData = {};
    newData.index = hit._index;
    newData.id = hit._source.id;
    newData.name = hit._source.name;
    newData.displayName = hit._source.displayName;
    newData.description = hit._source.description;
    newData.fullyQualifiedName = hit._source.fullyQualifiedName;
    newData.tableType = hit._source.tableType;
    newData.tags = hit._source.tags;
    newData.dailyStats = hit._source.usageSummary?.dailyStats?.count;
    newData.dailyPercentileRank =
      hit._source.usageSummary?.dailyStats?.percentileRank;
    newData.weeklyStats = hit._source.usageSummary?.weeklyStats?.count;
    newData.weeklyPercentileRank =
      hit._source.usageSummary?.weeklyStats?.percentileRank;
    newData.service = hit._source.service;
    newData.serviceType = hit._source.serviceType;
    newData.tier = hit._source.tier;
    newData.owner = hit._source.owner;
    newData.highlight = hit.highlight;

    newData.database = hit._source.database?.name;
    newData.databaseSchema = hit._source.databaseSchema?.name;

    newData.entityType = hit._source.entityType;
    newData.changeDescriptions = hit._source.changeDescriptions;
    newData.deleted = hit._source.deleted;

    return newData;
  });

  return formattedData;
};

export const formatUsersResponse = (hits) => {
  return hits.map((d) => {
    return {
      name: d._source.name,
      displayName: d._source.displayName,
      email: d._source.email,
      type: d._source.entityType,
      id: d._source.id,
      teams: d._source.teams,
    };
  });
};

export const formatTeamsResponse = (hits) => {
  return hits.map((d) => {
    return {
      name: d._source.name,
      displayName: d._source.displayName,
      type: d._source.entityType,
      id: d._source.id,
      isJoinable: d._source.isJoinable,
    };
  });
};

export const formatTeamsAndUsersResponse = (hits) => {
  const data = hits.reduce(
    (prev, curr) => {
      return curr._index === SearchIndex.TEAM
        ? { ...prev, teams: [...prev.teams, curr] }
        : { ...prev, users: [...prev.users, curr] };
    },
    { users: [], teams: [] }
  );

  const users = formatUsersResponse(data.users);
  const teams = formatTeamsResponse(data.teams);

  return { users, teams };
};

export const formatSearchGlossaryTermResponse = (hits) => {
  const term = hits.map((d) => {
    return {
      name: d._source.name,
      displayName: d._source.displayName,
      fqdn: d._source.fullyQualifiedName,
      type: d._source.entityType || 'glossaryTerm',
      id: d._id,
    };
  });

  return term;
};

const formatPost = (post) => {
  return {
    title: post.from,
    timestamp: post.postTs,
    relativeTime: getRelativeTime(post.postTs),
    message: post.message,
  };
};

export const formatFeedDataResponse = (feedData) => {
  const formattedFeed = orderBy(feedData, ['threadTs'], ['desc']).map(
    (feed) => {
      const { id: toEntity, type: entity } = feed.toEntity;
      const { title, timestamp, relativeTime, message } = formatPost(
        feed.posts[0]
      );
      const newFeed = {
        title,
        timestamp,
        relativeTime,
        toEntity,
        entity,
        message,
      };
      newFeed.subThreads = feed.posts.slice(1).map((post) => {
        return formatPost(post);
      });
      newFeed.threadId = feed.id;

      return newFeed;
    }
  );

  return formattedFeed;
};

export const getDateFromTimestamp = (ts) => {
  const newDate = new Date(ts);
  let day = newDate.getDate();
  let month = newDate.getMonth() + 1;
  const year = newDate.getFullYear();
  switch (day) {
    case 1:
    case 21:
    case 31: {
      day = `${day}st`;

      break;
    }
    case 2:
    case 22: {
      day = `${day}nd`;

      break;
    }
    case 3:
    case 23: {
      day = `${day}rd`;

      break;
    }
    default: {
      day = `${day}th`;
    }
  }

  switch (month) {
    case 1: {
      month = 'Jan';

      break;
    }
    case 2: {
      month = 'Feb';

      break;
    }
    case 3: {
      month = 'Mar';

      break;
    }
    case 4: {
      month = 'Apr';

      break;
    }
    case 5: {
      month = 'May';

      break;
    }
    case 6: {
      month = 'Jun';

      break;
    }
    case 7: {
      month = 'Jul';

      break;
    }
    case 8: {
      month = 'Aug';

      break;
    }
    case 9: {
      month = 'Sep';

      break;
    }
    case 10: {
      month = 'Oct';

      break;
    }
    case 11: {
      month = 'Nov';

      break;
    }
    case 12: {
      month = 'Dec';

      break;
    }
    default: {
      break;
    }
  }

  let hours = newDate.getHours();
  const amPm = hours >= 12 ? 'PM' : 'AM';
  hours = hours > 12 ? hours - 12 : hours;
  let minutes = newDate.getMinutes();

  hours = hours.toString().length === 1 ? `0${hours}` : hours.toString();
  minutes =
    minutes.toString().length === 1 ? `0${minutes}` : minutes.toString();

  return `${day} ${month} ${year} ${hours}:${minutes} ${amPm}`;
};

export const getEntityByTypeAndId = (id, entityType) => {
  switch (entityType) {
    case 'Table': {
      return getTableDetails(id);
    }
    default: {
      return getTableDetails(id);
    }
  }
};

export const getURLWithQueryFields = (url, lstQueryFields, qParams = '') => {
  let strQuery = lstQueryFields
    ? typeof lstQueryFields === 'string'
      ? lstQueryFields
      : lstQueryFields.length
      ? lstQueryFields.join()
      : ''
    : '';
  strQuery = strQuery.replace(/ /g, '');

  let queryParam = strQuery ? `?fields=${strQuery}` : '';

  if (qParams) {
    queryParam += queryParam ? `&${qParams}` : `?${qParams}`;
  }

  return url + queryParam;
};
