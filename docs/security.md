# Security

## Authentication
JWT Bearer tokens (access 15min + refresh 7d).

## Rate Limiting
In-memory per-user rate limiting configurable via application.properties.

## Input Validation
Jakarta Bean Validation on all DTOs. GlobalExceptionHandler returns structured errors.

## Passwords and PINs
BCrypt strength 12. Raw PIN never logged.
