# PaySim — Production-Level Application Requirements

## 1. Project Overview

PaySim is a production-oriented UPI payment simulation platform built to demonstrate how a real-world payment backend handles authentication, account management, secure transactions, concurrency, idempotency, failures, event processing, observability, testing, and deployment.

The application must be designed as a reliable backend system rather than a simple CRUD application.

### Primary Goals

* Build a secure payment simulation platform.
* Support UPI ID and QR-based payments.
* Maintain accurate account balances.
* Prevent duplicate transactions.
* Handle concurrent payment requests safely.
* Provide transaction history and receipts.
* Introduce event-driven processing.
* Add caching and rate limiting.
* Provide strong observability.
* Automate testing and deployment.
* Make the complete application publicly deployable.
* Avoid dependence on third-party payment, OTP, email, SMS, or notification services.
* Keep infrastructure reproducible using Docker.

---

# 2. Technology Requirements

## Backend

* Java 21
* Spring Boot
* Spring Security
* JWT
* Spring Data JPA / Hibernate
* PostgreSQL
* Redis
* Apache Kafka
* Maven
* Docker

## Frontend

* React
* TypeScript
* Modern CSS
* Responsive UI

## Development & Operations

* Git
* GitHub
* GitHub Actions
* Docker Compose
* REST APIs
* OpenAPI / Swagger
* Spring Boot Actuator
* Structured logging

GitHub remains the primary source-code repository.

GitLab is not required.

---

# 3. Core Architecture

The initial application should remain a modular Spring Boot application rather than immediately splitting into multiple microservices.

Target architecture:

```text
                    Internet
                       |
                       v
                 PaySim Frontend
                       |
                       v
                Spring Boot API
                       |
        +--------------+--------------+
        |              |              |
        v              v              v
    PostgreSQL       Redis          Kafka
    Source of        Cache &        Event
    Truth            Controls       Streaming
                       |
                       v
                 Background
                  Consumers
```

PostgreSQL must remain the source of truth for financial/account data.

Redis must never be treated as the authoritative source for account balances.

Kafka must be used for asynchronous events and secondary processing, not as a replacement for the transactional payment database.

---

# PHASE 0 — Project Foundation

## Objective

Prepare the repository and development architecture for production-oriented development.

### Requirements

* Organize backend and frontend cleanly.
* Introduce environment-specific configuration.
* Add `.env.example`.
* Never commit secrets.
* Configure PostgreSQL connection through environment variables.
* Configure Redis through environment variables.
* Configure Kafka through environment variables.
* Configure CORS properly.
* Configure application profiles:

    * `dev`
    * `test`
    * `prod`
* Add global error handling.
* Add request validation.
* Add consistent API response/error structures.
* Add logging configuration.
* Add API versioning.

Recommended API prefix:

```text
/api/v1
```

Example:

```text
/api/v1/auth
/api/v1/users
/api/v1/accounts
/api/v1/payments
/api/v1/transactions
```

---

# PHASE 1 — User Registration and Authentication

## Objective

Build secure authentication without external OTP or authentication providers.

### Registration

Users must be able to:

* Create an account.
* Provide name.
* Provide email.
* Provide phone number.
* Create a password.
* Create a unique UPI ID.

Passwords must never be stored in plain text.

Use:

```text
Argon2 or BCrypt
```

### Login

Users should authenticate using:

```text
Email/phone/UPI ID + password
```

Successful authentication should issue:

* Access token
* Refresh token

### JWT Requirements

Access tokens must:

* Have a short expiration time.
* Contain user identity.
* Contain required authorization information.
* Be validated on protected endpoints.

Refresh tokens must:

* Have a longer expiration period.
* Be revocable.
* Be stored securely.
* Support token rotation.

### Logout

Logout must invalidate the relevant refresh token/session.

### Account Security

Implement:

* Failed-login tracking.
* Temporary account lock after excessive failures.
* Password validation.
* Password change.
* Session/token revocation.

No third-party authentication service should be used.

---

# PHASE 2 — User and Account Management

## Objective

Create the core financial/account model.

### User

A user should contain information such as:

```text
id
name
email
phone
passwordHash
upiId
status
createdAt
updatedAt
```

### Account

An account should contain:

```text
id
userId
balance
currency
status
createdAt
updatedAt
```

The balance must never be directly modified from arbitrary application code.

All balance changes must go through controlled transaction logic.

### Account Rules

* Balance cannot become negative.
* Account must be active to make payments.
* Suspended accounts cannot initiate or receive payments.
* Currency must be explicitly represented.
* Monetary values must use precise decimal representation.

Do not use floating-point types for money.

Use:

```text
BigDecimal
```

---

# PHASE 3 — UPI Payment System

## Objective

Implement the core PaySim payment functionality.

### Supported Payment Methods

#### UPI ID

Example:

```text
user@paysim
```

#### QR Code

Users must be able to:

* Generate their unique payment QR.
* Scan/enter another user's payment information.
* Initiate payment.

The QR must contain only the required payment identifier/data.

Sensitive account information must not be embedded in the QR.

---

# PHASE 4 — Payment Transaction Engine

## Objective

Build a reliable transactional payment engine.

A payment should follow a state machine:

```text
INITIATED
    |
    v
PROCESSING
    |
    +------> SUCCESS
    |
    +------> FAILED
```

Optional states:

```text
CANCELLED
EXPIRED
REVERSED
```

### Payment Processing

A payment request must:

1. Validate authentication.
2. Validate sender.
3. Validate receiver.
4. Validate amount.
5. Validate account status.
6. Check idempotency.
7. Begin database transaction.
8. Lock required account rows.
9. Verify available balance.
10. Debit sender.
11. Credit receiver.
12. Create transaction record.
13. Commit transaction.
14. Publish a payment event.

If any critical database operation fails:

```text
ROLLBACK
```

No partial payment should be possible.

---

# PHASE 5 — Concurrency and Race-Condition Protection

## Objective

Ensure simultaneous requests cannot corrupt balances.

Example:

```text
Account balance = ₹1,000

Request A → ₹700
Request B → ₹700
```

Expected:

```text
One succeeds.
One fails.
```

Both must never succeed.

### Requirements

Implement:

* Database row locking or appropriate optimistic locking.
* Transaction boundaries.
* Consistent locking strategy.
* Balance validation inside the transaction.
* Proper isolation where required.

Concurrency tests must be created to verify this behavior.

---

# PHASE 6 — Idempotency

## Objective

Prevent duplicate payments caused by retries, network failures, or repeated client requests.

Payment requests must support:

```text
Idempotency-Key
```

Example:

```text
POST /api/v1/payments
Idempotency-Key: 7f8c-payment-123
```

If the same key is received again:

```text
Do not create another payment.
Return the original result.
```

### Requirements

* Idempotency key must be unique within the appropriate scope.
* Store payment result/status.
* Detect repeated requests.
* Handle requests that arrive concurrently.
* Redis may be used for fast lookup.
* PostgreSQL must provide durable uniqueness guarantees.

---

# PHASE 7 — Transaction History and Receipts

## Objective

Provide users with a complete record of their payments.

### Transaction History

Users should be able to view:

* Transaction ID.
* Sender.
* Receiver.
* Amount.
* Status.
* Payment method.
* Timestamp.
* Reference ID.

### Filtering

Support:

* Date range.
* Status.
* Transaction type.
* Amount range.

### Pagination

Transaction history must use pagination.

Do not load the complete transaction table into memory.

### Receipt

After a successful payment, users should be able to view a payment receipt.

The receipt should contain:

```text
Transaction ID
Reference ID
Sender
Receiver
Amount
Status
Date/time
Payment method
```

No external receipt-generation service should be required.

---

# PHASE 8 — Redis Integration

## Objective

Use Redis for performance and protection mechanisms.

Redis must not become the source of truth for financial balances.

### Redis Use Cases

Implement:

#### Rate Limiting

Protect:

```text
Login
Registration
Payment
Sensitive endpoints
```

#### Idempotency

Use Redis for fast idempotency lookup where appropriate.

#### Caching

Cache appropriate read-heavy data such as:

* User profile.
* UPI lookup.
* Non-sensitive frequently accessed data.

### Cache Requirements

* Define TTL.
* Handle cache misses.
* Handle Redis failure gracefully.
* Never allow stale cache data to corrupt financial transactions.

---

# PHASE 9 — Kafka Event-Driven Architecture

## Objective

Introduce asynchronous event processing.

After a successful payment:

```text
Payment Transaction
       |
       v
    Kafka
       |
 +-----+-----+-----+
 |           |     |
 v           v     v
Receipt     Audit  Notification
Consumer    Consumer Consumer
```

### Events

Create events such as:

```text
PaymentInitiated
PaymentSucceeded
PaymentFailed
PaymentReversed
```

### Event Requirements

Events should contain:

```text
eventId
eventType
transactionId
timestamp
payload
```

### Consumer Requirements

Consumers must support:

* Retry.
* Error handling.
* Idempotent processing.
* Dead-letter handling where appropriate.

No external messaging provider should be used.

---

# PHASE 10 — Internal Notification System

## Objective

Provide notifications without third-party services.

Do not integrate external SMS, email, WhatsApp, Firebase, or similar providers.

Instead, create an internal notification system.

Example:

```text
Payment successful
        |
        v
Kafka event
        |
        v
Notification consumer
        |
        v
PostgreSQL
        |
        v
User notification center
```

Users can see:

* Payment successful.
* Payment failed.
* Money received.
* Security events.

The frontend should provide a notification center.

---

# PHASE 11 — Security Hardening

## Objective

Treat PaySim as a real backend exposed to the internet.

### API Security

Implement:

* Authentication.
* Authorization.
* Request validation.
* Rate limiting.
* Secure headers.
* CORS restrictions.
* Proper HTTP status codes.
* Generic error messages.
* Protection against common injection attacks.

### Sensitive Data

Never expose:

* Password hashes.
* JWT secrets.
* Database credentials.
* Internal infrastructure details.
* Sensitive configuration.

### Secrets

All secrets must come from environment variables or secure deployment configuration.

Never commit:

```text
.env
passwords
JWT secrets
database credentials
private keys
```

---

# PHASE 12 — Audit Logging

## Objective

Track important security and financial operations.

Audit events should include:

```text
User login
Failed login
Password change
Payment initiated
Payment successful
Payment failed
Account status change
Token/session events
```

Audit records should contain:

```text
eventId
userId
eventType
timestamp
requestId
metadata
```

Sensitive information must not be logged.

Never log:

```text
password
JWT
full authentication secrets
```

---

# PHASE 13 — Observability

## Objective

Make it possible to understand what the system is doing in production.

Implement:

* Spring Boot Actuator.
* Health endpoints.
* Structured logs.
* Request IDs.
* Correlation IDs.
* API latency measurement.
* Error metrics.
* Payment success/failure metrics.
* Kafka consumer metrics.
* Database health checks.
* Redis health checks.

Example request flow:

```text
Request
   |
requestId = abc123
   |
Spring Boot
   |
Payment Service
   |
PostgreSQL
   |
Kafka
   |
Logs contain abc123
```

This allows a complete request to be traced through the system.

---

# PHASE 14 — Testing

## Objective

Create a comprehensive automated test suite.

### Unit Tests

Test:

* Services.
* Validators.
* Payment calculations.
* Authentication logic.
* Idempotency logic.

### Integration Tests

Test:

* PostgreSQL.
* Redis.
* Kafka.
* Authentication.
* Payment transactions.

### API Tests

Test:

```text
POST /auth/register
POST /auth/login
POST /payments
GET /transactions
GET /users/me
```

### Security Tests

Verify:

* Unauthorized requests fail.
* Expired JWTs fail.
* Invalid JWTs fail.
* Users cannot access other users' data.
* Rate limits work.

### Payment Tests

Verify:

* Successful payment.
* Insufficient balance.
* Invalid receiver.
* Suspended account.
* Duplicate request.
* Concurrent payments.
* Database rollback.
* Payment failure.

---

# PHASE 15 — Load and Failure Testing

## Objective

Test PaySim under realistic stress.

Test:

* Concurrent login requests.
* Concurrent payments.
* Duplicate payment requests.
* Large transaction history.
* Redis failure.
* Kafka consumer failure.
* Database connection failure.
* Application restart during processing.

### Important Test

Example:

```text
Starting balance = ₹10,000

100 concurrent requests
each attempting ₹500
```

The final balance and successful transaction count must remain mathematically correct.

The system must never create money or lose money because of a race condition.

---

# PHASE 16 — Dockerization

## Objective

Make the entire system reproducible.

Create Docker images for:

```text
PaySim Backend
PaySim Frontend
```

Infrastructure containers:

```text
PostgreSQL
Redis
Kafka
```

Use:

```text
docker-compose.yml
```

for development/infrastructure orchestration.

The application should be startable with a predictable deployment process.

---

# PHASE 17 — CI/CD

## Objective

Automate quality checks and deployment.

Use GitHub Actions.

Pipeline:

```text
Git Push
   |
   v
Build
   |
   v
Unit Tests
   |
   v
Integration Tests
   |
   v
Security/Quality Checks
   |
   v
Docker Build
   |
   v
Deploy
```

A failed test must prevent deployment.

The repository should contain clear workflow files under:

```text
.github/workflows/
```

---

# PHASE 18 — Production Deployment

## Objective

Deploy PaySim so that users can access it through the internet.

The final system should have:

```text
Public Internet
       |
       v
HTTPS
       |
       v
PaySim Frontend
       |
       v
PaySim Backend
       |
 +-----+------+------+
 |            |      |
 v            v      v
PostgreSQL   Redis  Kafka
```

All application components should be deployed and connected.

Avoid managed third-party application services wherever possible.

The application must not depend on:

* External payment gateways.
* External OTP providers.
* External email providers.
* External SMS providers.
* External notification providers.

---

# PHASE 19 — Database Reliability

## Objective

Protect financial and user data.

Implement:

* Database constraints.
* Foreign keys.
* Unique constraints.
* Indexes.
* Transaction boundaries.
* Migration management.

Use a migration system such as:

```text
Flyway
```

Database schema changes must be version controlled.

Example:

```text
V1__create_users.sql
V2__create_accounts.sql
V3__create_transactions.sql
V4__add_indexes.sql
```

Never rely on manually modifying the production database.

---

# PHASE 20 — Performance Optimization

## Objective

Optimize only after correctness is established.

Review:

* Database indexes.
* Slow queries.
* Connection pool.
* Redis caching.
* Kafka throughput.
* API latency.
* Pagination.
* N+1 queries.

Do not optimize by sacrificing financial correctness.

---

# PHASE 21 — Frontend Production Experience

## Objective

Create a realistic user experience.

### Pages

```text
Landing Page
Login
Register
Dashboard
Profile
Send Money
Scan/Pay QR
Transaction History
Transaction Details
Receipt
Notifications
Account Settings
```

### Dashboard

Show:

* Current balance.
* Recent transactions.
* Money sent.
* Money received.
* Quick payment actions.

### Payment Flow

```text
Enter UPI ID / QR
       ↓
Enter amount
       ↓
Confirm payment
       ↓
Authenticate if required
       ↓
Process payment
       ↓
Success / Failure
       ↓
Receipt
```

The frontend must clearly display transaction states.

---

# PHASE 22 — API Documentation

## Objective

Make the backend understandable to another developer.

Use OpenAPI/Swagger.

Document:

* Authentication.
* Request body.
* Response body.
* HTTP status codes.
* Error responses.
* Authentication requirements.
* Idempotency requirements.

Example:

```text
POST /api/v1/payments
Authorization: Bearer <token>
Idempotency-Key: <unique-key>
```

---

# PHASE 23 — Error Handling

## Objective

Provide predictable API behavior.

Create standardized errors.

Example:

```json
{
  "timestamp": "...",
  "status": 400,
  "error": "INSUFFICIENT_BALANCE",
  "message": "Insufficient balance",
  "path": "/api/v1/payments",
  "requestId": "abc123"
}
```

Use appropriate status codes:

```text
400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
409 Conflict
422 Unprocessable Entity
429 Too Many Requests
500 Internal Server Error
```

Do not expose stack traces to clients.

---

# PHASE 24 — Production Documentation

## README

The README must explain:

* What PaySim is.
* Architecture.
* Technologies.
* Features.
* API structure.
* Database design.
* Payment flow.
* Idempotency.
* Concurrency handling.
* Redis usage.
* Kafka architecture.
* Security.
* Testing.
* Docker setup.
* Deployment.
* Environment variables.

### Architecture Documentation

Create:

```text
docs/
├── architecture.md
├── payment-flow.md
├── authentication.md
├── database.md
├── kafka.md
├── redis.md
├── security.md
├── testing.md
└── deployment.md
```

---

# PHASE 25 — Final Production Checklist

Before considering PaySim production-ready, verify:

## Authentication

* [ ] Registration works.
* [ ] Login works.
* [ ] Passwords are hashed.
* [ ] JWT authentication works.
* [ ] Refresh tokens work.
* [ ] Logout/revocation works.
* [ ] Failed login protection works.

## Payments

* [ ] UPI ID payments work.
* [ ] QR payments work.
* [ ] Balance is accurate.
* [ ] Insufficient balance is rejected.
* [ ] Transactions are atomic.
* [ ] Duplicate payments are prevented.
* [ ] Concurrent payments are handled correctly.
* [ ] Failed transactions roll back.

## Database

* [ ] PostgreSQL is the financial source of truth.
* [ ] Foreign keys exist.
* [ ] Unique constraints exist.
* [ ] Required indexes exist.
* [ ] Database migrations are version controlled.

## Redis

* [ ] Rate limiting works.
* [ ] Idempotency support works.
* [ ] Cache invalidation is handled.
* [ ] Redis failure does not corrupt payments.

## Kafka

* [ ] Payment events are published.
* [ ] Consumers process events.
* [ ] Consumer failures are handled.
* [ ] Duplicate events are handled.
* [ ] Dead-letter handling exists where required.

## Security

* [ ] No secrets in Git.
* [ ] Input validation exists.
* [ ] Authorization is enforced.
* [ ] CORS is configured.
* [ ] Sensitive data is not logged.
* [ ] Rate limiting exists.
* [ ] HTTPS is enabled in production.

## Testing

* [ ] Unit tests.
* [ ] Integration tests.
* [ ] API tests.
* [ ] Authentication tests.
* [ ] Payment tests.
* [ ] Concurrency tests.
* [ ] Idempotency tests.
* [ ] Failure tests.
* [ ] Load tests.

## Operations

* [ ] Docker deployment works.
* [ ] CI/CD works.
* [ ] Health checks work.
* [ ] Logs are structured.
* [ ] Request IDs exist.
* [ ] Metrics exist.
* [ ] Database backup strategy exists.
* [ ] Application restart is safe.

## Frontend

* [ ] Registration.
* [ ] Login.
* [ ] Dashboard.
* [ ] Send payment.
* [ ] QR payment.
* [ ] Transaction history.
* [ ] Receipts.
* [ ] Notifications.
* [ ] Profile/settings.
* [ ] Responsive UI.

---

# 26. Non-Functional Requirements

## Reliability

Financial operations must be atomic and consistent.

## Security

Authentication, authorization, validation, and secret management must be implemented throughout the application.

## Performance

Frequently accessed non-financial data may be cached, while financial operations must prioritize correctness.

## Scalability

The backend should be stateless wherever possible so multiple application instances can eventually run behind a load balancer.

## Maintainability

Use clear separation of:

```text
Controller
Service
Repository
Domain/Entity
DTO
Mapper
Configuration
Exception
Security
Event
```

Avoid putting business logic inside controllers.

## Observability

Every important operation should be traceable through logs, request IDs, metrics, and transaction IDs.

## Reproducibility

The complete infrastructure should be reproducible through Docker and configuration files.

---

# 27. Important Architectural Rules

1. PostgreSQL is the source of truth for money and account balances.
2. Redis must never independently determine whether a payment succeeds.
3. Every payment must be processed transactionally.
4. Every payment endpoint must protect against duplicate requests.
5. Concurrent balance updates must be safe.
6. Money must use `BigDecimal`, never floating-point types.
7. Authentication secrets must never be committed.
8. Kafka is for asynchronous events, not the authoritative payment ledger.
9. External payment/OTP/email/SMS services are not required.
10. Do not introduce microservices merely for the sake of using microservices.
11. Correctness comes before performance optimization.
12. Tests must cover failure and concurrency scenarios, not only successful requests.
13. Production configuration must be separated from development configuration.
14. Database schema changes must use versioned migrations.
15. The public application must use HTTPS.
16. No production credentials should be stored in source control.
17. Every financial transaction must have a unique transaction/reference identifier.
18. APIs must use consistent validation, error handling, and HTTP status codes.
19. The system must remain recoverable after application restarts.
20. All infrastructure required by PaySim should be explicitly documented.

---

# 28. Definition of Done

PaySim will be considered production-level when:

```text
A user can
    ↓
Register
    ↓
Login securely
    ↓
Receive JWT authentication
    ↓
View account
    ↓
Send money using UPI ID or QR
    ↓
Payment is processed transactionally
    ↓
Duplicate requests are rejected safely
    ↓
Concurrent payments are handled correctly
    ↓
Transaction is persisted
    ↓
Kafka event is generated
    ↓
Internal notification/receipt processing occurs
    ↓
User sees updated transaction history
    ↓
System provides logs and metrics
    ↓
Automated tests verify the critical flows
    ↓
CI/CD builds and deploys the application
    ↓
Application is publicly accessible over HTTPS
```

The final PaySim should demonstrate **secure authentication, transactional payment processing, concurrency control, idempotency, database reliability, caching, event-driven architecture, testing, observability, containerization, CI/CD, and production deployment** without relying on third-party payment or communication services.
