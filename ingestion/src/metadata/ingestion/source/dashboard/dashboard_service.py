#  Copyright 2021 Collate
#  Licensed under the Apache License, Version 2.0 (the "License");
#  you may not use this file except in compliance with the License.
#  You may obtain a copy of the License at
#  http://www.apache.org/licenses/LICENSE-2.0
#  Unless required by applicable law or agreed to in writing, software
#  distributed under the License is distributed on an "AS IS" BASIS,
#  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#  See the License for the specific language governing permissions and
#  limitations under the License.
"""
Base class for ingesting database services
"""
import traceback
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Any, Iterable, List, Optional

from pydantic import BaseModel

from metadata.generated.schema.api.data.createChart import CreateChartRequest
from metadata.generated.schema.api.data.createDashboard import CreateDashboardRequest
from metadata.generated.schema.api.lineage.addLineage import AddLineageRequest
from metadata.generated.schema.api.teams.createUser import CreateUserRequest
from metadata.generated.schema.entity.data.chart import Chart
from metadata.generated.schema.entity.data.dashboard import Dashboard
from metadata.generated.schema.entity.services.connections.metadata.openMetadataConnection import (
    OpenMetadataConnection,
)
from metadata.generated.schema.entity.services.dashboardService import (
    DashboardConnection,
    DashboardService,
)
from metadata.generated.schema.metadataIngestion.dashboardServiceMetadataPipeline import (
    DashboardServiceMetadataPipeline,
)
from metadata.generated.schema.metadataIngestion.workflow import (
    Source as WorkflowSource,
)
from metadata.generated.schema.type.usageRequest import UsageRequest
from metadata.ingestion.api.source import Source, SourceStatus
from metadata.ingestion.api.topology_runner import TopologyRunnerMixin
from metadata.ingestion.models.ometa_tag_category import OMetaTagAndCategory
from metadata.ingestion.models.topology import (
    NodeStage,
    ServiceTopology,
    TopologyNode,
    create_source_context,
)
from metadata.ingestion.ometa.ometa_api import OpenMetadata
from metadata.utils.connections import get_connection, test_connection
from metadata.utils.filters import filter_by_dashboard
from metadata.utils.logger import ingestion_logger

logger = ingestion_logger()


class DashboardUsage(BaseModel):
    """
    Wrapper to handle type at the sink
    """

    dashboard: Dashboard
    usage: UsageRequest


class DashboardServiceTopology(ServiceTopology):
    """
    Defines the hierarchy in Dashboard Services.
    service -> dashboard -> charts.

    We could have a topology validator. We can only consume
    data that has been produced by any parent node.
    """

    root = TopologyNode(
        producer="get_services",
        stages=[
            NodeStage(
                type_=DashboardService,
                context="dashboard_service",
                processor="yield_dashboard_service",
            ),
            NodeStage(
                type_=OMetaTagAndCategory,
                context="tags",
                processor="yield_tag",
                ack_sink=False,
                nullable=True,
            ),
        ],
        children=["dashboard"],
    )
    dashboard = TopologyNode(
        producer="get_dashboard",
        stages=[
            NodeStage(
                type_=Chart,
                context="charts",
                processor="yield_dashboard_chart",
                consumer=["dashboard_service"],
                nullable=True,
                cache_all=True,
                clear_cache=True,
            ),
            NodeStage(
                type_=CreateUserRequest,
                context="owner",
                processor="yield_owner",
                nullable=True,
            ),
            NodeStage(
                type_=Dashboard,
                context="dashboard",
                processor="yield_dashboard",
                consumer=["dashboard_service"],
            ),
            NodeStage(
                type_=AddLineageRequest,
                context="lineage",
                processor="yield_dashboard_lineage",
                consumer=["dashboard_service"],
                ack_sink=False,
                nullable=True,
            ),
            NodeStage(
                type_=UsageRequest,
                context="usage",
                processor="yield_dashboard_usage",
                consumer=["dashboard_service"],
                ack_sink=False,
                nullable=True,
            ),
        ],
    )


@dataclass
class DashboardSourceStatus(SourceStatus):
    """
    Reports the source status after ingestion
    """

    def scanned(self, record: str) -> None:
        self.success.append(record)
        logger.info(f"Scanned: {record}")

    def filter(self, record: str, err: str) -> None:
        self.filtered.append(record)
        logger.warning(f"Filtered {record}: {err}")


class DashboardServiceSource(TopologyRunnerMixin, Source, ABC):
    """
    Base class for Database Services.
    It implements the topology and context.
    """

    @abstractmethod
    def yield_dashboard(
        self, dashboard_details: Any
    ) -> Iterable[CreateDashboardRequest]:
        """
        Method to Get Dashboard Entity
        """

    @abstractmethod
    def yield_dashboard_lineage_details(
        self, dashboard_details: Any
    ) -> Optional[Iterable[AddLineageRequest]]:
        """
        Get lineage between dashboard and data sources
        """

    @abstractmethod
    def yield_dashboard_chart(
        self, dashboard_details: Any
    ) -> Optional[Iterable[CreateChartRequest]]:
        """
        Method to fetch charts linked to dashboard
        """

    @abstractmethod
    def get_dashboards_list(self) -> Optional[List[Any]]:
        """
        Get List of all dashboards
        """

    @abstractmethod
    def get_dashboard_name(self, dashboard_details: Any) -> str:
        """
        Get Dashboard Name
        """

    @abstractmethod
    def get_dashboard_details(self, dashboard: Any) -> Any:
        """
        Get Dashboard Details
        """

    def yield_dashboard_lineage(
        self, dashboard_details: Any
    ) -> Optional[Iterable[AddLineageRequest]]:
        """
        Yields lineage if config is enabled
        """
        if self.source_config.dbServiceName:
            yield from self.yield_dashboard_lineage_details(dashboard_details)

    def yield_tag(self, *args, **kwargs) -> Optional[Iterable[OMetaTagAndCategory]]:
        """
        Method to fetch dashboard tags
        """
        return  # Dashboard does not support fetching tags except Tableau

    def yield_owner(self, *args, **kwargs) -> Optional[Iterable[CreateUserRequest]]:
        """
        Method to fetch dashboard owner
        """
        return  # Dashboard does not support fetching owner details except Tableau

    def yield_dashboard_usage(
        self, *args, **kwargs
    ) -> Optional[Iterable[DashboardUsage]]:
        """
        Method to pick up dashboard usage data
        """
        return  # Dashboard usage currently only available for Looker

    status: DashboardSourceStatus
    source_config: DashboardServiceMetadataPipeline
    config: WorkflowSource
    metadata: OpenMetadata
    # Big union of types we want to fetch dynamically
    service_connection: DashboardConnection.__fields__["config"].type_

    topology = DashboardServiceTopology()
    context = create_source_context(topology)

    @abstractmethod
    def __init__(
        self,
        config: WorkflowSource,
        metadata_config: OpenMetadataConnection,
    ):
        super().__init__()
        self.config = config
        self.metadata_config = metadata_config
        self.metadata = OpenMetadata(metadata_config)
        self.service_connection = self.config.serviceConnection.__root__.config
        self.source_config: DashboardServiceMetadataPipeline = (
            self.config.sourceConfig.config
        )
        self.connection = get_connection(self.service_connection)
        self.test_connection()
        self.status = DashboardSourceStatus()

        self.client = self.connection.client
        self.metadata_client = OpenMetadata(self.metadata_config)

    def get_status(self) -> SourceStatus:
        return self.status

    def close(self):
        pass

    def get_services(self) -> Iterable[WorkflowSource]:
        yield self.config

    def yield_dashboard_service(self, config: WorkflowSource):
        yield self.metadata.get_create_service_from_source(
            entity=DashboardService, config=config
        )

    def get_dashboard(self) -> Any:
        for dashboard in self.get_dashboards_list():

            try:
                dashboard_details = self.get_dashboard_details(dashboard)
            except Exception as err:
                logger.error(
                    f"Cannot extract dashboard details from {dashboard} - {err}"
                )
                logger.debug(traceback.format_exc())
                continue

            if filter_by_dashboard(
                self.source_config.dashboardFilterPattern,
                self.get_dashboard_name(dashboard_details),
            ):
                self.status.filter(
                    self.get_dashboard_name(dashboard_details),
                    "Dashboard Pattern not Allowed",
                )
                continue
            yield dashboard_details

    def test_connection(self) -> None:
        test_connection(self.connection)

    def prepare(self):
        pass
