package org.openmetadata.core.util;

import java.util.HashMap;
import java.util.Map;
import org.openmetadata.catalog.type.Include;
import org.openmetadata.core.entity.Entity;

public class ListFilter {
  private final Include include;
  Map<String, String> queryParams = new HashMap<>();

  public ListFilter() {
    this(Include.NON_DELETED);
  }

  public ListFilter(Include include) {
    this.include = include;
  }

  public ListFilter addQueryParam(String name, String value) {
    queryParams.put(name, value);
    return this;
  }

  public String getQueryParam(String name) {
    if (name.equals("include")) {
      return include.value();
    }
    return queryParams.get(name);
  }

  public String getCondition() {
    return getCondition(null);
  }

  public String getCondition(String tableName) {
    String condition = getIncludeCondition(tableName);
    condition = addCondition(condition, getDatabaseCondition(tableName));
    condition = addCondition(condition, getServiceCondition(tableName));
    condition = addCondition(condition, getParentCondition(tableName));
    return condition.isEmpty() ? "WHERE TRUE" : "WHERE " + condition;
  }

  public String getIncludeCondition(String tableName) {
    String columnName = tableName == null ? "deleted" : tableName + ".deleted";
    if (include == Include.NON_DELETED) {
      return columnName + " = FALSE";
    }
    if (include == Include.DELETED) {
      return columnName + " = TRUE";
    }
    return "";
  }

  public String getDatabaseCondition(String tableName) {
    String database = queryParams.get("database");
    return database == null ? "" : getFqnPrefixCondition(tableName, escape(database));
  }

  public String getServiceCondition(String tableName) {
    String service = queryParams.get("service");
    return service == null ? "" : getFqnPrefixCondition(tableName, escape(service));
  }

  public String getParentCondition(String tableName) {
    String parentFqn = queryParams.get("parent");
    return parentFqn == null ? "" : getFqnPrefixCondition(tableName, escape(parentFqn));
  }

  private String getFqnPrefixCondition(String tableName, String fqnPrefix) {
    return tableName == null
        ? String.format("fullyQualifiedName LIKE '%s%s%%'", fqnPrefix, Entity.SEPARATOR)
        : String.format("%s.fullyQualifiedName LIKE '%s%s%%'", tableName, fqnPrefix, Entity.SEPARATOR);
  }

  private String addCondition(String condition1, String condition2) {
    if (condition1.isEmpty()) {
      return condition2;
    }
    if (condition2.isEmpty()) {
      return condition1;
    }
    return condition1 + " AND " + condition2;
  }

  private String escape(String name) {
    return name.replace("'", "''");
  }
}
