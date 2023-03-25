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

package org.openmetadata.service.security;

import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import lombok.Getter;

public class AuthenticationException extends RuntimeException {
  @Getter private final transient Response response;

  public AuthenticationException(String msg) {
    super(msg);
    response =
        Response.status(Response.Status.UNAUTHORIZED)
            .entity(convertToErrorResponseMessage(msg))
            .type(MediaType.APPLICATION_JSON_TYPE)
            .build();
  }

  public AuthenticationException(String msg, Throwable cause) {
    super(msg, cause);
    response =
        Response.status(Response.Status.UNAUTHORIZED)
            .entity(convertToErrorResponseMessage(msg))
            .type(MediaType.APPLICATION_JSON_TYPE)
            .build();
  }

  private static ErrorResponse convertToErrorResponseMessage(String msg) {
    return new ErrorResponse(msg);
  }

  private static class ErrorResponse {
    /** Response message. */
    @Getter private final String responseMessage;

    ErrorResponse(String responseMessage) {
      this.responseMessage = responseMessage;
    }
  }
}
