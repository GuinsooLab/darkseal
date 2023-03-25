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

package org.openmetadata.service.util;

import com.google.common.base.Stopwatch;
import java.util.concurrent.Callable;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.Executor;
import java.util.concurrent.TimeUnit;
import java.util.function.Supplier;
import lombok.extern.slf4j.Slf4j;

@Slf4j
public final class ParallelStreamUtil {
  private ParallelStreamUtil() {}

  public static <T> T execute(Supplier<T> supplier, Executor executor) {
    Stopwatch stopwatch = Stopwatch.createStarted();
    LOG.debug("execute start");

    try {
      CompletableFuture<T> resultFuture = CompletableFuture.supplyAsync(supplier, executor);
      return resultFuture.get();
    } catch (InterruptedException e) {
      throw new RuntimeException(e);
    } catch (ExecutionException e) {
      handleExecutionException(e);
      // shouldn't reach here
      throw new IllegalStateException("Shouldn't reach here");
    } finally {
      LOG.debug("execute complete - elapsed: {} ms", stopwatch.elapsed(TimeUnit.MILLISECONDS));
      stopwatch.stop();
    }
  }

  public static <T> T executeWithTimeout(int timeoutInSeconds, Supplier<T> supplier, Executor executor) {
    Stopwatch stopwatch = Stopwatch.createStarted();
    LOG.debug("execute start");

    try {
      CompletableFuture<T> resultFuture = CompletableFuture.supplyAsync(supplier, executor);
      return resultFuture.get(timeoutInSeconds, TimeUnit.SECONDS);
    } catch (ExecutionException e) {
      handleExecutionException(e);
      // shouldn't reach here
      throw new IllegalStateException("Shouldn't reach here");
    } catch (Exception e) {
      throw new RuntimeException(e);
    } finally {
      LOG.debug("execute complete - elapsed: {} ms", stopwatch.elapsed(TimeUnit.MILLISECONDS));
      stopwatch.stop();
    }
  }

  public static void runAsync(Callable<Void> callable, Executor executor) {
    Stopwatch stopwatch = Stopwatch.createStarted();
    LOG.debug("runAsync start");
    CompletableFuture<Void> res =
        CompletableFuture.supplyAsync(
            () -> {
              try {
                return callable.call();
              } catch (Exception ex) {
                throw new RuntimeException(ex);
              }
            },
            executor);

    res.whenComplete(
        (r, th) -> {
          // LOG any exceptions
          if (th != null) {
            LOG.error("Got exception while running async task", th.getCause());
          }
          LOG.debug("runAsync complete - elapsed: {} ms", stopwatch.elapsed(TimeUnit.MILLISECONDS));
          stopwatch.stop();
        });
  }

  private static void handleExecutionException(ExecutionException e) {
    Throwable t = e.getCause();
    if (t != null) {
      if (t instanceof RuntimeException) {
        throw (RuntimeException) t;
      } else {
        throw new RuntimeException(t);
      }
    } else {
      throw new RuntimeException(e);
    }
  }
}
