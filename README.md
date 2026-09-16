# PaySim — UPI Payment Simulation

A **production-grade UPI Payment Simulation** backend built with Spring Boot 4, Java 21, PostgreSQL, Redis, Apache Kafka, and a vanilla HTML/CSS/JS frontend.

> **Note:** This is a simulation project for learning and portfolio purposes. It does not connect to real UPI networks or process real money.

---

Live Demo
- https://paysim-vh1r.onrender.com

## Features

### Authentication & User Management
* JWT access tokens (15 min) + refresh tokens (7 days)
* BCrypt-hashed passwords and UPI PINs
* Account lockout after 5 failed login attempts
* Session management with SHA-256 token hash in `auth_sessions` table

### Payments
* UPI peer-to-peer transfers via `/api/v1/payments/send`
* **Pessimistic row locking** (SELECT FOR UPDATE) in consistent ID order — zero race conditions
* **Idempotency keys** — duplicate requests return cached response, no double debit
* PIN verification on every payment
* Payment receipt endpoint per transaction

### QR Payments
* Generate UPI QR codes (ZXing)
* Scan/pay via QR payload

### Event-Driven Architecture
* Kafka topic `paysim-payment-events` for all payment outcomes
* Async consumer logs audit events and creates receiver notifications
* Dead letter queue (DLQ) for failed events

### Observability
* Spring Actuator (`/actuator/health`, `/actuator/metrics`)
* Prometheus metrics (`/actuator/prometheus`)
* Correlation ID (request tracing via MDC)
* Structured JSON-style logging

### Security
* Spring Security 6 with JWT filter chain
* Per-user rate limiting (configurable)
* CORS configuration
* Jakarta Bean Validation on all DTOs

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Language | Java 21 |
| Framework | Spring Boot 4.0 |
| Security | Spring Security 6 + JWT (JJWT 0.12) |
| Database | PostgreSQL 16 (prod) / H2 (test) |
| ORM | Hibernate 7 / Spring Data JPA |
| Migrations | Flyway |
| Cache | Redis 7 |
| Messaging | Apache Kafka |
| API Docs | SpringDoc OpenAPI 3 (Swagger UI) |
| Observability | Actuator + Micrometer + Prometheus |
| Frontend | HTML5 / CSS3 / JavaScript |
| QR Code | ZXing |
| Build | Maven |
| CI/CD | GitHub Actions |
| Container | Docker / Docker Compose |

## Architecture

```text
                    ┌──────────────────────┐
                    │      Frontend        │
                    │ HTML / CSS / JS      │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │    Spring Boot       │
                    │      Backend         │
                    ├──────────────────────┤
                    │ Controllers          │
                    │ Services             │
                    │ Repositories         │
                    │ Spring Security      │
                    │ Session Management   │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │ PostgreSQL / Neon     │
                    │                      │
                    │ Users                │
                    │ Accounts             │
                    │ Transactions         │
                    │ Sessions             │
                    └──────────────────────┘
```

---

## Project Structure

```text
UPI-Simulation/
│
├── src/
│   └── main/
│       ├── java/
│       │   └── com/Project/UPI_Simulation/
│       │       │
│       │       ├── auth/
│       │       ├── controller/
│       │       ├── dto/
│       │       ├── entity/
│       │       ├── exception/
│       │       ├── repository/
│       │       └── service/
│       │
│       └── resources/
│           ├── static/
│           │   ├── js/
│           │   ├── *.html
│           │   └── style.css
│           │
│           └── application.properties
│
├── pom.xml
└── README.md
```

---

## Application Flow

### Registration

```text
User
 ↓
Signup
 ↓
Profile Creation
 ↓
Validation
 ↓
User Account Created
 ↓
UPI ID Generated
 ↓
Dashboard
```

### Login

```text
User
 ↓
Login
 ↓
Credentials Validated
 ↓
Session Created
 ↓
Authenticated Dashboard
```

### Payment

```text
Sender
 ↓
Payment Request
 ↓
Authentication Check
 ↓
Validate Receiver
 ↓
Validate Balance
 ↓
Process Transaction
 ↓
Update Accounts
 ↓
Create Transaction Record
```

---

## Environment Variables

Database credentials are **not stored in the repository**.

The application expects the following environment variables:

```properties
URL=jdbc:postgresql://HOST/DATABASE?sslmode=require
DB_USERNAME=your_database_username
DB_PASSWORD=your_database_password
```

The application configuration uses:

```properties
spring.datasource.url=${URL}
spring.datasource.username=${DB_USERNAME}
spring.datasource.password=${DB_PASSWORD}
```

For Render deployment, these values should be configured through the service's environment variables.

---

## Running Locally

### Prerequisites

Make sure you have:

* Java 21
* Maven
* PostgreSQL
* Git

### 1. Clone the repository

```bash
git clone https://github.com/Ayush5424/UPI-Simulation.git
cd UPI-Simulation
```

### 2. Configure environment variables

Set:

```text
URL=jdbc:postgresql://localhost:5432/upi_simulation
DB_USERNAME=postgres
DB_PASSWORD=your_password
```

### 3. Build the project

```bash
mvn clean package
```

### 4. Run the application

```bash
mvn spring-boot:run
```

The application runs on:

```text
http://localhost:8080
```

---

## Deployment

The project can be deployed using:

### Application

 Render

### Database

 Neon PostgreSQL

Deployment architecture:

```text
GitHub
   │
   ▼
Render
   │
   ├── Spring Boot Backend
   └── Static Frontend
          │
          ▼
      Neon PostgreSQL
```

The frontend and backend are served from the same Spring Boot application, so no separate frontend hosting service is required.

---

## Build Verification

The project has been verified using:

```bash
mvn clean package
```

Expected result:

```text
BUILD SUCCESS
```

---

## API Areas

The backend provides REST endpoints covering:

* Authentication
* User management
* Payments
* Transactions
* Balance management
* QR payments

API requests are authenticated where required.

---

## Security Considerations

* Database credentials are supplied through environment variables.
* Authentication is handled server-side.
* Protected operations require an authenticated session.
* Payment operations validate account state and balance.
* User uniqueness is validated before account creation.
* Sensitive server-side error details are not exposed to clients.

---

## Disclaimer

This project is a **UPI simulation** created for educational and portfolio purposes.

It does not integrate with:

* NPCI
* Real UPI infrastructure
* Banks
* Real payment gateways

No real financial transactions are processed.

---

##  Author

**Ayush Abhinav**

B.Tech — Computer Science & Engineering

GitHub:
https://github.com/Ayush5424

---

## Possible Future Enhancements

* Email/phone OTP verification integration
* WebSocket-based real-time payment notifications
* Scheduled payment reminders
* Multi-currency support
* UPI Lite (offline payments)
* Mobile app frontend (React Native / Flutter)
* Integration with sandbox payment gateway

---

## License

This project is intended primarily for educational and portfolio purposes.
