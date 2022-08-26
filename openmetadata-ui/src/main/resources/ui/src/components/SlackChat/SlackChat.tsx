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

import { SlackChatConfig } from 'Models';
import React, { FC, useMemo } from 'react';
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
import { ReactSlackChat } from 'react-slack-chat/dist/react-slack-chat-with-default-hooks';
import AppState from '../../AppState';
import ChannelIcon from '../../assets/img/slackChat/icon-support.svg';
import UserIcon from '../../assets/img/slackChat/icon-user.svg';
import './SlackChat.css';

type Props = {
  slackConfig: SlackChatConfig;
};

const SlackChat: FC<Props> = ({ slackConfig }) => {
  const currentUser = useMemo(
    () => AppState.getCurrentUserDetails(),
    [AppState.userDetails, AppState.nonSecureUserDetails]
  );
  const channels = slackConfig.channels.map((ch) => {
    return { name: ch, icon: ChannelIcon };
  });
  const customHooks = [
    {
      id: 'getUrl',
      action: () => Promise.resolve('URL: ' + window.location.href),
    },
    {
      id: 'getUser',
      action: () =>
        Promise.resolve(
          `User: ${currentUser?.name}, Email: ${currentUser?.email}, Name: ${currentUser?.displayName}, Admin: ${currentUser?.isAdmin}`
        ),
    },
  ];
  const botName = currentUser?.name || slackConfig.botName || 'support-bot';

  return (
    <div className="slack-chat">
      <ReactSlackChat
        closeChatButton
        apiToken={slackConfig.apiToken}
        botName={botName}
        channels={channels}
        defaultMessage="Welcome! Someone will help shortly."
        helpText="Need Help?"
        hooks={customHooks}
        singleUserMode={false}
        themeColor="#7147E8"
        userImage={UserIcon}
      />
    </div>
  );
};

export default SlackChat;
