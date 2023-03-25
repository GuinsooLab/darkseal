package org.openmetadata.service.elasticsearch;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.openmetadata.schema.entity.teams.Team;
import org.openmetadata.service.Entity;
import org.openmetadata.service.util.JsonUtils;

public class TeamIndex implements ElasticSearchIndex {
  final Team team;
  final List<String> excludeFields = List.of("owns", "changeDescription");

  public TeamIndex(Team team) {
    this.team = team;
  }

  public Map<String, Object> buildESDoc() {
    if (team.getDisplayName() == null) {
      team.setDisplayName(team.getName());
    }
    Map<String, Object> doc = JsonUtils.getMap(team);
    ElasticSearchIndexUtils.removeNonIndexableFields(doc, excludeFields);
    List<ElasticSearchSuggest> suggest = new ArrayList<>();
    suggest.add(ElasticSearchSuggest.builder().input(team.getName()).weight(5).build());
    suggest.add(ElasticSearchSuggest.builder().input(team.getDisplayName()).weight(10).build());
    doc.put("suggest", suggest);
    doc.put("entityType", Entity.TEAM);
    return doc;
  }
}
