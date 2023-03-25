package org.openmetadata.service.elasticsearch;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.openmetadata.schema.type.EntityReference;
import org.openmetadata.schema.type.TagLabel;

public final class ElasticSearchIndexUtils {

  private ElasticSearchIndexUtils() {}

  public static List<String> parseFollowers(List<EntityReference> followersRef) {
    if (followersRef == null) {
      return Collections.emptyList();
    }
    return followersRef.stream().map(item -> item.getId().toString()).collect(Collectors.toList());
  }

  public static void removeNonIndexableFields(Map<String, Object> doc, List<String> fields) {
    for (String key : fields) {
      doc.remove(key);
    }
  }

  public static List<TagLabel> parseTags(List<TagLabel> tags) {
    if (tags == null) {
      return Collections.emptyList();
    }
    return tags;
  }
}
