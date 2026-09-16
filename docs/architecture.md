# PaySim Architecture

## Overview
PaySim is a production-grade UPI Payment Simulation backend built with Spring Boot 4 and Java 21.

## System Components

`
[Client] --> [Spring Boot API :8080]
                 |
         [SecurityConfig + JWT Filter + Rate Limiter]
                 |
       +--------------------+
  [JPA/Hibernate]     [Redis Cache]
       |                    |
  [PostgreSQL]       [Idempotency Keys]
       |
  [Kafka Producer] --> [Kafka Broker] --> [Kafka Consumer]
                                               |
                                     [Audit + Notifications]
`

## Package Structure
- uth/  Registration, login, JWT token issuing
- config/  Security, CORS, OpenAPI, Kafka, Redis, AppConfig
- controller/  PaymentController, TransactionController, UserController, QRController, NotificationController
- dto/  Request/Response DTOs
- entity/  JPA entities (User, Account, Transaction, RefreshToken, etc.)
- event/  Kafka PaymentEvent, Producer, Consumer
- exception/  GlobalExceptionHandler
- epository/  Spring Data JPA repositories with pessimistic locking
- security/  JwtTokenProvider, JwtAuthenticationFilter, RateLimitFilter
- service/  AuthService, PaymentService, AuthSessionService, IdempotencyService, AuditService, NotificationService

## Technology Stack
| Component | Technology |
|-----------|-----------|
| Language | Java 21 |
| Framework | Spring Boot 4.0 |
| Security | Spring Security 6 + JWT (JJWT 0.12) |
| Database | PostgreSQL 16 / H2 (test) |
| ORM | Hibernate 7 / Spring Data JPA |
| Migrations | Flyway |
| Cache | Redis 7 |
| Messaging | Apache Kafka |
| API Docs | SpringDoc OpenAPI 3 (Swagger UI) |
| Observability | Spring Actuator + Micrometer + Prometheus |
