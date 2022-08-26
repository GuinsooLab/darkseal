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

import '@github/g-emoji-element';
import { Button } from 'antd';
import classNames from 'classnames';
import { uniqueId } from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import { ReactionOperation } from '../../enums/reactions.enum';
import useImage from '../../hooks/useImage';

const Reaction = ({ reaction, isReacted, onReactionSelect, onHide }) => {
  const { image } = useImage(`emojis/${reaction.reaction}.png`);

  const handleOnClick = () => {
    const operation = isReacted
      ? ReactionOperation.REMOVE
      : ReactionOperation.ADD;
    onReactionSelect(reaction.reaction, operation);
    onHide();
  };

  return (
    <Button
      aria-label={reaction.reaction}
      className={classNames('tw-mr-1 ant-btn-popover-reaction', {
        'ant-btn-popover-isReacted': isReacted,
      })}
      data-testid="reaction-button"
      key={uniqueId()}
      size="small"
      title={reaction.reaction}
      type="text"
      onClick={handleOnClick}>
      <g-emoji
        alias={reaction.alias}
        className="d-flex"
        data-testid="emoji"
        fallback-src={image}>
        {reaction.emoji}
      </g-emoji>
    </Button>
  );
};

Reaction.propTypes = {
  reaction: PropTypes.shape({
    emoji: PropTypes.string.isRequired,
    reaction: PropTypes.string.isRequired,
    alias: PropTypes.string.isRequired,
  }).isRequired,
  isReacted: PropTypes.bool.isRequired,
  onReactionSelect: PropTypes.func.isRequired,
  onHide: PropTypes.func.isRequired,
};

export default Reaction;
