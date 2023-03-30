package org.openmetadata.service.elasticsearch;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.openmetadata.schema.entity.data.Topic;
import org.openmetadata.schema.type.TagLabel;
import org.openmetadata.service.Entity;
import org.openmetadata.service.util.JsonUtils;

public class TopicIndex implements ElasticSearchIndex {
  final List<String> excludeTopicFields = List.of("sampleData", "changeDescription", "messageSchema");
  final Topic topic;

  public TopicIndex(Topic topic) {
    this.topic = topic;
  }

  public Map<String, Object> buildESDoc() {
    Map<String, Object> doc = JsonUtils.getMap(topic);
    List<TagLabel> tags = new ArrayList<>();
    List<ElasticSearchSuggest> suggest = new ArrayList<>();
    List<ElasticSearchSuggest> serviceSuggest = new ArrayList<>();
    suggest.add(ElasticSearchSuggest.builder().input(topic.getFullyQualifiedName()).weight(5).build());
    suggest.add(ElasticSearchSuggest.builder().input(topic.getName()).weight(10).build());
    serviceSuggest.add(ElasticSearchSuggest.builder().input(topic.getService().getName()).weight(5).build());
    ElasticSearchIndexUtils.removeNonIndexableFields(doc, excludeTopicFields);
    if (topic.getTags() != null) {
      tags.addAll(topic.getTags());
    }
    ParseTags parseTags = new ParseTags(tags);
    doc.put("displayName", topic.getDisplayName() != null ? topic.getDisplayName() : topic.getName());
    doc.put("tags", parseTags.tags);
    doc.put("tier", parseTags.tierTag);
    doc.put("followers", ElasticSearchIndexUtils.parseFollowers(topic.getFollowers()));
    doc.put("suggest", suggest);
    doc.put("service_suggest", serviceSuggest);
    doc.put("entityType", Entity.TOPIC);
    doc.put("serviceType", topic.getServiceType());
    doc.put("schemaText", topic.getMessageSchema() != null ? topic.getMessageSchema().getSchemaText() : null);
    doc.put("schemaType", topic.getMessageSchema() != null ? topic.getMessageSchema().getSchemaType() : null);
    return doc;
  }
}
