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

import { CloseOutlined } from '@ant-design/icons';
import { Space, Tooltip } from 'antd';
import classNames from 'classnames';
import RichTextEditorPreviewer from 'components/common/rich-text-editor/RichTextEditorPreviewer';
import { FQN_SEPARATOR_CHAR } from 'constants/char.constants';
import { ROUTES } from 'constants/constants';
import { isEmpty, isString } from 'lodash';
import React, { FunctionComponent } from 'react';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';
import { getTagDisplay } from 'utils/TagsUtils';
import { ReactComponent as PlusIcon } from '../../../assets/svg/plus-primary.svg';
import { TagProps } from './tags.interface';
import { tagStyles } from './tags.styles';

const Tags: FunctionComponent<TagProps> = ({
  className,
  editable,
  tag,
  startWith,
  type = 'contained',
  removeTag,
  isRemovable = true,
  showOnlyName = false,
}: TagProps) => {
  const history = useHistory();
  const baseStyle = tagStyles.base;
  const layoutStyles = tagStyles[type];
  const textBaseStyle = tagStyles.text.base;
  const textLayoutStyles = tagStyles.text[type] || tagStyles.text.default;
  const textEditStyles = editable ? tagStyles.text.editable : '';

  const { t } = useTranslation();
  const getTagString = (tag: string) => {
    return tag.startsWith('#') ? tag.slice(1) : tag;
  };

  const getTag = (tag: string, startWith = '', source?: string) => {
    const startIcon =
      startWith === '+ ' ? (
        <PlusIcon height={16} name="plus" width={16} />
      ) : (
        startWith
      );
    const tagName = showOnlyName
      ? tag.split(FQN_SEPARATOR_CHAR).slice(-2).join(FQN_SEPARATOR_CHAR)
      : tag;

    return (
      <div
        className={classNames(baseStyle, layoutStyles, className)}
        data-testid="tags"
        onClick={() => {
          if (source) {
            source === 'Glossary'
              ? history.push(`${ROUTES.GLOSSARY}/${tag}`)
              : history.push(`${ROUTES.TAGS}/${tag.split('.')[0]}`);
          }
        }}>
        <Space
          align="center"
          className={classNames(
            textBaseStyle,
            textLayoutStyles,
            textEditStyles,
            'd-flex items-center cursor-pointer'
          )}
          data-testid={editable && isRemovable ? `tag-${tag}` : `add-tag`}
          size={2}>
          {startIcon}
          <span className="text-xs font-medium">{getTagDisplay(tagName)}</span>
        </Space>
        {editable && isRemovable && (
          <span
            className="tw-py-0.5 tw-px-2 tw-rounded tw-cursor-pointer"
            data-testid={`remove-${tag}-tag`}
            onClick={(e: React.MouseEvent<HTMLElement, MouseEvent>) => {
              e.preventDefault();
              e.stopPropagation();
              removeTag && removeTag(e, getTagString(tag));
            }}>
            <CloseOutlined className="tw-text-primary" />
          </span>
        )}
      </div>
    );
  };

  return (
    <>
      {isString(tag) ? (
        getTag(tag, startWith)
      ) : (
        <Tooltip
          className="cursor-pointer"
          placement="bottomLeft"
          title={
            <div className="text-left p-xss">
              <div className="m-b-xs">
                <RichTextEditorPreviewer
                  enableSeeMoreVariant={false}
                  markdown={
                    !isEmpty(tag.description)
                      ? `**${tag.tagFQN}**\n${tag.description}`
                      : t('label.no-entity', {
                          entity: t('label.description'),
                        })
                  }
                  textVariant="white"
                />
              </div>
            </div>
          }
          trigger="hover">
          {getTag(tag.tagFQN, startWith, tag.source)}
        </Tooltip>
      )}
    </>
  );
};

export default Tags;
