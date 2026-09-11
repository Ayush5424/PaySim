package com.Project.UPI_Simulation.exception;

import com.Project.UPI_Simulation.config.CorrelationIdFilter;
import com.Project.UPI_Simulation.dto.ApiResponse;
import com.Project.UPI_Simulation.dto.ErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Object> handleValidationException(MethodArgumentNotValidException ex, HttpServletRequest request) {
        Map<String, String> errors = new HashMap<>();
        for (FieldError error : ex.getBindingResult().getFieldErrors()) {
            errors.put(error.getField(), error.getDefaultMessage());
        }

        String firstMessage = errors.values().stream().findFirst().orElse("Validation failed");

        ErrorResponse errorResponse = ErrorResponse.builder()
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.BAD_REQUEST.value())
                .error("VALIDATION_FAILED")
                .message(firstMessage)
                .path(request.getRequestURI())
                .requestId(MDC.get(CorrelationIdFilter.MDC_KEY))
                .validationErrors(errors)
                .build();

        // Also return legacy ApiResponse for client compatibility
        return new ResponseEntity<>(
                new ApiResponse<>("FAILED", firstMessage, errorResponse),
                HttpStatus.BAD_REQUEST
        );
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ApiResponse<Object>> handleConstraintViolation(ConstraintViolationException ex, HttpServletRequest request) {
        String message = ex.getConstraintViolations().stream()
                .findFirst()
                .map(v -> v.getMessage())
                .orElse("Validation failed");

        return new ResponseEntity<>(
                new ApiResponse<>("FAILED", message, null),
                HttpStatus.BAD_REQUEST
        );
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiResponse<Object>> handleDataIntegrity(DataIntegrityViolationException ex, HttpServletRequest request) {
        log.error("Data integrity violation at path {}: {}", request.getRequestURI(), ex.getMessage());
        ApiResponse<Object> response = new ApiResponse<>(
                "FAILED",
                "Duplicate or invalid data violates database constraints",
                null
        );
        return new ResponseEntity<>(response, HttpStatus.CONFLICT);
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<ApiResponse<Object>> handleRuntimeException(RuntimeException ex, HttpServletRequest request) {
        log.warn("Runtime exception at path {}: {}", request.getRequestURI(), ex.getMessage());

        HttpStatus status = HttpStatus.BAD_REQUEST;
        String message = ex.getMessage() != null ? ex.getMessage() : "Request processing failed";

        if (message.toLowerCase().contains("authentication required") || message.toLowerCase().contains("invalid credentials") || message.toLowerCase().contains("session expired")) {
            status = HttpStatus.UNAUTHORIZED;
        } else if (message.toLowerCase().contains("not allowed") || message.toLowerCase().contains("unauthorized")) {
            status = HttpStatus.FORBIDDEN;
        } else if (message.toLowerCase().contains("not found")) {
            status = HttpStatus.NOT_FOUND;
        } else if (message.toLowerCase().contains("idempotency-key is currently processing") || message.toLowerCase().contains("duplicate")) {
            status = HttpStatus.CONFLICT;
        } else if (message.toLowerCase().contains("insufficient balance")) {
            status = HttpStatus.UNPROCESSABLE_ENTITY;
        }

        ApiResponse<Object> response = new ApiResponse<>(
                "FAILED",
                message,
                null
        );
        return new ResponseEntity<>(response, status);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Object>> handleGeneralException(Exception ex, HttpServletRequest request) {
        log.error("Unhandled exception at path {}: ", request.getRequestURI(), ex);
        ApiResponse<Object> response = new ApiResponse<>(
                "FAILED",
                "Internal server error",
                null
        );
        return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}

