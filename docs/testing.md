# Testing

## Test Profile
- H2 in-memory DB (PostgreSQL mode)
- Flyway disabled (JPA create-drop)
- Redis/Kafka: graceful fallback on connection errors

## Test Classes
- AuthServiceTest - signup, login, duplicate detection, lockout
- IdempotencyTest - idempotency prevents double debit
- PaymentConcurrencyTest - 20 concurrent threads race condition
- PaymentControllerIntegrationTest - end-to-end MockMvc flow

## Run Tests
./mvnw test
