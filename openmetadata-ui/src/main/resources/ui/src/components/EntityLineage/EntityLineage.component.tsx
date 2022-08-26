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

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { AxiosError, AxiosResponse } from 'axios';
import classNames from 'classnames';
import {
  isEmpty,
  isNil,
  isUndefined,
  lowerCase,
  uniqueId,
  upperCase,
} from 'lodash';
import { LoadingState } from 'Models';
import React, {
  DragEvent,
  Fragment,
  FunctionComponent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import ReactFlow, {
  addEdge,
  Background,
  BackgroundVariant,
  Connection,
  Edge,
  getConnectedEdges,
  isNode,
  MarkerType,
  Node,
  ReactFlowInstance,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
} from 'react-flow-renderer';
import { useAuthContext } from '../../authentication/auth-provider/AuthProvider';
import { getTableDetails } from '../../axiosAPIs/tableAPI';
import { ELEMENT_DELETE_STATE } from '../../constants/Lineage.constants';
import {
  AddLineage,
  ColumnLineage,
} from '../../generated/api/lineage/addLineage';
import { Column } from '../../generated/entity/data/table';
import { Operation } from '../../generated/entity/policies/accessControl/rule';
import { EntityLineage } from '../../generated/type/entityLineage';
import { EntityReference } from '../../generated/type/entityReference';
import { withLoader } from '../../hoc/withLoader';
import { useAuth } from '../../hooks/authHooks';
import {
  dragHandle,
  getColumnType,
  getDataLabel,
  getDeletedLineagePlaceholder,
  getLayoutedElements,
  getLineageData,
  getModalBodyText,
  getNodeRemoveButton,
  getUniqueFlowElements,
  onLoad,
  onNodeContextMenu,
  onNodeMouseEnter,
  onNodeMouseLeave,
  onNodeMouseMove,
} from '../../utils/EntityLineageUtils';
import SVGIcons from '../../utils/SvgUtils';
import { getEntityIcon } from '../../utils/TableUtils';
import { showErrorToast } from '../../utils/ToastUtils';
import NonAdminAction from '../common/non-admin-action/NonAdminAction';
import EntityInfoDrawer from '../EntityInfoDrawer/EntityInfoDrawer.component';
import Loader from '../Loader/Loader';
import ConfirmationModal from '../Modals/ConfirmationModal/ConfirmationModal';
import CustomControls, { ControlButton } from './CustomControls.component';
import { CustomEdge } from './CustomEdge.component';
import CustomNode from './CustomNode.component';
import {
  CustomEdgeData,
  CustomeElement,
  EdgeData,
  ElementLoadingState,
  EntityLineageProp,
  ModifiedColumn,
  SelectedEdge,
  SelectedNode,
} from './EntityLineage.interface';
import EntityLineageSidebar from './EntityLineageSidebar.component';
import NodeSuggestions from './NodeSuggestions.component';

const Entitylineage: FunctionComponent<EntityLineageProp> = ({
  entityLineage,
  loadNodeHandler,
  lineageLeafNodes,
  isNodeLoading,
  isLoading,
  deleted,
  addLineageHandler,
  removeLineageHandler,
  entityLineageHandler,
}: EntityLineageProp) => {
  const { userPermissions, isAdminUser } = useAuth();
  const { isAuthDisabled } = useAuthContext();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] =
    useState<ReactFlowInstance>();
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [selectedNode, setSelectedNode] = useState<SelectedNode>(
    {} as SelectedNode
  );
  const expandButton = useRef<HTMLButtonElement | null>(null);
  const [isEditMode, setEditMode] = useState<boolean>(false);

  const tableColumnsRef = useRef<{ [key: string]: Column[] }>(
    {} as { [key: string]: Column[] }
  );
  const [newAddedNode, setNewAddedNode] = useState<Node>({} as Node);
  const [selectedEntity, setSelectedEntity] = useState<EntityReference>(
    {} as EntityReference
  );
  const [confirmDelete, setConfirmDelete] = useState<boolean>(false);

  const [showdeleteModal, setShowDeleteModal] = useState<boolean>(false);

  const [selectedEdge, setSelectedEdge] = useState<SelectedEdge>(
    {} as SelectedEdge
  );

  const [loading, setLoading] = useState<boolean>(false);
  const [status, setStatus] = useState<LoadingState>('initial');
  const [deletionState, setDeletionState] = useState<{
    loading: boolean;
    status: ElementLoadingState;
  }>(ELEMENT_DELETE_STATE);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  /**
   * this state will maintain the updated state and
   * it will be sent back to parent when the user came out from edit mode to view mode
   */
  const [updatedLineageData, setUpdatedLineageData] =
    useState<EntityLineage>(entityLineage);

  /**
   * Custom Node Type Object
   */
  const nodeTypes = useMemo(
    () => ({
      output: CustomNode,
      input: CustomNode,
      default: CustomNode,
    }),
    []
  );

  const customEdges = useMemo(() => ({ buttonedge: CustomEdge }), []);

  /**
   * take node as input and check if node is main entity or not
   * @param node
   * @returns class `leaf-node core` for main node and `leaf-node` for leaf node
   */
  const getNodeClass = (node: Node) => {
    return `${
      node.id.includes(updatedLineageData.entity?.id) && !isEditMode
        ? 'leaf-node core'
        : 'leaf-node'
    }`;
  };

  /**
   * take entity as input and set it as selected entity
   * @param entity
   */
  const selectedEntityHandler = (entity: EntityReference) => {
    setSelectedEntity(entity);
  };

  /**
   * take state and value to set selected node
   * @param state
   * @param value
   */
  const selectNodeHandler = (state: boolean, value: SelectedNode) => {
    setIsDrawerOpen(state);
    setSelectedNode(value);
  };

  /**
   *
   * @param node
   * @returns label for given node
   */
  const getNodeLabel = (node: EntityReference, isExpanded = false) => {
    return (
      <Fragment>
        {node.type === 'table' ? (
          <button
            className="tw-absolute tw--top-3.5 tw--left-2 tw-cursor-pointer tw-z-9999"
            onClick={(e) => {
              expandButton.current = expandButton.current
                ? null
                : e.currentTarget;
              // eslint-disable-next-line @typescript-eslint/no-use-before-define
              handleNodeExpand(!isExpanded, node);
              setIsDrawerOpen(false);
            }}>
            <SVGIcons
              alt="plus"
              icon={isExpanded ? 'icon-minus' : 'icon-plus'}
              width="16px"
            />
          </button>
        ) : null}
        <p className="tw-flex tw-m-0 tw-py-3">
          <span className="tw-mr-2">{getEntityIcon(node.type)}</span>
          {getDataLabel(
            node.displayName,
            node.fullyQualifiedName,
            false,
            node.type
          )}
        </p>
      </Fragment>
    );
  };

  /**
   *
   * @param data selected edge
   * @param confirmDelete confirmation state for deleting seslected edge
   */
  const removeEdgeHandler = (data: SelectedEdge, confirmDelete: boolean) => {
    if (confirmDelete) {
      const edgeData: EdgeData = {
        fromEntity: data.source.type,
        fromId: data.source.id,
        toEntity: data.target.type,
        toId: data.target.id,
      };
      removeLineageHandler(edgeData);
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      setEdges((es) => {
        return es.filter(
          (e) => e.source !== data.source.id && e.target !== data.target.id
        );
      });

      /**
       * Get new downstreamEdges
       */
      const newDownStreamEdges = updatedLineageData.downstreamEdges?.filter(
        (dn) =>
          !updatedLineageData.downstreamEdges?.find(
            () =>
              edgeData.fromId === dn.fromEntity && edgeData.toId === dn.toEntity
          )
      );

      /**
       * Get new upstreamEdges
       */
      const newUpStreamEdges = updatedLineageData.upstreamEdges?.filter(
        (up) =>
          !updatedLineageData.upstreamEdges?.find(
            () =>
              edgeData.fromId === up.fromEntity && edgeData.toId === up.toEntity
          )
      );

      setNewAddedNode({} as Node);
      setSelectedEntity({} as EntityReference);
      setUpdatedLineageData({
        ...updatedLineageData,
        downstreamEdges: newDownStreamEdges,
        upstreamEdges: newUpStreamEdges,
      });
      setConfirmDelete(false);
    }
  };

  const removeColumnEdge = (data: SelectedEdge, confirmDelete: boolean) => {
    if (confirmDelete) {
      const upStreamEdge = updatedLineageData.upstreamEdges?.find(
        (up) =>
          up.fromEntity === data.source.id && up.toEntity === data.target.id
      );

      const downStreamEdge = updatedLineageData.downstreamEdges?.find(
        (down) =>
          down.fromEntity === data.source.id && down.toEntity === data.target.id
      );

      const selectedEdge: AddLineage = {
        edge: {
          fromEntity: {
            id: data.source.id,
            type: data.source.type,
          },
          toEntity: {
            id: data.target.id,
            type: data.target.type,
          },
        },
      };

      if (!isUndefined(upStreamEdge)) {
        const upColumnsLineage: ColumnLineage[] =
          upStreamEdge.lineageDetails?.columnsLineage?.reduce((col, curr) => {
            if (curr.toColumn === data.data?.targetHandle) {
              const newCol = {
                ...curr,
                fromColumns:
                  curr.fromColumns?.filter(
                    (c) => c !== data.data?.sourceHandle
                  ) || [],
              };
              if (newCol.fromColumns?.length) {
                return [...col, newCol];
              } else {
                return col;
              }
            }

            return [...col, curr];
          }, [] as ColumnLineage[]) || [];
        selectedEdge.edge.lineageDetails = {
          sqlQuery: upStreamEdge.lineageDetails?.sqlQuery || '',
          columnsLineage: upColumnsLineage,
        };

        setUpdatedLineageData({
          ...updatedLineageData,
          upstreamEdges: updatedLineageData.upstreamEdges?.map((up) => {
            if (
              up.fromEntity === data.source.id &&
              up.toEntity === data.target.id
            ) {
              return {
                ...up,
                lineageDetails: selectedEdge.edge.lineageDetails,
              };
            }

            return up;
          }),
        });
      }

      if (!isUndefined(downStreamEdge)) {
        const downColumnsLineage: ColumnLineage[] =
          downStreamEdge.lineageDetails?.columnsLineage?.reduce((col, curr) => {
            if (curr.toColumn === data.data?.targetHandle) {
              const newCol: ColumnLineage = {
                ...curr,
                fromColumns:
                  curr.fromColumns?.filter(
                    (c) => c !== data.data?.sourceHandle
                  ) || [],
              };
              if (newCol.fromColumns?.length) {
                return [...col, newCol];
              } else {
                return col;
              }
            }

            return [...col, curr];
          }, [] as ColumnLineage[]) || [];
        selectedEdge.edge.lineageDetails = {
          sqlQuery: downStreamEdge.lineageDetails?.sqlQuery || '',
          columnsLineage: downColumnsLineage,
        };

        setUpdatedLineageData({
          ...updatedLineageData,
          downstreamEdges: updatedLineageData.downstreamEdges?.map((down) => {
            if (
              down.fromEntity === data.source.id &&
              down.toEntity === data.target.id
            ) {
              return {
                ...down,
                lineageDetails: selectedEdge.edge.lineageDetails,
              };
            }

            return down;
          }),
        });
      }
      setEdges((pre) => {
        return pre.filter(
          (e) =>
            !(
              e.sourceHandle === data.data?.sourceHandle &&
              e.targetHandle === data.data?.targetHandle
            )
        );
      });
      addLineageHandler(selectedEdge);
      setNewAddedNode({} as Node);
      setSelectedEntity({} as EntityReference);
      setConfirmDelete(false);
    }
  };

  /**
   * take edge data and set it as selected edge
   * @param evt
   * @param data
   */
  const onEdgeClick = (
    evt: React.MouseEvent<HTMLButtonElement>,
    data: CustomEdgeData
  ) => {
    setShowDeleteModal(true);
    evt.stopPropagation();
    setSelectedEdge(() => {
      const allNode = [
        ...(updatedLineageData.nodes || []),
        updatedLineageData.entity,
      ];
      let targetNode = allNode.find((n) => data.target?.includes(n.id));

      let sourceNode = allNode.find((n) => data.source?.includes(n.id));

      if (isUndefined(targetNode)) {
        targetNode = isEmpty(selectedEntity)
          ? updatedLineageData.entity
          : selectedEntity;
      }
      if (isUndefined(sourceNode)) {
        sourceNode = isEmpty(selectedEntity)
          ? updatedLineageData.entity
          : selectedEntity;
      }

      return { id: data.id, source: sourceNode, target: targetNode, data };
    });
  };

  /**
   * Reset State between view and edit mode toggle
   */
  const resetViewEditState = () => {
    setConfirmDelete(false);
  };

  const setElementsHandle = (data: EntityLineage) => {
    let uniqueElements: CustomeElement = {
      node: [],
      edge: [],
    };
    const currentData = {
      nodes: [...(nodes || [])],
      edges: [...(edges || [])],
    };
    if (!isEmpty(data)) {
      const graphElements = getLineageData(
        data,
        selectNodeHandler,
        loadNodeHandler,
        lineageLeafNodes,
        isNodeLoading,
        getNodeLabel,
        isEditMode,
        'buttonedge',
        onEdgeClick,
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        removeNodeHandler,
        tableColumnsRef.current,
        currentData
      ) as CustomeElement;

      uniqueElements = {
        node: getUniqueFlowElements(graphElements.node) as Node[],
        edge: getUniqueFlowElements(graphElements.edge) as Edge[],
      };
      const { node, edge } = getLayoutedElements(uniqueElements);
      setNodes(node);
      setEdges(edge);

      resetViewEditState();
    }
  };

  /**
   * take boolean value as input and reset selected node
   * @param value
   */
  const closeDrawer = (value: boolean) => {
    setIsDrawerOpen(value);
    setNodes((prevElements) => {
      return prevElements.map((el) => {
        if (el.id === selectedNode.id) {
          return {
            ...el,
            className: getNodeClass(el),
          };
        } else {
          return el;
        }
      });
    });
    setSelectedNode({} as SelectedNode);
  };

  /**
   * take edge or connection to add new element in the graph
   * @param params
   */
  const onConnect = useCallback(
    (params: Edge | Connection) => {
      const { target, source, sourceHandle, targetHandle } = params;

      if (target === source) return;

      const columnConnection = !isNil(sourceHandle) && !isNil(targetHandle);
      const normalConnection = isNil(sourceHandle) && isNil(targetHandle);
      const mainEntity = updatedLineageData.entity;
      if (columnConnection || normalConnection) {
        setStatus('waiting');
        setLoading(true);

        let edgeType: 'upstream' | 'downstream' | '' = '';

        const nodes = [
          ...(updatedLineageData.nodes as EntityReference[]),
          updatedLineageData.entity,
        ];

        const sourceDownstreamNode = updatedLineageData.downstreamEdges?.find(
          (d) =>
            (source?.includes(d.fromEntity) || source?.includes(d.toEntity)) &&
            source !== mainEntity.id
        );

        const sourceUpStreamNode = updatedLineageData.upstreamEdges?.find(
          (u) =>
            (source?.includes(u.fromEntity) || source?.includes(u.toEntity)) &&
            source !== mainEntity.id
        );

        const targetDownStreamNode = updatedLineageData.downstreamEdges?.find(
          (d) =>
            (target?.includes(d.toEntity) || target?.includes(d.fromEntity)) &&
            target !== mainEntity.id
        );

        const targetUpStreamNode = updatedLineageData.upstreamEdges?.find(
          (u) =>
            (target?.includes(u.toEntity) || target?.includes(u.fromEntity)) &&
            target !== mainEntity.id
        );

        const isUpstream =
          (!isNil(sourceUpStreamNode) && !isNil(targetDownStreamNode)) ||
          !isNil(sourceUpStreamNode) ||
          !isNil(targetUpStreamNode) ||
          target?.includes(mainEntity.id);

        const isDownstream =
          (!isNil(sourceDownstreamNode) && !isNil(targetUpStreamNode)) ||
          !isNil(sourceDownstreamNode) ||
          !isNil(targetDownStreamNode) ||
          source?.includes(mainEntity.id);

        if (isUpstream) {
          edgeType = 'upstream';
        } else if (isDownstream) {
          edgeType = 'downstream';
        }

        let targetNode = nodes?.find((n) => target?.includes(n.id));

        let sourceNode = nodes?.find((n) => source?.includes(n.id));

        if (isUndefined(targetNode) && sourceNode?.id !== selectedEntity?.id) {
          targetNode = target?.includes(updatedLineageData.entity?.id)
            ? updatedLineageData.entity
            : selectedEntity;
        }
        if (isUndefined(sourceNode) && targetNode?.id !== selectedEntity?.id) {
          sourceNode = source?.includes(updatedLineageData.entity?.id)
            ? updatedLineageData.entity
            : selectedEntity;
        }

        if (!isUndefined(sourceNode) && !isUndefined(targetNode)) {
          const newEdge: AddLineage = {
            edge: {
              fromEntity: {
                id: sourceNode.id,
                type: sourceNode.type,
              },
              toEntity: {
                id: targetNode.id,
                type: targetNode.type,
              },
            },
          };

          if (columnConnection) {
            const allEdge = [
              ...(updatedLineageData.downstreamEdges || []),
              ...(updatedLineageData.upstreamEdges || []),
            ];
            const currentEdge = allEdge.find(
              (e) => e.fromEntity === source && e.toEntity === target
            )?.lineageDetails;

            if (isUndefined(currentEdge)) {
              newEdge.edge.lineageDetails = {
                sqlQuery: '',
                columnsLineage: [
                  {
                    fromColumns: [sourceHandle || ''],
                    toColumn: targetHandle || '',
                  },
                ],
              };
            } else {
              const updatedColumnsLineage: ColumnLineage[] =
                currentEdge.columnsLineage?.map((l) => {
                  if (l.toColumn === targetHandle) {
                    return {
                      ...l,
                      fromColumns: [
                        ...(l.fromColumns || []),
                        sourceHandle || '',
                      ],
                    };
                  }

                  return l;
                }) || [];
              if (
                !updatedColumnsLineage.find((l) => l.toColumn === targetHandle)
              ) {
                updatedColumnsLineage.push({
                  fromColumns: [sourceHandle || ''],
                  toColumn: targetHandle || '',
                });
              }
              newEdge.edge.lineageDetails = {
                sqlQuery: currentEdge.sqlQuery || '',
                columnsLineage: updatedColumnsLineage,
              };
            }

            setEdges((els) => {
              const newEdgeData = {
                id: `column-${sourceHandle}-${targetHandle}-edge-${params.source}-${params.target}`,
                source: source || '',
                target: target || '',
                sourceHandle: sourceHandle,
                targetHandle: targetHandle,
                type: isEditMode ? 'buttonedge' : 'custom',
                markerEnd: {
                  type: MarkerType.ArrowClosed,
                },
                data: {
                  id: `column-${sourceHandle}-${targetHandle}-edge-${params.source}-${params.target}`,
                  source: params.source,
                  target: params.target,
                  sourceHandle: sourceHandle,
                  targetHandle: targetHandle,
                  sourceType: sourceNode?.type,
                  targetType: targetNode?.type,
                  isColumnLineage: true,
                  onEdgeClick,
                },
              };

              return getUniqueFlowElements(addEdge(newEdgeData, els)) as Edge[];
            });
          }

          setEdges((els) => {
            const newEdgeData = {
              id: `edge-${params.source}-${params.target}`,
              source: `${params.source}`,
              target: `${params.target}`,
              type: isEditMode ? 'buttonedge' : 'custom',
              style: { strokeWidth: '2px' },
              markerEnd: {
                type: MarkerType.ArrowClosed,
              },
              data: {
                id: `edge-${params.source}-${params.target}`,
                source: params.source,
                target: params.target,
                sourceType: sourceNode?.type,
                targetType: targetNode?.type,
                isColumnLineage: false,
                onEdgeClick,
              },
            };

            return getUniqueFlowElements(addEdge(newEdgeData, els)) as Edge[];
          });

          const updatedDownStreamEdges = (pre: EntityLineage) => {
            if (edgeType !== 'downstream') {
              return pre.downstreamEdges;
            }

            const isExist = pre.downstreamEdges?.find(
              (e) => e.fromEntity === source && e.toEntity === target
            );

            if (!isUndefined(isExist)) {
              const updatedEdge: EntityLineage['downstreamEdges'] = [];
              pre.downstreamEdges?.forEach((e) => {
                if (e.fromEntity === source && e.toEntity === target) {
                  updatedEdge.push({
                    ...e,
                    lineageDetails: newEdge.edge.lineageDetails,
                  });
                } else {
                  updatedEdge.push(e);
                }
              });

              return updatedEdge;
            }

            return [
              ...(pre.downstreamEdges || []),
              {
                fromEntity: sourceNode?.id as string,
                toEntity: targetNode?.id as string,
                lineageDetails: newEdge.edge.lineageDetails,
              },
            ];
          };

          const updatedUpStreamEdges = (pre: EntityLineage) => {
            if (edgeType !== 'upstream') {
              return pre.upstreamEdges;
            }

            const isExist = pre.upstreamEdges?.find(
              (e) => e.fromEntity === source && e.toEntity === target
            );

            if (!isUndefined(isExist)) {
              const updatedEdge: EntityLineage['upstreamEdges'] = [];
              pre.upstreamEdges?.forEach((e) => {
                if (e.fromEntity === source && e.toEntity === target) {
                  updatedEdge.push({
                    ...e,
                    lineageDetails: newEdge.edge.lineageDetails,
                  });
                } else {
                  updatedEdge.push(e);
                }
              });

              return updatedEdge;
            }

            return [
              ...(pre.upstreamEdges || []),
              {
                fromEntity: sourceNode?.id as string,
                toEntity: targetNode?.id as string,
                lineageDetails: newEdge.edge.lineageDetails,
              },
            ];
          };

          const getUpdatedNodes = (pre: EntityLineage) => {
            return !isEmpty(selectedEntity)
              ? [...(pre.nodes || []), selectedEntity]
              : pre.nodes;
          };

          setTimeout(() => {
            addLineageHandler(newEdge)
              .then(() => {
                setStatus('success');
                setLoading(false);
                setUpdatedLineageData((pre) => {
                  const newData = {
                    ...pre,
                    nodes: getUpdatedNodes(pre),
                    downstreamEdges: updatedDownStreamEdges(pre),
                    upstreamEdges: updatedUpStreamEdges(pre),
                  };

                  return newData;
                });
                setTimeout(() => {
                  setStatus('initial');
                }, 100);
                setNewAddedNode({} as Node);
                setSelectedEntity({} as EntityReference);
              })
              .catch(() => {
                setStatus('initial');
                setLoading(false);
              });
          }, 500);
        }
      }
    },
    [selectedNode, updatedLineageData, selectedEntity]
  );

  /**
   * take element and perform onClick logic
   * @param el
   */
  const onNodeClick = (el: Node) => {
    if (isNode(el)) {
      const node = [
        ...(updatedLineageData.nodes as Array<EntityReference>),
        updatedLineageData.entity,
      ].find((n) => el.id.includes(n.id));

      if (!expandButton.current) {
        selectNodeHandler(true, {
          name: node?.name as string,
          fqn: node?.fullyQualifiedName as string,
          id: el.id,
          displayName: node?.displayName,
          type: node?.type as string,
          entityId: node?.id as string,
        });
      } else {
        expandButton.current = null;
      }
    }
  };

  //   ToDo: remove below code once design flow finalized for column expand and colaps

  const updateColumnsToNode = (columns: Column[], id: string) => {
    setNodes((node) => {
      const updatedNode = node.map((n) => {
        if (n.id === id) {
          const cols: { [key: string]: ModifiedColumn } = {};
          columns.forEach((col) => {
            cols[col.fullyQualifiedName || col.name] = {
              ...col,
              type: isEditMode
                ? 'default'
                : getColumnType(edges, col.fullyQualifiedName || col.name),
            };
          });
          n.data.columns = cols;
        }

        return n;
      });

      return updatedNode;
    });
  };

  /**
   * take node and get the columns for that node
   * @param expandNode
   */
  const getTableColumns = (expandNode?: EntityReference) => {
    if (expandNode) {
      getTableDetails(expandNode.id, ['columns'])
        .then((res: AxiosResponse) => {
          const tableId = expandNode.id;
          const { columns } = res.data;
          tableColumnsRef.current[tableId] = columns;
          updateColumnsToNode(columns, tableId);
        })
        .catch((error: AxiosError) => {
          showErrorToast(
            error,
            `Error while fetching ${getDataLabel(
              expandNode.displayName,
              expandNode.name,
              true
            )} columns`
          );
        });
    }
  };

  const handleNodeExpand = (isExpanded: boolean, node: EntityReference) => {
    if (isExpanded) {
      setNodes((prevState) => {
        const newNodes = prevState.map((n) => {
          if (n.id === node.id) {
            const nodeId = node.id;
            n.data.label = getNodeLabel(node, true);
            n.data.isExpanded = true;
            if (isUndefined(tableColumnsRef.current[nodeId])) {
              getTableColumns(node);
            } else {
              const cols: { [key: string]: ModifiedColumn } = {};
              tableColumnsRef.current[nodeId]?.forEach((col) => {
                cols[col.fullyQualifiedName || col.name] = {
                  ...col,
                  type: isEditMode
                    ? 'default'
                    : getColumnType(edges, col.fullyQualifiedName || col.name),
                };
              });
              n.data.columns = cols;
            }
          }

          return n;
        });

        return newNodes;
      });
    } else {
      setNodes((prevState) => {
        const newNodes = prevState.map((n) => {
          if (n.id === node.id) {
            n.data.label = getNodeLabel(node);
            n.data.isExpanded = false;
            n.data.columns = undefined;
          }

          return n;
        });

        return newNodes;
      });
    }
  };

  /**
   * take node and remove it from the graph
   * @param node
   */
  const removeNodeHandler = useCallback(
    (node: Node) => {
      // Get all edges for the flow
      //   const edges = elements.filter((element) => isEdge(element));

      // Get edges connected to selected node
      const edgesToRemove = getConnectedEdges([node], edges as Edge[]);

      edgesToRemove.forEach((edge) => {
        let targetNode = updatedLineageData.nodes?.find((n) =>
          edge.target?.includes(n.id)
        );

        let sourceNode = updatedLineageData.nodes?.find((n) =>
          edge.source?.includes(n.id)
        );

        if (isUndefined(targetNode)) {
          targetNode = isEmpty(selectedEntity)
            ? updatedLineageData.entity
            : selectedEntity;
        }
        if (isUndefined(sourceNode)) {
          sourceNode = isEmpty(selectedEntity)
            ? updatedLineageData.entity
            : selectedEntity;
        }

        removeEdgeHandler(
          {
            id: edge.id,
            source: sourceNode,
            target: targetNode,
          },
          true
        );
      });

      setNodes(
        (es) =>
          getUniqueFlowElements(es.filter((n) => n.id !== node.id)) as Node[]
      );
      setNewAddedNode({} as Node);
    },
    [nodes, updatedLineageData]
  );

  /**
   * handle node drag event
   * @param event
   */
  const onDragOver = (event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  };

  /**
   * handle node drop event
   * @param event
   */
  const onDrop = (event: DragEvent) => {
    event.preventDefault();

    const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
    const type = event.dataTransfer.getData('application/reactflow');
    if (type.trim()) {
      const position = reactFlowInstance?.project({
        x: event.clientX - (reactFlowBounds?.left ?? 0),
        y: event.clientY - (reactFlowBounds?.top ?? 0),
      });
      const [label, nodeType] = type.split('-');
      const newNode = {
        id: uniqueId(),
        nodeType,
        position,
        className: 'leaf-node',
        connectable: false,
        selectable: false,
        type: 'default',
        data: {
          label: (
            <div className="tw-relative">
              {getNodeRemoveButton(() => {
                removeNodeHandler(newNode as Node);
              })}
              <div className="tw-flex">
                <SVGIcons
                  alt="entity-icon"
                  className="tw-mr-2"
                  icon={`${lowerCase(label)}-grey`}
                  width="16px"
                />
                <NodeSuggestions
                  entityType={upperCase(label)}
                  onSelectHandler={selectedEntityHandler}
                />
              </div>
            </div>
          ),
          removeNodeHandler,
          isEditMode,
          isNewNode: true,
        },
      };
      setNewAddedNode(newNode as Node);

      setNodes(
        (es) => getUniqueFlowElements(es.concat(newNode as Node)) as Node[]
      );
    }
  };

  /**
   * After dropping node to graph user will search and select entity
   * and this method will take care of changing node information based on selected entity.
   */
  const onEntitySelect = () => {
    if (!isEmpty(selectedEntity)) {
      const isExistingNode = nodes.some((n) => n.id === selectedEntity.id);
      if (isExistingNode) {
        setNodes((es) =>
          es
            .map((n) =>
              n.id.includes(selectedEntity.id)
                ? {
                    ...n,
                    selectable: true,
                    className: `${n.className} selected`,
                  }
                : n
            )
            .filter((es) => es.id !== newAddedNode.id)
        );
        setNewAddedNode({} as Node);
        setSelectedEntity({} as EntityReference);
      } else {
        setNodes((es) => {
          return es.map((el) => {
            if (el.id === newAddedNode.id) {
              return {
                ...el,
                connectable: true,
                selectable: true,
                id: selectedEntity.id,
                data: {
                  ...el.data,
                  removeNodeHandler,
                  isEditMode,
                  label: (
                    <Fragment>
                      {getNodeLabel(selectedEntity)}
                      {getNodeRemoveButton(() => {
                        removeNodeHandler({
                          ...el,
                          id: selectedEntity.id,
                        } as Node);
                      })}
                    </Fragment>
                  ),
                },
              };
            } else {
              return el;
            }
          });
        });
      }
    }
  };

  /**
   * This method will handle the delete edge modal confirmation
   */
  const onRemove = () => {
    setDeletionState({ ...ELEMENT_DELETE_STATE, loading: true });
    setTimeout(() => {
      setDeletionState({ ...ELEMENT_DELETE_STATE, status: 'success' });
      setTimeout(() => {
        setShowDeleteModal(false);
        setConfirmDelete(true);
        setDeletionState((pre) => ({ ...pre, status: 'initial' }));
      }, 500);
    }, 500);
  };

  /**
   *
   * @returns Custom control elements
   */
  const getCustomControlElements = () => {
    return (
      <CustomControls
        className="tw-absolute tw-top-1 tw-right-3 tw-bottom-full tw-ml-4 tw-mt-4"
        fitViewParams={{ minZoom: 0.5, maxZoom: 2.5 }}>
        {!deleted && (
          <NonAdminAction
            html={
              <Fragment>
                <p>You do not have permission to edit the lineage</p>
              </Fragment>
            }
            permission={Operation.EditLineage}>
            <ControlButton
              className={classNames(
                'tw-h-9 tw-w-9 tw-rounded-full tw-px-1 tw-shadow-lg tw-cursor-pointer',
                {
                  'tw-bg-primary': isEditMode,
                  'tw-bg-primary-hover-lite': !isEditMode,
                },
                {
                  'tw-opacity-40':
                    !userPermissions[Operation.EditLineage] &&
                    !isAuthDisabled &&
                    !isAdminUser,
                }
              )}
              onClick={() => {
                setEditMode((pre) => !pre && !deleted);
                setSelectedNode({} as SelectedNode);
                setIsDrawerOpen(false);
                setNewAddedNode({} as Node);
              }}>
              {loading ? (
                <Loader size="small" type="white" />
              ) : status === 'success' ? (
                <FontAwesomeIcon className="tw-text-white" icon="check" />
              ) : (
                <SVGIcons
                  alt="icon-edit-lineag"
                  className="tw--mt-1"
                  data-testid="edit-lineage"
                  icon={
                    !isEditMode
                      ? 'icon-edit-lineage-color'
                      : 'icon-edit-lineage'
                  }
                  width="14"
                />
              )}
            </ControlButton>
          </NonAdminAction>
        )}
      </CustomControls>
    );
  };

  /**
   *
   * @returns Grid background if editmode is enabled otherwise null
   */
  const getGraphBackGround = () => {
    if (!isEditMode) {
      return null;
    } else {
      return <Background gap={12} size={1} variant={BackgroundVariant.Lines} />;
    }
  };

  /**
   *
   * @returns Side drawer if node is selected and view mode is enabled otherwise null
   */
  const getEntityDrawer = () => {
    if (isEmpty(selectedNode) || isEditMode) {
      return null;
    } else {
      return (
        <EntityInfoDrawer
          isMainNode={selectedNode.name === updatedLineageData.entity?.name}
          selectedNode={selectedNode}
          show={isDrawerOpen && !isEditMode}
          onCancel={closeDrawer}
        />
      );
    }
  };

  const getConfirmationModal = () => {
    if (!showdeleteModal) {
      return null;
    } else {
      return (
        <ConfirmationModal
          bodyText={getModalBodyText(selectedEdge)}
          cancelText={
            <span
              className={classNames({
                'tw-pointer-events-none tw-opacity-70': deletionState.loading,
              })}>
              Cancel
            </span>
          }
          confirmText={
            deletionState.loading ? (
              <Loader size="small" type="white" />
            ) : deletionState.status === 'success' ? (
              <FontAwesomeIcon className="tw-text-white" icon="check" />
            ) : (
              'Confirm'
            )
          }
          header="Remove lineage edge"
          onCancel={() => {
            setShowDeleteModal(false);
          }}
          onConfirm={onRemove}
        />
      );
    }
  };

  /**
   * Handle updated linegae nodes
   * Change newly added node label based on entity:EntityReference
   */
  const handleUpdatedLineageNode = () => {
    const uNodes = updatedLineageData.nodes;
    const newlyAddedNodeElement = nodes.find((el) => el?.data?.isNewNode);
    const newlyAddedNode = uNodes?.find(
      (node) => node.id === newlyAddedNodeElement?.id
    );

    setNodes((els) => {
      return (els || []).map((el) => {
        if (el.id === newlyAddedNode?.id) {
          return {
            ...el,
            data: { ...el.data, label: getNodeLabel(newlyAddedNode) },
          };
        } else {
          return el;
        }
      });
    });
  };

  useEffect(() => {
    if (!deleted && !isEmpty(updatedLineageData)) {
      setElementsHandle(updatedLineageData);
    }
  }, [isNodeLoading, isEditMode]);

  useEffect(() => {
    const newNodes = updatedLineageData.nodes?.filter(
      (n) =>
        !isUndefined(
          updatedLineageData.downstreamEdges?.find((d) => d.toEntity === n.id)
        ) ||
        !isUndefined(
          updatedLineageData.upstreamEdges?.find((u) => u.fromEntity === n.id)
        )
    );
    entityLineageHandler({ ...updatedLineageData, nodes: newNodes });
  }, [isEditMode]);

  useEffect(() => {
    handleUpdatedLineageNode();
  }, [updatedLineageData]);

  useEffect(() => {
    onEntitySelect();
  }, [selectedEntity]);

  useEffect(() => {
    if (selectedEdge.data?.isColumnLineage) {
      removeColumnEdge(selectedEdge, confirmDelete);
    } else {
      removeEdgeHandler(selectedEdge, confirmDelete);
    }
  }, [selectedEdge, confirmDelete]);

  useEffect(() => {
    if (
      !isEmpty(entityLineage) &&
      !isUndefined(entityLineage.entity) &&
      !deleted
    ) {
      setUpdatedLineageData(entityLineage);
      setElementsHandle(entityLineage);
    }
  }, [entityLineage]);

  if (isLoading || (nodes.length === 0 && !deleted)) {
    return <Loader />;
  }

  return deleted ? (
    getDeletedLineagePlaceholder()
  ) : (
    <div
      className={classNames('tw-relative tw-h-full tw--ml-4 tw--mr-7 tw--mt-4')}
      data-testid="lineage-container">
      <div className="tw-w-full tw-h-full" ref={reactFlowWrapper}>
        <ReactFlowProvider>
          <ReactFlow
            data-testid="react-flow-component"
            edgeTypes={customEdges}
            edges={edges}
            maxZoom={2}
            minZoom={0.5}
            nodeTypes={nodeTypes}
            nodes={nodes}
            nodesConnectable={isEditMode}
            selectNodesOnDrag={false}
            zoomOnDoubleClick={false}
            zoomOnScroll={false}
            onConnect={onConnect}
            onDragOver={onDragOver}
            onDrop={onDrop}
            onEdgesChange={onEdgesChange}
            onInit={(reactFlowInstance: ReactFlowInstance) => {
              onLoad(reactFlowInstance, nodes.length);
              setReactFlowInstance(reactFlowInstance);
            }}
            onNodeClick={(_e, node) => onNodeClick(node)}
            onNodeContextMenu={onNodeContextMenu}
            onNodeDrag={dragHandle}
            onNodeDragStart={dragHandle}
            onNodeDragStop={dragHandle}
            onNodeMouseEnter={onNodeMouseEnter}
            onNodeMouseLeave={onNodeMouseLeave}
            onNodeMouseMove={onNodeMouseMove}
            onNodesChange={onNodesChange}>
            {getCustomControlElements()}
            {getGraphBackGround()}
          </ReactFlow>
        </ReactFlowProvider>
      </div>
      {getEntityDrawer()}
      <EntityLineageSidebar newAddedNode={newAddedNode} show={isEditMode} />
      {getConfirmationModal()}
    </div>
  );
};

export default withLoader<EntityLineageProp>(Entitylineage);
