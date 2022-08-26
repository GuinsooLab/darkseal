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

import { AxiosError, AxiosResponse } from 'axios';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getDashboardByFqn } from '../../axiosAPIs/dashboardAPI';
import { getPipelineByFqn } from '../../axiosAPIs/pipelineAPI';
import { getServiceById } from '../../axiosAPIs/serviceAPI';
import { getTableDetailsByFQN } from '../../axiosAPIs/tableAPI';
import { EntityType } from '../../enums/entity.enum';
import { Dashboard } from '../../generated/entity/data/dashboard';
import { Pipeline } from '../../generated/entity/data/pipeline';
import { Table } from '../../generated/entity/data/table';
import { Topic } from '../../generated/entity/data/topic';
import { getHeaderLabel } from '../../utils/EntityLineageUtils';
import { getEntityOverview, getEntityTags } from '../../utils/EntityUtils';
import { getEncodedFqn } from '../../utils/StringsUtils';
import { getEntityIcon } from '../../utils/TableUtils';
import { showErrorToast } from '../../utils/ToastUtils';
import RichTextEditorPreviewer from '../common/rich-text-editor/RichTextEditorPreviewer';
import { SelectedNode } from '../EntityLineage/EntityLineage.interface';
import Loader from '../Loader/Loader';
import TagsViewer from '../tags-viewer/tags-viewer';
import { LineageDrawerProps } from './EntityInfoDrawer.interface';
import './EntityInfoDrawer.style.css';

const EntityInfoDrawer = ({
  show,
  onCancel,
  selectedNode,
  isMainNode = false,
}: LineageDrawerProps) => {
  const [entityDetail, setEntityDetail] = useState<
    Partial<Table> & Partial<Pipeline> & Partial<Dashboard> & Partial<Topic>
  >(
    {} as Partial<Table> &
      Partial<Pipeline> &
      Partial<Dashboard> &
      Partial<Topic>
  );
  const [serviceType, setServiceType] = useState<string>('');

  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchEntityDetail = (selectedNode: SelectedNode) => {
    switch (selectedNode.type) {
      case EntityType.TABLE: {
        setIsLoading(true);
        getTableDetailsByFQN(getEncodedFqn(selectedNode.fqn), [
          'tags',
          'owner',
          'columns',
          'usageSummary',
          'tableProfile',
        ])
          .then((res: AxiosResponse) => {
            setEntityDetail(res.data);
            setIsLoading(false);
            setServiceType(res.data.serviceType);
          })
          .catch((err: AxiosError) => {
            showErrorToast(
              err,
              `Error while getting ${selectedNode.name} details`
            );
          })
          .finally(() => {
            setIsLoading(false);
          });

        break;
      }
      case EntityType.PIPELINE: {
        setIsLoading(true);
        getPipelineByFqn(getEncodedFqn(selectedNode.fqn), ['tags', 'owner'])
          .then((res: AxiosResponse) => {
            getServiceById('pipelineServices', res.data.service?.id)
              .then((serviceRes: AxiosResponse) => {
                setServiceType(serviceRes.data.serviceType);
              })
              .catch((err: AxiosError) => {
                showErrorToast(
                  err,
                  `Error while getting ${selectedNode.name} service`
                );
              });
            setEntityDetail(res.data);
            setIsLoading(false);
          })
          .catch((err: AxiosError) => {
            showErrorToast(
              err,
              `Error while getting ${selectedNode.name} details`
            );
          })
          .finally(() => {
            setIsLoading(false);
          });

        break;
      }
      case EntityType.DASHBOARD: {
        setIsLoading(true);
        getDashboardByFqn(getEncodedFqn(selectedNode.fqn), ['tags', 'owner'])
          .then((res: AxiosResponse) => {
            getServiceById('dashboardServices', res.data.service?.id)
              .then((serviceRes: AxiosResponse) => {
                setServiceType(serviceRes.data.serviceType);
              })
              .catch((err: AxiosError) => {
                showErrorToast(
                  err,
                  `Error while getting ${selectedNode.name} service`
                );
              });
            setEntityDetail(res.data);
            setIsLoading(false);
          })
          .catch((err: AxiosError) => {
            showErrorToast(
              err,
              `Error while getting ${selectedNode.name} details`
            );
          })
          .finally(() => {
            setIsLoading(false);
          });

        break;
      }

      default:
        break;
    }
  };

  useEffect(() => {
    fetchEntityDetail(selectedNode);
  }, [selectedNode]);

  return (
    <div className={classNames('side-drawer', { open: show })}>
      <header className="tw-flex tw-justify-between">
        <p className="tw-flex">
          <span className="tw-mr-2">{getEntityIcon(selectedNode.type)}</span>
          {getHeaderLabel(
            selectedNode.displayName ?? selectedNode.name,
            selectedNode.fqn,
            selectedNode.type,
            isMainNode
          )}
        </p>
        <div className="tw-flex">
          <svg
            className="tw-w-5 tw-h-5 tw-ml-1 tw-cursor-pointer"
            data-testid="closeDrawer"
            fill="none"
            stroke="#6B7280"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            onClick={() => onCancel(false)}>
            <path
              d="M6 18L18 6M6 6l12 12"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
            />
          </svg>
        </div>
      </header>
      <hr className="tw-mt-3 tw-border-separator" />
      {isLoading ? (
        <Loader />
      ) : (
        <>
          <section className="tw-mt-1">
            <div className="tw-flex tw-flex-col">
              {getEntityOverview(
                selectedNode.type,
                entityDetail,
                serviceType
              ).map((d) => {
                return (
                  <div className="tw-py-1.5 tw-flex" key={d.name}>
                    {d.name && <span>{d.name}:</span>}
                    <span
                      className={classNames(
                        { 'tw-ml-2': d.name },
                        {
                          'link-text': d.isLink,
                        }
                      )}>
                      {d.isLink ? (
                        <Link
                          target={d.isExternal ? '_blank' : '_self'}
                          to={{ pathname: d.url }}>
                          {d.value}
                        </Link>
                      ) : (
                        d.value
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
          <hr className="tw-mt-3 tw-border-separator" />
          <section className="tw-mt-1">
            <span className="tw-text-grey-muted">Tags</span>
            <div className="tw-flex tw-flex-wrap tw-pt-1.5">
              {getEntityTags(selectedNode.type, entityDetail).length > 0 ? (
                <TagsViewer
                  sizeCap={-1}
                  tags={getEntityTags(selectedNode.type, entityDetail)}
                />
              ) : (
                <p className="tw-text-xs tw-text-grey-muted">No Tags added</p>
              )}
            </div>
          </section>
          <hr className="tw-mt-3 tw-border-separator" />
          <section className="tw-mt-1">
            <span className="tw-text-grey-muted">Description</span>
            <div>
              {entityDetail.description?.trim() ? (
                <RichTextEditorPreviewer markdown={entityDetail.description} />
              ) : (
                <p className="tw-text-xs tw-text-grey-muted">No description</p>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
};

export default EntityInfoDrawer;
