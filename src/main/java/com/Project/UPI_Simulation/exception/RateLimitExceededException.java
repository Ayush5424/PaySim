package com.Project.UPI_Simulation.exception;

import org.springframework.http.HttpStatus;

public class RateLimitExceededException extends AppException {

    public RateLimitExceededException(String message) {
        super(HttpStatus.TOO_MANY_REQUESTS, "RATE_LIMIT_EXCEEDED", message);
    }
}
