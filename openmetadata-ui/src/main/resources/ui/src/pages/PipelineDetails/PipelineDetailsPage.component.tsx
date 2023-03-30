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

import { AxiosError } from 'axios';
import ErrorPlaceHolder from 'components/common/error-with-placeholder/ErrorPlaceHolder';
import { TitleBreadcrumbProps } from 'components/common/title-breadcrumb/title-breadcrumb.interface';
import {
  Edge,
  EdgeData,
  LeafNodes,
  LineagePos,
  LoadingNodeState,
} from 'components/EntityLineage/EntityLineage.interface';
import Loader from 'components/Loader/Loader';
import { usePermissionProvider } from 'components/PermissionProvider/PermissionProvider';
import { ResourceEntity } from 'components/PermissionProvider/PermissionProvider.interface';
import PipelineDetails from 'components/PipelineDetails/PipelineDetails.component';
import { compare, Operation } from 'fast-json-patch';
import { isUndefined, omitBy } from 'lodash';
import { observer } from 'mobx-react';
import React, { useEffect, useMemo, useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { getLineageByFQN } from 'rest/lineageAPI';
import { addLineage, deleteLineageEdge } from 'rest/miscAPI';
import {
  addFollower,
  getPipelineByFqn,
  patchPipelineDetails,
  removeFollower,
} from 'rest/pipelineAPI';
import { getServiceByFQN } from 'rest/serviceAPI';
import {
  getServiceDetailsPath,
  getVersionPath,
} from '../../constants/constants';
import { NO_PERMISSION_TO_VIEW } from '../../constants/HelperTextUtil';
import { EntityType } from '../../enums/entity.enum';
import { ServiceCategory } from '../../enums/service.enum';
import { Pipeline, Task } from '../../generated/entity/data/pipeline';
import { Connection } from '../../generated/entity/services/dashboardService';
import { EntityLineage } from '../../generated/type/entityLineage';
import { EntityReference } from '../../generated/type/entityReference';
import { Paging } from '../../generated/type/paging';
import jsonData from '../../jsons/en';
import {
  addToRecentViewed,
  getCurrentUserId,
  getEntityMissingError,
  getEntityName,
} from '../../utils/CommonUtils';
import { getEntityLineage } from '../../utils/EntityUtils';
import { DEFAULT_ENTITY_PERMISSION } from '../../utils/PermissionsUtils';
import { defaultFields } from '../../utils/PipelineDetailsUtils';
import { serviceTypeLogo } from '../../utils/ServiceUtils';
import { showErrorToast } from '../../utils/ToastUtils';

const PipelineDetailsPage = () => {
  const USERId = getCurrentUserId();
  const history = useHistory();

  const { pipelineFQN } = useParams<{ pipelineFQN: string }>();
  const [pipelineDetails, setPipelineDetails] = useState<Pipeline>(
    {} as Pipeline
  );

  const [isLoading, setLoading] = useState<boolean>(true);
  const [followers, setFollowers] = useState<Array<EntityReference>>([]);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [pipelineUrl, setPipelineUrl] = useState<string>('');
  const [displayName, setDisplayName] = useState<string>('');
  const [slashedPipelineName, setSlashedPipelineName] = useState<
    TitleBreadcrumbProps['titleLinks']
  >([]);
  const [isNodeLoading, setNodeLoading] = useState<LoadingNodeState>({
    id: undefined,
    state: false,
  });

  const [entityLineage, setEntityLineage] = useState<EntityLineage>(
    {} as EntityLineage
  );
  const [leafNodes, setLeafNodes] = useState<LeafNodes>({} as LeafNodes);

  const [isError, setIsError] = useState(false);

  const [paging] = useState<Paging>({} as Paging);

  const [pipelinePermissions, setPipelinePermissions] = useState(
    DEFAULT_ENTITY_PERMISSION
  );

  const { getEntityPermissionByFqn } = usePermissionProvider();

  const fetchResourcePermission = async (entityFqn: string) => {
    setLoading(true);
    try {
      const entityPermission = await getEntityPermissionByFqn(
        ResourceEntity.PIPELINE,
        entityFqn
      );
      setPipelinePermissions(entityPermission);
    } catch (error) {
      showErrorToast(
        jsonData['api-error-messages']['fetch-entity-permissions-error']
      );
    } finally {
      setLoading(false);
    }
  };

  const { pipelineId, currentVersion } = useMemo(() => {
    return {
      pipelineId: pipelineDetails.id,
      currentVersion: pipelineDetails.version + '',
    };
  }, [pipelineDetails]);

  const saveUpdatedPipelineData = (updatedData: Pipeline) => {
    const jsonPatch = compare(
      omitBy(pipelineDetails, isUndefined),
      updatedData
    );

    return patchPipelineDetails(pipelineId, jsonPatch);
  };

  const fetchServiceDetails = (type: string, fqn: string) => {
    return new Promise<string>((resolve, reject) => {
      getServiceByFQN(type + 's', fqn, ['owner'])
        .then((resService) => {
          if (resService) {
            const hostPort =
              (resService.connection?.config as Connection)?.hostPort || '';
            resolve(hostPort);
          } else {
            throw null;
          }
        })
        .catch((err: AxiosError) => {
          showErrorToast(
            err,
            jsonData['api-error-messages']['fetch-pipeline-details-error']
          );
          reject(err);
        });
    });
  };

  const fetchPipelineDetail = (pipelineFQN: string) => {
    setLoading(true);
    getPipelineByFqn(pipelineFQN, defaultFields)
      .then((res) => {
        if (res) {
          const {
            id,
            fullyQualifiedName,
            service,
            serviceType,
            displayName,
            name,
            tasks,
            pipelineUrl = '',
          } = res;
          setDisplayName(displayName || name);
          setPipelineDetails(res);
          const serviceName = service.name ?? '';
          setSlashedPipelineName([
            {
              name: serviceName,
              url: serviceName
                ? getServiceDetailsPath(
                    serviceName,
                    ServiceCategory.PIPELINE_SERVICES
                  )
                : '',
              imgSrc: serviceType ? serviceTypeLogo(serviceType) : undefined,
            },
            {
              name: getEntityName(res),
              url: '',
              activeTitle: true,
            },
          ]);

          addToRecentViewed({
            displayName: getEntityName(res),
            entityType: EntityType.PIPELINE,
            fqn: fullyQualifiedName ?? '',
            serviceType: serviceType,
            timestamp: 0,
            id: id,
          });

          fetchServiceDetails(service.type, service.name ?? '')
            .then((hostPort: string) => {
              setPipelineUrl(hostPort + pipelineUrl);
              const updatedTasks = ((tasks || []) as Task[]).map((task) => ({
                ...task,
                taskUrl: hostPort + task.taskUrl,
              }));
              setTasks(updatedTasks);
              setLoading(false);
            })
            .catch((err: AxiosError) => {
              throw err;
            });
        } else {
          setIsError(true);

          throw jsonData['api-error-messages']['unexpected-server-response'];
        }
      })
      .catch((err: AxiosError) => {
        if (err.response?.status === 404) {
          setIsError(true);
        } else {
          showErrorToast(
            err,
            jsonData['api-error-messages']['fetch-pipeline-details-error']
          );
        }
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const followPipeline = () => {
    addFollower(pipelineId, USERId)
      .then((res) => {
        if (res) {
          const { newValue } = res.changeDescription.fieldsAdded[0];

          setFollowers([...followers, ...newValue]);
        } else {
          throw jsonData['api-error-messages']['unexpected-server-response'];
        }
      })
      .catch((err: AxiosError) => {
        showErrorToast(
          err,
          jsonData['api-error-messages']['update-entity-follow-error']
        );
      });
  };

  const unfollowPipeline = () => {
    removeFollower(pipelineId, USERId)
      .then((res) => {
        if (res) {
          const { oldValue } = res.changeDescription.fieldsDeleted[0];

          setFollowers(
            followers.filter((follower) => follower.id !== oldValue[0].id)
          );
        } else {
          throw jsonData['api-error-messages']['unexpected-server-response'];
        }
      })
      .catch((err: AxiosError) => {
        showErrorToast(
          err,
          jsonData['api-error-messages']['update-entity-unfollow-error']
        );
      });
  };

  const descriptionUpdateHandler = async (updatedPipeline: Pipeline) => {
    try {
      const response = await saveUpdatedPipelineData(updatedPipeline);
      if (response) {
        setPipelineDetails(response);
      } else {
        throw jsonData['api-error-messages']['unexpected-server-response'];
      }
    } catch (error) {
      showErrorToast(error as AxiosError);
    }
  };

  const settingsUpdateHandler = (updatedPipeline: Pipeline): Promise<void> => {
    return new Promise<void>((resolve, reject) => {
      saveUpdatedPipelineData(updatedPipeline)
        .then((res) => {
          if (res) {
            setPipelineDetails({ ...res, tags: res.tags ?? [] });

            resolve();
          } else {
            throw jsonData['api-error-messages']['unexpected-server-response'];
          }
        })
        .catch((err: AxiosError) => {
          showErrorToast(
            err,
            jsonData['api-error-messages']['update-entity-error']
          );
          reject();
        });
    });
  };

  const onTagUpdate = (updatedPipeline: Pipeline) => {
    saveUpdatedPipelineData(updatedPipeline)
      .then((res) => {
        if (res) {
          setPipelineDetails(res);
        } else {
          throw jsonData['api-error-messages']['unexpected-server-response'];
        }
      })
      .catch((err: AxiosError) => {
        showErrorToast(
          err,
          jsonData['api-error-messages']['update-tags-error']
        );
      });
  };

  const onTaskUpdate = async (jsonPatch: Array<Operation>) => {
    try {
      const response = await patchPipelineDetails(pipelineId, jsonPatch);

      if (response) {
        setTasks(response.tasks || []);
      } else {
        throw jsonData['api-error-messages']['unexpected-server-response'];
      }
    } catch (error) {
      showErrorToast(error as AxiosError);
    }
  };

  const setLeafNode = (val: EntityLineage, pos: LineagePos) => {
    if (pos === 'to' && val.downstreamEdges?.length === 0) {
      setLeafNodes((prev) => ({
        ...prev,
        downStreamNode: [...(prev.downStreamNode ?? []), val.entity.id],
      }));
    }
    if (pos === 'from' && val.upstreamEdges?.length === 0) {
      setLeafNodes((prev) => ({
        ...prev,
        upStreamNode: [...(prev.upStreamNode ?? []), val.entity.id],
      }));
    }
  };

  const entityLineageHandler = (lineage: EntityLineage) => {
    setEntityLineage(lineage);
  };

  const loadNodeHandler = (node: EntityReference, pos: LineagePos) => {
    setNodeLoading({ id: node.id, state: true });
    getLineageByFQN(node.fullyQualifiedName ?? '', node.type)
      .then((res) => {
        if (res) {
          setLeafNode(res, pos);
          setEntityLineage(getEntityLineage(entityLineage, res, pos));
        } else {
          showErrorToast(
            jsonData['api-error-messages']['fetch-lineage-node-error']
          );
        }
        setTimeout(() => {
          setNodeLoading((prev) => ({ ...prev, state: false }));
        }, 500);
      })
      .catch((err: AxiosError) => {
        showErrorToast(
          err,
          jsonData['api-error-messages']['fetch-lineage-node-error']
        );
      });
  };

  const versionHandler = () => {
    history.push(
      getVersionPath(EntityType.PIPELINE, pipelineFQN, currentVersion as string)
    );
  };

  const addLineageHandler = (edge: Edge): Promise<void> => {
    return new Promise<void>((resolve, reject) => {
      addLineage(edge)
        .then(() => {
          resolve();
        })
        .catch((err: AxiosError) => {
          showErrorToast(
            err,
            jsonData['api-error-messages']['add-lineage-error']
          );
          reject();
        });
    });
  };

  const removeLineageHandler = (data: EdgeData) => {
    deleteLineageEdge(
      data.fromEntity,
      data.fromId,
      data.toEntity,
      data.toId
    ).catch((err: AxiosError) => {
      showErrorToast(
        err,
        jsonData['api-error-messages']['delete-lineage-error']
      );
    });
  };

  const handleExtensionUpdate = async (updatedPipeline: Pipeline) => {
    try {
      const data = await saveUpdatedPipelineData(updatedPipeline);

      if (data) {
        setPipelineDetails(data);
      } else {
        throw jsonData['api-error-messages']['update-entity-error'];
      }
    } catch (error) {
      showErrorToast(
        error as AxiosError,
        jsonData['api-error-messages']['update-entity-error']
      );
    }
  };

  useEffect(() => {
    if (pipelinePermissions.ViewAll || pipelinePermissions.ViewBasic) {
      fetchPipelineDetail(pipelineFQN);
      setEntityLineage({} as EntityLineage);
    }
  }, [pipelinePermissions, pipelineFQN]);

  useEffect(() => {
    fetchResourcePermission(pipelineFQN);
  }, [pipelineFQN]);

  return (
    <>
      {isLoading ? (
        <Loader />
      ) : isError ? (
        <ErrorPlaceHolder>
          {getEntityMissingError('pipeline', pipelineFQN)}
        </ErrorPlaceHolder>
      ) : (
        <>
          {pipelinePermissions.ViewAll || pipelinePermissions.ViewBasic ? (
            <PipelineDetails
              addLineageHandler={addLineageHandler}
              descriptionUpdateHandler={descriptionUpdateHandler}
              entityLineage={entityLineage}
              entityLineageHandler={entityLineageHandler}
              entityName={displayName}
              followPipelineHandler={followPipeline}
              followers={followers}
              isNodeLoading={isNodeLoading}
              lineageLeafNodes={leafNodes}
              loadNodeHandler={loadNodeHandler}
              paging={paging}
              pipelineDetails={pipelineDetails}
              pipelineFQN={pipelineFQN}
              pipelineUrl={pipelineUrl}
              removeLineageHandler={removeLineageHandler}
              settingsUpdateHandler={settingsUpdateHandler}
              slashedPipelineName={slashedPipelineName}
              tagUpdateHandler={onTagUpdate}
              taskUpdateHandler={onTaskUpdate}
              tasks={tasks}
              unfollowPipelineHandler={unfollowPipeline}
              versionHandler={versionHandler}
              onExtensionUpdate={handleExtensionUpdate}
            />
          ) : (
            <ErrorPlaceHolder>{NO_PERMISSION_TO_VIEW}</ErrorPlaceHolder>
          )}
        </>
      )}
    </>
  );
};

export default observer(PipelineDetailsPage);
