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

import { Popover } from 'antd';
import { t } from 'i18next';
import React, { FunctionComponent, useEffect, useState } from 'react';
import { Link, useHistory } from 'react-router-dom';
import { getTableDetailsPath } from '../../constants/constants';
import { JoinedWith } from '../../generated/entity/data/table';
import { getCountBadge } from '../../utils/CommonUtils';

type Props = {
  header: string;
  tableList: Array<JoinedWith & { name: string }>;
};

const viewCap = 3;

const getUniqueTablesWithCount = (tableFQNs: Props['tableList']) => {
  return tableFQNs
    .reduce((resList, curr) => {
      let duplicates = false;
      for (const table of resList) {
        if (table.fullyQualifiedName === curr.fullyQualifiedName) {
          if (table?.joinCount) {
            table.joinCount += curr?.joinCount as number;
          }
          duplicates = true;

          break;
        }
      }

      return duplicates ? resList : [...resList, curr];
    }, [] as Props['tableList'])
    .sort((a, b) =>
      (a?.joinCount as number) < (b?.joinCount as number) ? 1 : -1
    );
};

const FrequentlyJoinedTables: FunctionComponent<Props> = ({
  header,
  tableList,
}: Props) => {
  const history = useHistory();
  const [joinedTables, setJoinedTables] = useState<Props['tableList']>([]);

  const handleTableClick = (fqn: string) => {
    history.push(getTableDetailsPath(fqn));
  };

  useEffect(() => {
    setJoinedTables(getUniqueTablesWithCount(tableList));
  }, [tableList]);

  const additionalOptions = () => {
    return (
      <div className="tw-text-left">
        {joinedTables?.slice(viewCap).map((table, index) => (
          <div
            className="tw-py-1 tw-cursor-pointer"
            data-testid="related-tables-data"
            key={index}>
            <span
              className="link-text"
              data-testid="more-related-tables-data"
              onClick={() =>
                handleTableClick(table.fullyQualifiedName as string)
              }>
              {table.name}
            </span>
            {getCountBadge(table.joinCount, '', false)}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div
      className="tw-flex tw-flex-col tw-relative"
      data-testid="related-tables-container">
      <div className="tw-flex tw-items-center tw-border-b tw-border-main tw-py-1 tw-px-3">
        <span
          className="tw-flex-1 tw-leading-8 tw-m-0 tw-text-sm tw-font-medium"
          data-testid="related-tables-header">
          {header}
        </span>
      </div>
      <div className="tw-flex tw-flex-col tw-px-3 tw-py-2">
        {(joinedTables.length <= viewCap
          ? joinedTables
          : joinedTables.slice(0, viewCap)
        ).map((table, index) => {
          return (
            <div
              className="tw-py-1"
              data-testid="related-tables-data"
              key={index}>
              <Link
                className="link-text"
                to={getTableDetailsPath(table.fullyQualifiedName as string)}>
                {table.name}
              </Link>
              {getCountBadge(table.joinCount, '', false)}
            </div>
          );
        })}

        {joinedTables.length > viewCap && (
          <div data-testid="related-tables-data">
            <Popover
              content={additionalOptions()}
              placement="bottom"
              trigger="click">
              <span className="show-more">
                {`+ ${joinedTables.length - viewCap} more`}
              </span>
            </Popover>
          </div>
        )}

        {joinedTables.length <= 0 ? (
          <div className="tw-py-1 tw-text-grey-muted">
            {t('message.no-info-about-joined-tables')}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default FrequentlyJoinedTables;
