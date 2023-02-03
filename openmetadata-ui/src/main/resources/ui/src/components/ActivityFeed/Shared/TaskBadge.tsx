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

import { Popover } from 'antd';
import { isEqual } from 'lodash';
import React from 'react';
import { ThreadTaskStatus } from '../../../generated/entity/feed/thread';
import SVGIcons, { Icons } from '../../../utils/SvgUtils';

const TaskBadge = ({ status }: { status: ThreadTaskStatus }) => {
  const isTaskOpen = isEqual(status, ThreadTaskStatus.Open);

  const popoverContent = isTaskOpen ? 'Status: open' : 'Status: closed';

  return (
    <Popover
      align={{ targetOffset: [0, -15] }}
      content={popoverContent}
      overlayClassName="ant-popover-task-status"
      trigger="hover"
      zIndex={9999}>
      <span
        className="tw-rounded tw-px-2  tw-absolute tw-left-4 tw--top-3 tw-flex"
        style={{
          background: '#F1EDFD',
          border: '1px solid #C6B5F6',
          boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.06)',
          borderRadius: '2px',
          color: '#1e61f0',
          fontSize: '12px',
        }}>
        <SVGIcons
          alt="task-status"
          icon={isTaskOpen ? Icons.TASK_OPEN : Icons.TASK_CLOSED}
          width="12px"
        />
        <span className="tw-pl-1">Task</span>
      </span>
    </Popover>
  );
};

export default TaskBadge;
