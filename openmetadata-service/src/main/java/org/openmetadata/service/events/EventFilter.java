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

package org.openmetadata.service.events;

import java.util.*;
import java.util.concurrent.ForkJoinPool;
import javax.ws.rs.container.ContainerRequestContext;
import javax.ws.rs.container.ContainerResponseContext;
import javax.ws.rs.container.ContainerResponseFilter;
import javax.ws.rs.core.UriInfo;
import javax.ws.rs.ext.Provider;
import lombok.extern.slf4j.Slf4j;
import org.jdbi.v3.core.Jdbi;
import org.openmetadata.service.OpenMetadataApplicationConfig;
import org.openmetadata.service.security.JwtFilter;
import org.openmetadata.service.util.ParallelStreamUtil;

@Slf4j
@Provider
public class EventFilter implements ContainerResponseFilter {
  private static final List<String> AUDITABLE_METHODS = Arrays.asList("POST", "PUT", "PATCH", "DELETE");
  private static final int FORK_JOIN_POOL_PARALLELISM = 20;
  private final ForkJoinPool forkJoinPool;
  private final List<EventHandler> eventHandlers;

  public EventFilter(OpenMetadataApplicationConfig config, Jdbi jdbi) {
    this.forkJoinPool = new ForkJoinPool(FORK_JOIN_POOL_PARALLELISM);
    this.eventHandlers = new ArrayList<>();
    registerEventHandlers(config, jdbi);
  }

  private void registerEventHandlers(OpenMetadataApplicationConfig config, Jdbi jdbi) {
    try {
      Set<String> eventHandlerClassNames =
          new HashSet<>(config.getEventHandlerConfiguration().getEventHandlerClassNames());
      for (String eventHandlerClassName : eventHandlerClassNames) {
        @SuppressWarnings("unchecked")
        EventHandler eventHandler =
            ((Class<EventHandler>) Class.forName(eventHandlerClassName)).getConstructor().newInstance();
        eventHandler.init(config, jdbi);
        eventHandlers.add(eventHandler);
        LOG.info("Added event handler {}", eventHandlerClassName);
      }
    } catch (Exception e) {
      LOG.info("Exception ", e);
    }
  }

  @Override
  public void filter(ContainerRequestContext requestContext, ContainerResponseContext responseContext) {
    int responseCode = responseContext.getStatus();
    String method = requestContext.getMethod();
    if ((responseCode < 200 || responseCode > 299) || (!AUDITABLE_METHODS.contains(method))) {
      return;
    }
    eventHandlers
        .parallelStream()
        .forEach(
            (eventHandler) -> {
              UriInfo uriInfo = requestContext.getUriInfo();
              if (JwtFilter.EXCLUDED_ENDPOINTS.stream().noneMatch(endpoint -> uriInfo.getPath().contains(endpoint))) {
                ParallelStreamUtil.runAsync(() -> eventHandler.process(requestContext, responseContext), forkJoinPool);
              }
            });
  }
}
