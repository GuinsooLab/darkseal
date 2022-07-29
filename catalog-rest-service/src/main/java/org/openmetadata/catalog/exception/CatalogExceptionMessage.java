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

package org.openmetadata.catalog.exception;

import java.security.Principal;
import java.util.UUID;

public final class CatalogExceptionMessage {
  public static final String ENTITY_ALREADY_EXISTS = "Entity already exists";
  public static final String FERNET_KEY_NULL = "Fernet key is null";
  public static final String FIELD_NOT_TOKENIZED = "Field is not tokenized";
  public static final String FIELD_ALREADY_TOKENIZED = "Field is already tokenized";
  public static final String INVALID_ENTITY_LINK = "Entity link must have both {arrayFieldName} and {arrayFieldValue}";

  private CatalogExceptionMessage() {}

  public static String entityNotFound(String entityType, String id) {
    return String.format("%s instance for %s not found", entityType, id);
  }

  public static String entityNotFound(String entityType, UUID id) {
    return entityNotFound(entityType, id.toString());
  }

  public static String entitiesNotFound(String entityType) {
    return String.format("%s instances not found", entityType);
  }

  public static String readOnlyAttribute(String entityType, String attribute) {
    return String.format("%s attribute %s can't be modified", entityType, attribute);
  }

  public static String invalidName(String name) {
    return String.format("Invalid name %s", name);
  }

  public static String invalidField(String field) {
    return String.format("Invalid field name %s", field);
  }

  public static String entityTypeNotFound(String entityType) {
    return String.format("Entity type %s not found", entityType);
  }

  public static String entityTypeNotSupported(String entityType) {
    return String.format("Entity type %s not supported", entityType);
  }

  public static String deletedUser(UUID id) {
    return String.format("User %s is deleted", id);
  }

  public static String userAlreadyPartOfTeam(String userName, String teamName) {
    return String.format("User '%s' is already part of the team '%s'", userName, teamName);
  }

  public static String invalidColumnFQN(String fqn) {
    return String.format("Invalid fully qualified column name %s", fqn);
  }

  public static String entityVersionNotFound(String entityType, String id, Double version) {
    return String.format("%s instance for %s and version %s not found", entityType, id, version);
  }

  public static String invalidServiceEntity(String serviceType, String entityType, String expected) {
    return String.format("Invalid service type `%s` for %s. Expected %s.", serviceType, entityType, expected);
  }

  public static String glossaryTermMismatch(String parentId, String glossaryId) {
    return String.format(
        "Invalid queryParameters - glossary term `parent` %s is not in the `glossary` %s", parentId, glossaryId);
  }

  public static String notAdmin(Principal principal) {
    return notAdmin(principal.getName());
  }

  public static String notAdmin(String name) {
    return String.format("Principal: CatalogPrincipal{name='%s'} is not admin", name);
  }

  public static String noPermission(Principal principal) {
    return noPermission(principal.getName());
  }

  public static String noPermission(String name) {
    return String.format("Principal: CatalogPrincipal{name='%s'} does not have permissions", name);
  }

  public static String noPermission(Principal principal, String operation) {
    return noPermission(principal.getName(), operation);
  }

  public static String noPermission(String name, String operation) {
    return String.format("Principal: CatalogPrincipal{name='%s'} does not have permissions to %s", name, operation);
  }

  public static String invalidPolicyOperationNull(String rule, String policy) {
    return String.format("Found invalid rule %s within policy %s. Please ensure operation is non-null", rule, policy);
  }

  public static String invalidPolicyDuplicateOperation(String operation, String policy) {
    return String.format(
        "Found multiple rules with operation %s within policy %s. Please ensure that operation across all rules within the policy are distinct",
        operation, policy);
  }

  public static String entityIsNotEmpty(String entityType) {
    return String.format("%s is not empty", entityType);
  }

  public static String invalidEntity(String entity) {
    return String.format("Invalid entity %s", entity);
  }

  public static String unknownCustomField(String fieldName) {
    return String.format("Unknown custom field %s", fieldName);
  }

  public static String jsonValidationError(String fieldName, String validationMessages) {
    return String.format("Custom field %s has invalid JSON %s", fieldName, validationMessages);
  }
}
