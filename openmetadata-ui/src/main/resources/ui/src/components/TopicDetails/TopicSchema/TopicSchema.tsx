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

import { Button, Popover, Space, Typography } from 'antd';
import Table, { ColumnsType } from 'antd/lib/table';
import { cloneDeep, isEmpty, isUndefined } from 'lodash';
import { EntityTags, TagOption } from 'Models';
import React, { FC, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Field } from '../../../generated/entity/data/topic';
import { getEntityName } from '../../../utils/CommonUtils';
import SVGIcons from '../../../utils/SvgUtils';
import { getTableExpandableConfig } from '../../../utils/TableUtils';
import { fetchTagsAndGlossaryTerms } from '../../../utils/TagsUtils';
import {
  updateFieldDescription,
  updateFieldTags,
} from '../../../utils/TopicSchema.utils';
import RichTextEditorPreviewer from '../../common/rich-text-editor/RichTextEditorPreviewer';
import { ModalWithMarkdownEditor } from '../../Modals/ModalWithMarkdownEditor/ModalWithMarkdownEditor';
import TagsContainer from '../../Tag/TagsContainer/tags-container';
import TagsViewer from '../../Tag/TagsViewer/tags-viewer';
import { CellRendered, TopicSchemaFieldsProps } from './TopicSchema.interface';

const TopicSchemaFields: FC<TopicSchemaFieldsProps> = ({
  messageSchema,
  className,
  hasDescriptionEditAccess,
  isReadOnly,
  onUpdate,
  hasTagEditAccess,
}) => {
  const { t } = useTranslation();

  const [editFieldDescription, setEditFieldDescription] = useState<Field>();
  const [editFieldTags, setEditFieldTags] = useState<Field>();

  const [tagList, setTagList] = useState<TagOption[]>([]);
  const [isTagLoading, setIsTagLoading] = useState<boolean>(false);
  const [tagFetchFailed, setTagFetchFailed] = useState<boolean>(false);

  const fetchTags = async () => {
    setIsTagLoading(true);
    try {
      const tagsAndTerms = await fetchTagsAndGlossaryTerms();
      setTagList(tagsAndTerms);
    } catch (error) {
      setTagList([]);
      setTagFetchFailed(true);
    } finally {
      setIsTagLoading(false);
    }
  };

  const handleFieldTagsChange = async (selectedTags: EntityTags[] = []) => {
    if (!isUndefined(editFieldTags)) {
      const newSelectedTags: TagOption[] = selectedTags.map((tag) => ({
        fqn: tag.tagFQN,
        source: tag.source,
      }));

      const schema = cloneDeep(messageSchema);

      updateFieldTags(
        schema?.schemaFields,
        editFieldTags?.name,
        newSelectedTags
      );

      await onUpdate(schema);
      setEditFieldTags(undefined);
    } else {
      setEditFieldTags(undefined);
    }
  };

  const handleAddTagClick = (record: Field) => {
    if (isUndefined(editFieldTags)) {
      setEditFieldTags(record);
      // Fetch tags and terms only once
      if (tagList.length === 0 || tagFetchFailed) {
        fetchTags();
      }
    }
  };

  const handleFieldDescriptionChange = async (updatedDescription: string) => {
    if (!isUndefined(editFieldDescription)) {
      const schema = cloneDeep(messageSchema);
      updateFieldDescription(
        schema?.schemaFields,
        editFieldDescription.name,
        updatedDescription
      );
      await onUpdate(schema);
      setEditFieldDescription(undefined);
    } else {
      setEditFieldDescription(undefined);
    }
  };

  const renderFieldDescription: CellRendered<Field, 'description'> = (
    description,
    record,
    index
  ) => {
    return (
      <Space
        className="custom-group w-full"
        data-testid="description"
        id={`field-description-${index}`}
        size={4}>
        <>
          {description ? (
            <RichTextEditorPreviewer markdown={description} />
          ) : (
            <Typography.Text className="tw-no-description">
              {t('label.no-entity', {
                entity: t('label.description'),
              })}
            </Typography.Text>
          )}
        </>
        {isReadOnly && !hasDescriptionEditAccess ? null : (
          <Button
            className="p-0 opacity-0 group-hover-opacity-100"
            data-testid="edit-button"
            icon={
              <SVGIcons
                alt={t('label.edit')}
                icon="icon-edit"
                title={t('label.edit')}
                width="16px"
              />
            }
            type="text"
            onClick={() => setEditFieldDescription(record)}
          />
        )}
      </Space>
    );
  };

  const renderFieldTags: CellRendered<Field, 'tags'> = (
    tags,
    record: Field
  ) => {
    const isSelectedField = editFieldTags?.name === record.name;
    const styleFlag = isSelectedField || !isEmpty(tags);

    return (
      <>
        {isReadOnly ? (
          <Space wrap>
            <TagsViewer sizeCap={-1} tags={tags || []} />
          </Space>
        ) : (
          <Space
            align={styleFlag ? 'start' : 'center'}
            className="justify-between"
            data-testid="tags-wrapper"
            direction={styleFlag ? 'vertical' : 'horizontal'}
            onClick={() => handleAddTagClick(record)}>
            <TagsContainer
              editable={isSelectedField}
              isLoading={isTagLoading && isSelectedField}
              selectedTags={tags || []}
              showAddTagButton={hasTagEditAccess}
              size="small"
              tagList={tagList}
              type="label"
              onCancel={() => setEditFieldTags(undefined)}
              onSelectionChange={handleFieldTagsChange}
            />
          </Space>
        )}
      </>
    );
  };

  const columns: ColumnsType<Field> = useMemo(
    () => [
      {
        title: t('label.name'),
        dataIndex: 'name',
        key: 'name',
        ellipsis: true,
        width: 220,
        render: (_, record: Field) => (
          <Popover
            destroyTooltipOnHide
            content={getEntityName(record)}
            trigger="hover">
            <Typography.Text>{getEntityName(record)}</Typography.Text>
          </Popover>
        ),
      },
      {
        title: t('label.type'),
        dataIndex: 'dataType',
        key: 'dataType',
        ellipsis: true,
        width: 220,
        render: (dataType: Field['dataType']) => (
          <Typography.Text>{dataType}</Typography.Text>
        ),
      },
      {
        title: t('label.description'),
        dataIndex: 'description',
        key: 'description',
        render: renderFieldDescription,
      },
      {
        title: t('label.tag-plural'),
        dataIndex: 'tags',
        key: 'tags',
        width: 350,
        render: renderFieldTags,
      },
    ],
    [
      messageSchema,
      hasDescriptionEditAccess,
      hasTagEditAccess,
      editFieldDescription,
      editFieldTags,
      isReadOnly,
      isTagLoading,
    ]
  );

  return (
    <>
      <Table
        bordered
        className={className}
        columns={columns}
        data-testid="topic-schema-fields-table"
        dataSource={messageSchema?.schemaFields}
        expandable={{
          ...getTableExpandableConfig<Field>(),
          rowExpandable: (record) => !isEmpty(record.children),
        }}
        pagination={false}
        rowKey="name"
        size="small"
      />
      {editFieldDescription && (
        <ModalWithMarkdownEditor
          header={`${t('label.edit-entity', {
            entity: t('label.schema-field'),
          })}: "${editFieldDescription.name}"`}
          placeholder={t('label.enter-field-description', {
            field: t('label.schema-field'),
          })}
          value={editFieldDescription.description ?? ''}
          visible={Boolean(editFieldDescription)}
          onCancel={() => setEditFieldDescription(undefined)}
          onSave={handleFieldDescriptionChange}
        />
      )}
    </>
  );
};

export default TopicSchemaFields;
