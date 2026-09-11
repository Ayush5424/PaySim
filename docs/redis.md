# Redis Usage

## Idempotency Cache
Key pattern: idempotency:{idempotencyKey}
Value: JSON response body
TTL: 24 hours

## Rate Limiting
Key pattern: rate:{userId}:{endpoint}
Used for per-user request rate limiting.

## Fallback
All Redis operations are wrapped in try/catch. If Redis is unavailable,
idempotency falls back to PostgreSQL only. Rate limiting uses in-memory bucket.
