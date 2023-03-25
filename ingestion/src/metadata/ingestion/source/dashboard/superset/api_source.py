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
Superset source module
"""

import traceback
from typing import Iterable, List, Optional

from metadata.generated.schema.api.data.createChart import CreateChartRequest
from metadata.generated.schema.api.data.createDashboard import CreateDashboardRequest
from metadata.generated.schema.entity.data.chart import Chart, ChartType
from metadata.generated.schema.entity.data.table import Table
from metadata.ingestion.source.dashboard.superset.mixin import SupersetSourceMixin
from metadata.utils import fqn
from metadata.utils.helpers import get_standard_chart_type
from metadata.utils.logger import ingestion_logger

logger = ingestion_logger()


class SupersetAPISource(SupersetSourceMixin):
    """
    Superset API Source Class
    """

    def prepare(self):
        """
        Fetching all charts available in superset
        this step is done because fetch_total_charts api fetches all
        the required information which is not available in fetch_charts_with_id api
        """
        current_page = 0
        page_size = 25
        total_charts = self.client.fetch_total_charts()
        while current_page * page_size <= total_charts:
            charts = self.client.fetch_charts(current_page, page_size)
            current_page += 1
            for index in range(len(charts["result"])):
                self.all_charts[charts["ids"][index]] = charts["result"][index]

    def get_dashboards_list(self) -> Optional[List[object]]:
        """
        Get List of all dashboards
        """
        current_page = 0
        page_size = 25
        total_dashboards = self.client.fetch_total_dashboards()
        while current_page * page_size <= total_dashboards:
            dashboards = self.client.fetch_dashboards(current_page, page_size)
            current_page += 1
            for dashboard in dashboards["result"]:
                yield dashboard

    def yield_dashboard(
        self, dashboard_details: dict
    ) -> Iterable[CreateDashboardRequest]:
        """
        Method to Get Dashboard Entity
        """
        yield CreateDashboardRequest(
            name=dashboard_details["id"],
            displayName=dashboard_details["dashboard_title"],
            description="",
            dashboardUrl=dashboard_details["url"],
            charts=[
                fqn.build(
                    self.metadata,
                    entity_type=Chart,
                    service_name=self.context.dashboard_service.fullyQualifiedName.__root__,
                    chart_name=chart.name.__root__,
                )
                for chart in self.context.charts
            ],
            service=self.context.dashboard_service.fullyQualifiedName.__root__,
        )

    def _get_datasource_fqn_for_lineage(self, chart_json, db_service_name):
        return (
            self._get_datasource_fqn(chart_json.get("datasource_id"), db_service_name)
            if chart_json.get("datasource_id")
            else None
        )

    def yield_dashboard_chart(
        self, dashboard_details: dict
    ) -> Optional[Iterable[CreateChartRequest]]:
        """
        Metod to fetch charts linked to dashboard
        """
        for chart_id in self._get_charts_of_dashboard(dashboard_details):
            chart_json = self.all_charts.get(chart_id)
            if not chart_json:
                logger.warning(f"chart details for id: {chart_id} not found, skipped")
                continue
            chart = CreateChartRequest(
                name=chart_json["id"],
                displayName=chart_json.get("slice_name"),
                description=chart_json.get("description"),
                chartType=get_standard_chart_type(
                    chart_json.get("viz_type", ChartType.Other.value)
                ),
                chartUrl=chart_json.get("url"),
                service=self.context.dashboard_service.fullyQualifiedName.__root__,
            )
            yield chart

    def _get_datasource_fqn(
        self, datasource_id: str, db_service_name: str
    ) -> Optional[str]:
        if db_service_name:
            try:
                datasource_json = self.client.fetch_datasource(datasource_id)
                database_json = self.client.fetch_database(
                    datasource_json["result"]["database"]["id"]
                )
                dataset_fqn = fqn.build(
                    self.metadata,
                    entity_type=Table,
                    table_name=datasource_json["result"]["table_name"],
                    schema_name=datasource_json["result"]["schema"],
                    database_name=database_json["result"]["parameters"]["database"],
                    service_name=db_service_name,
                )
                return dataset_fqn
            except KeyError as err:
                logger.debug(traceback.format_exc())
                logger.warning(
                    f"Failed to fetch Datasource with id [{datasource_id}]: {err}"
                )
        return None
