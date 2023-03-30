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

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button, Col, Dropdown, Row, Tooltip, Typography } from 'antd';
import { ItemType } from 'antd/lib/menu/hooks/useItems';
import classNames from 'classnames';
import React, { FC, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { NO_PERMISSION_FOR_ACTION } from '../../../../constants/HelperTextUtil';
import { EntityType } from '../../../../enums/entity.enum';
import { ANNOUNCEMENT_ENTITIES } from '../../../../utils/AnnouncementsUtils';
import SVGIcons, { Icons } from '../../../../utils/SvgUtils';
import DeleteWidgetModal from '../../DeleteWidget/DeleteWidgetModal';
import './ManageButton.less';

interface Props {
  allowSoftDelete?: boolean;
  afterDeleteAction?: () => void;
  buttonClassName?: string;
  entityName: string;
  entityId?: string;
  entityType?: string;
  entityFQN?: string;
  isRecursiveDelete?: boolean;
  deleteMessage?: string;
  softDeleteMessagePostFix?: string;
  hardDeleteMessagePostFix?: string;
  canDelete?: boolean;
  extraDropdownContent?: ItemType[];
  onAnnouncementClick?: () => void;
  onRestoreEntity?: () => void;
  deleted?: boolean;
}

const ManageButton: FC<Props> = ({
  allowSoftDelete,
  afterDeleteAction,
  buttonClassName,
  deleteMessage,
  softDeleteMessagePostFix,
  hardDeleteMessagePostFix,
  entityName,
  entityType,
  canDelete,
  entityId,
  isRecursiveDelete,
  extraDropdownContent,
  onAnnouncementClick,
  onRestoreEntity,
  deleted,
}) => {
  const { t } = useTranslation();
  const [showActions, setShowActions] = useState<boolean>(false);
  const [isDelete, setIsDelete] = useState<boolean>(false);

  const items = [
    {
      label: (
        <Tooltip title={canDelete ? '' : NO_PERMISSION_FOR_ACTION}>
          <Row
            className={classNames('tw-cursor-pointer manage-button', {
              'tw-cursor-not-allowed tw-opacity-50': !canDelete,
            })}
            onClick={(e) => {
              if (canDelete) {
                e.stopPropagation();
                setIsDelete(true);
                setShowActions(false);
              }
            }}>
            <Col span={3}>
              <SVGIcons alt="Delete" icon={Icons.DELETE} width="20px" />
            </Col>
            <Col span={21}>
              <Row data-testid="delete-button">
                <Col span={21}>
                  <Typography.Text
                    className="font-medium"
                    data-testid="delete-button-title">
                    {t('label.delete')}
                  </Typography.Text>
                </Col>
                <Col className="p-t-xss">
                  <Typography.Paragraph className="text-grey-muted text-xs m-b-0 line-height-16">
                    {t('message.delete-action-description', {
                      entityType,
                    })}
                  </Typography.Paragraph>
                </Col>
              </Row>
            </Col>
          </Row>
        </Tooltip>
      ),
      key: 'delete-button',
    },
    ...(deleted
      ? [
          {
            label: (
              <Tooltip title={canDelete ? '' : NO_PERMISSION_FOR_ACTION}>
                <Row
                  className={classNames('tw-cursor-pointer manage-button', {
                    'tw-cursor-not-allowed tw-opacity-50': !canDelete,
                  })}
                  onClick={(e) => {
                    if (canDelete) {
                      e.stopPropagation();
                      setShowActions(false);
                      onRestoreEntity && onRestoreEntity();
                    }
                  }}>
                  <Col span={3}>
                    {' '}
                    <SVGIcons alt="Restore" icon={Icons.RESTORE} width="20px" />
                  </Col>
                  <Col span={21}>
                    <Row data-testid="restore-button">
                      <Col span={21}>
                        <Typography.Text
                          className="font-medium"
                          data-testid="delete-button-title">
                          {t('label.restore')}
                        </Typography.Text>
                      </Col>
                      <Col className="p-t-xss">
                        <Typography.Paragraph className="text-grey-muted text-xs m-b-0 line-height-16">
                          {t('message.restore-action-description', {
                            entityType,
                          })}
                        </Typography.Paragraph>
                      </Col>
                    </Row>
                  </Col>
                </Row>
              </Tooltip>
            ),
            key: 'restore-button',
          },
        ]
      : []),

    ...(ANNOUNCEMENT_ENTITIES.includes(entityType as EntityType)
      ? [
          {
            label: (
              <Row
                className="tw-cursor-pointer manage-button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowActions(false);
                  onAnnouncementClick && onAnnouncementClick();
                }}>
                <Col span={3}>
                  <SVGIcons
                    alt="announcement"
                    icon={Icons.ANNOUNCEMENT_BLACK}
                    width="20px"
                  />
                </Col>
                <Col span={21}>
                  <Row data-testid="announcement-button">
                    <Col span={21}>
                      <Typography.Text className="font-medium">
                        {t('label.announcement-plural')}
                      </Typography.Text>
                    </Col>
                    <Col className="p-t-xss">
                      <Typography.Paragraph className="text-grey-muted text-xs m-b-0 line-height-16">
                        {t('message.announcement-action-description')}
                      </Typography.Paragraph>
                    </Col>
                  </Row>
                </Col>
              </Row>
            ),
            key: 'announcement-button',
          },
        ]
      : []),
    ...(extraDropdownContent ? extraDropdownContent : []),
  ];

  return (
    <>
      <Dropdown
        align={{ targetOffset: [-12, 0] }}
        menu={{ items }}
        open={showActions}
        overlayStyle={{ width: '350px' }}
        placement="bottomRight"
        trigger={['click']}
        onOpenChange={setShowActions}>
        <Button
          className={classNames(
            'tw-rounded tw-flex tw-justify-center tw-w-6 manage-dropdown-button',
            buttonClassName
          )}
          data-testid="manage-button"
          size="small"
          title="Manage"
          type="default"
          onClick={() => setShowActions(true)}>
          <FontAwesomeIcon
            className="tw-text-primary tw-self-center manage-dropdown-icon"
            icon="ellipsis-vertical"
          />
        </Button>
      </Dropdown>
      {isDelete && (
        <DeleteWidgetModal
          afterDeleteAction={afterDeleteAction}
          allowSoftDelete={allowSoftDelete}
          deleteMessage={deleteMessage}
          entityId={entityId || ''}
          entityName={entityName || ''}
          entityType={entityType || ''}
          hardDeleteMessagePostFix={hardDeleteMessagePostFix}
          isRecursiveDelete={isRecursiveDelete}
          softDeleteMessagePostFix={softDeleteMessagePostFix}
          visible={isDelete}
          onCancel={() => setIsDelete(false)}
        />
      )}
    </>
  );
};

export default ManageButton;
