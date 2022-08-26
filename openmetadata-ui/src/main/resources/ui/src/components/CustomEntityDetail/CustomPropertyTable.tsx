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

import classNames from 'classnames';
import { isEmpty, uniqueId } from 'lodash';
import React, { FC, Fragment, useState } from 'react';
import { CustomProperty, Type } from '../../generated/entity/type';
import { getEntityName, isEven } from '../../utils/CommonUtils';
import SVGIcons, { Icons } from '../../utils/SvgUtils';
import RichTextEditorPreviewer from '../common/rich-text-editor/RichTextEditorPreviewer';
import ConfirmationModal from '../Modals/ConfirmationModal/ConfirmationModal';
import { ModalWithMarkdownEditor } from '../Modals/ModalWithMarkdownEditor/ModalWithMarkdownEditor';

interface CustomPropertyTableProp {
  customProperties: CustomProperty[];
  updateEntityType: (customProperties: Type['customProperties']) => void;
}

type Operation = 'delete' | 'update' | 'no-operation';

export const CustomPropertyTable: FC<CustomPropertyTableProp> = ({
  customProperties,
  updateEntityType,
}) => {
  const [selectedProperty, setSelectedProperty] = useState<CustomProperty>(
    {} as CustomProperty
  );

  const [operation, setOperation] = useState<Operation>('no-operation');

  const resetSelectedProperty = () => {
    setSelectedProperty({} as CustomProperty);
    setOperation('no-operation' as Operation);
  };

  const handlePropertyDelete = () => {
    const updatedProperties = customProperties.filter(
      (property) => property.name !== selectedProperty.name
    );
    updateEntityType(updatedProperties);
    resetSelectedProperty();
  };

  const handlePropertyUpdate = (updatedDescription: string) => {
    const updatedProperties = customProperties.map((property) => {
      if (property.name === selectedProperty.name) {
        return { ...property, description: updatedDescription };
      } else {
        return property;
      }
    });
    updateEntityType(updatedProperties);
    resetSelectedProperty();
  };

  const deleteCheck = !isEmpty(selectedProperty) && operation === 'delete';
  const updateCheck = !isEmpty(selectedProperty) && operation === 'update';

  return (
    <Fragment>
      <div className="tw-bg-white tw-border tw-border-main tw-rounded  tw-shadow">
        <table
          className="tw-w-full"
          data-testid="entity-custom-properties-table">
          <thead data-testid="table-header">
            <tr className="tableHead-row tw-border-t-0 tw-border-l-0 tw-border-r-0">
              <th className="tableHead-cell" data-testid="property-name">
                Name
              </th>
              <th className="tableHead-cell" data-testid="property-type">
                Type
              </th>
              <th className="tableHead-cell" data-testid="property-description">
                Description
              </th>
              <th className="tableHead-cell" data-testid="property-actions">
                Actions
              </th>
            </tr>
          </thead>
          <tbody data-testid="table-body">
            {customProperties.length ? (
              customProperties.map((property, index) => (
                <tr
                  className={classNames(
                    `tableBody-row ${!isEven(index + 1) && 'odd-row'}`,
                    'tw-border-l-0 tw-border-r-0',
                    {
                      'tw-border-b-0': index === customProperties.length - 1,
                    }
                  )}
                  data-testid="data-row"
                  key={uniqueId()}>
                  <td className="tableBody-cell">{property.name}</td>
                  <td className="tableBody-cell">
                    {getEntityName(property.propertyType)}
                  </td>
                  <td className="tableBody-cell">
                    {property.description ? (
                      <RichTextEditorPreviewer
                        markdown={property.description || ''}
                      />
                    ) : (
                      <span
                        className="tw-no-description tw-p-2 tw--ml-1.5"
                        data-testid="no-description">
                        No description{' '}
                      </span>
                    )}
                  </td>
                  <td className="tableBody-cell">
                    <div className="tw-flex">
                      <button
                        className="tw-cursor-pointer"
                        data-testid="edit-button"
                        onClick={() => {
                          setSelectedProperty(property);
                          setOperation('update');
                        }}>
                        <SVGIcons
                          alt="edit"
                          icon={Icons.EDIT}
                          title="Edit"
                          width="16px"
                        />
                      </button>
                      <button
                        className="tw-cursor-pointer tw-ml-4"
                        data-testid="delete-button"
                        onClick={() => {
                          setSelectedProperty(property);
                          setOperation('delete');
                        }}>
                        <SVGIcons
                          alt="delete"
                          icon={Icons.DELETE}
                          title="Delete"
                          width="16px"
                        />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr
                className="tableBody-row tw-border-l-0 tw-border-r-0 tw-border-b-0"
                data-testid="no-data-row">
                <td
                  className="tableBody-cell tw-text-grey-muted tw-text-center"
                  colSpan={4}>
                  No data
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {deleteCheck && (
        <ConfirmationModal
          bodyText={`Are you sure you want to delete the property ${selectedProperty.name}`}
          cancelText="Cancel"
          confirmText="Confirm"
          header={`Delete property ${selectedProperty.name}`}
          onCancel={resetSelectedProperty}
          onConfirm={handlePropertyDelete}
        />
      )}
      {updateCheck && (
        <ModalWithMarkdownEditor
          header={`Edit Property: "${selectedProperty.name}"`}
          placeholder="Enter Property Description"
          value={selectedProperty.description || ''}
          onCancel={resetSelectedProperty}
          onSave={handlePropertyUpdate}
        />
      )}
    </Fragment>
  );
};
