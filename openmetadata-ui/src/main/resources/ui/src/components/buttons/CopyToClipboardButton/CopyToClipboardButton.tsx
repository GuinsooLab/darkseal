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

import { Popover, PopoverProps } from 'antd';
import React, { FunctionComponent, useState } from 'react';
import CopyToClipboard from 'react-copy-to-clipboard';
import { useTranslation } from 'react-i18next';
import SVGIcons, { Icons } from '../../../utils/SvgUtils';

import { Button } from '../Button/Button';

interface Props {
  copyText: string;
  copyTimer?: number;
  position?: PopoverProps['placement'];
  onCopy?: () => void;
}

export const CopyToClipboardButton: FunctionComponent<Props> = ({
  copyText,
  copyTimer = 1500,
  position = 'left',
  onCopy,
}: Props) => {
  const { t } = useTranslation();
  const [copied, setCopied] = useState<boolean>(false);

  const handleCopying = () => {
    setCopied(true);
    onCopy?.();
    setTimeout(() => {
      setCopied(false);
    }, copyTimer);
  };

  return (
    <CopyToClipboard text={copyText} onCopy={handleCopying}>
      <Button
        className="tw-h-8 tw-ml-4 tw-relative"
        data-testid="copy-secret"
        size="custom"
        theme="default"
        variant="text">
        <Popover
          content={
            <span
              className="tw-text-grey-body tw-text-xs tw-font-medium tw-italic"
              data-testid="copy-success">
              {t('message.copied-to-clipboard')}
            </span>
          }
          open={copied}
          placement={position}
          trigger="click">
          <SVGIcons
            alt="Copy"
            data-testid="copy-icon"
            icon={Icons.COPY}
            width="16px"
          />
        </Popover>
      </Button>
    </CopyToClipboard>
  );
};

export default CopyToClipboardButton;
