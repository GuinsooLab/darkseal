package org.openmetadata.catalog.events;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;
import lombok.extern.slf4j.Slf4j;
import org.openmetadata.catalog.events.errors.RetriableException;
import org.openmetadata.catalog.resources.events.EventResource.ChangeEventList;
import org.openmetadata.catalog.type.ChangeEvent;
import org.openmetadata.catalog.type.EventFilter;
import org.openmetadata.catalog.type.EventType;

@Slf4j
public abstract class AbstractEventPublisher implements EventPublisher {
  // Backoff timeout in seconds. Delivering events is retried 5 times.
  private static final int BACKOFF_NORMAL = 0;
  private static final int BACKOFF_3_SECONDS = 3 * 1000;
  private static final int BACKOFF_30_SECONDS = 30 * 1000;
  private static final int BACKOFF_5_MINUTES = 5 * 60 * 1000;
  private static final int BACKOFF_1_HOUR = 60 * 60 * 1000;
  private static final int BACKOFF_24_HOUR = 24 * 60 * 60 * 1000;

  private int currentBackoffTime = BACKOFF_NORMAL;
  private final List<ChangeEvent> batch = new ArrayList<>();
  private final ConcurrentHashMap<EventType, List<String>> filter = new ConcurrentHashMap<>();
  private final int batchSize;

  protected AbstractEventPublisher(int batchSize, List<EventFilter> filters) {
    filters.forEach(f -> filter.put(f.getEventType(), f.getEntities()));
    this.batchSize = batchSize;
  }

  @Override
  public void onEvent(EventPubSub.ChangeEventHolder changeEventHolder, long sequence, boolean endOfBatch)
      throws Exception {
    // Ignore events that don't match the webhook event filters
    ChangeEvent changeEvent = changeEventHolder.get();
    if (!filter.isEmpty()) {
      List<String> entities = filter.get(changeEvent.getEventType());
      if (entities == null || (!entities.get(0).equals("*") && !entities.contains(changeEvent.getEntityType()))) {
        return;
      }
    }

    // Batch until either the batch has ended or batch size has reached the max size
    batch.add(changeEventHolder.get());
    if (!endOfBatch && batch.size() < batchSize) {
      return;
    }

    ChangeEventList list = new ChangeEventList(batch, null, null, batch.size());
    try {
      publish(list);
      batch.clear();
    } catch (RetriableException ex) {
      setNextBackOff();
      LOG.error("Failed to publish event {} due to {}, will try again in {} ms", changeEvent, ex, currentBackoffTime);
      Thread.sleep(currentBackoffTime);
    } catch (Exception e) {
      LOG.error(
          "Failed to publish event type {} for entity {}", changeEvent.getEventType(), changeEvent.getEntityType());
      LOG.error(e.getMessage(), e);
    }
  }

  private void setNextBackOff() {
    if (currentBackoffTime == BACKOFF_NORMAL) {
      currentBackoffTime = BACKOFF_3_SECONDS;
    } else if (currentBackoffTime == BACKOFF_3_SECONDS) {
      currentBackoffTime = BACKOFF_30_SECONDS;
    } else if (currentBackoffTime == BACKOFF_30_SECONDS) {
      currentBackoffTime = BACKOFF_5_MINUTES;
    } else if (currentBackoffTime == BACKOFF_5_MINUTES) {
      currentBackoffTime = BACKOFF_1_HOUR;
    } else if (currentBackoffTime == BACKOFF_1_HOUR) {
      currentBackoffTime = BACKOFF_24_HOUR;
    }
  }
}
