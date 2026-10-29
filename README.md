# PaySim — UPI Payment Simulation Platform

A **production-grade UPI Payment Simulation** built with Spring Boot 4, Java 21, PostgreSQL, Redis, Apache Kafka, and a modern **React 18 + TypeScript + Vite** developer dashboard.

> **Note:** This is a simulation project for learning and portfolio purposes. It accurately simulates UPI 2.0 transaction lifecycles, concurrency locks, and idempotency guarantees without processing real currency.

---

Live Demo
- https://paysim-vh1r.onrender.com

## Features

### Modern Payment Infrastructure Dashboard (React + Vite)
* **Real-time Overview:** Metric cards (Total Transactions, Settled Volume, Processing Count, Failure Count, Success Rate).
* **Payment Lifecycle Execution:** Real visual stepper (`INITIATED` → `PROCESSING` → `SUCCESS` / `FAILED`).
* **Direct Transfer:** Fast phone number lookup or UPI ID recipient targeting with instant balance validation.
* **Idempotency Engine:** Automatic UUID v4 `Idempotency-Key` generation and injection to prevent double-debit race conditions.
* **Dynamic QR Codes:** Live high-resolution QR rendering, download as PNG, copy UPI link, and camera/gallery QR scanner.
* **Transaction Ledger:** Real-time data table with search, status filtering, direction filter (debit/credit), and CSV export.
* **Technical Transaction Inspector:** Two-column deep dive displaying reference UTR, idempotency key, audit timeline, and raw JSON payload.
* **Bank-Grade Receipts:** Printable vouchers with dedicated print CSS (`@media print`) and clipboard copy.
* **PIN Verification:** Interactive masked PIN security keypad protecting balance inquiries and money transfers.
* **Design System:** Consistent fintech aesthetic with dark/light themes, Inter and JetBrains Mono typography.

### Authentication & User Management
* JWT access tokens (15 min) + refresh tokens (7 days)
* Silent token refresh on 401 Unauthorized
* BCrypt-hashed passwords and UPI PINs
* Account lockout after 5 failed login attempts
* Session management with SHA-256 token hash in `auth_sessions` table

### Payments Core Engine
* UPI peer-to-peer transfers via `/api/v1/payments/send`
* **Pessimistic row locking** (SELECT FOR UPDATE) in consistent ID order — zero race conditions
* **Idempotency keys** — duplicate requests return cached response, no double debit
* PIN verification on every payment
* Payment receipt endpoint per transaction

### QR Payments
* Dynamic UPI QR code generation (`/api/v1/payments/qr/{upiId}`) with ZXing
* Live camera and gallery scanning using `html5-qrcode`

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
| Frontend Framework | React 18 (TypeScript) |
| Frontend Bundler | Vite 5 |
| Routing | React Router 6 (SPA with Spring Boot forward controller) |
| Styling | Tailwind CSS 3, Lucide Icons, Canvas Confetti |
| QR Processing | ZXing (Backend) / QRCode & Html5-QRCode (Frontend) |
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
| Container | Docker Multi-stage (Node 20 + Temurin 21) |

---

## Project Structure

```text
UPI-Simulation/
│
├── frontend/                               # React 18 + TypeScript + Vite Project
│   ├── src/
│   │   ├── api/                            # Centralized API service layer & clients
│   │   ├── components/                     # Reusable design system components
│   │   │   ├── common/                     # StatCard, StatusBadge, Modal, PinKeypad, Toast
│   │   │   ├── layout/                     # Sidebar, Header, AppLayout, ProtectedRoute
│   │   │   ├── payment/                    # PaymentStepper, QrScannerModal, MyQrCard
│   │   │   └── transaction/                # TransactionTable, ReceiptCard
│   │   ├── context/                        # AuthContext, ThemeContext
│   │   ├── pages/                          # Login, Signup, Dashboard, Payments, Transactions, Receipts, Settings
│   │   ├── types/                          # TypeScript interfaces
│   │   └── utils/                          # Currency/Date formatters, Idempotency UUIDs, QR helpers
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
│
├── src/
│   └── main/
│       ├── java/
│       │   └── com/Project/UPI_Simulation/
│       │       ├── auth/                   # Auth controller, service, requests
│       │       ├── config/                 # Security, CORS, Kafka, Redis configs
│       │       ├── controller/             # Payments, Transactions, QR, Users, SpaController
│       │       ├── dto/                    # API payloads and responses
│       │       ├── entity/                 # JPA models (User, Transaction, Notification)
│       │       ├── repository/             # Spring Data repositories
│       │       └── service/                # PaymentService, UserService, QRService
│       │
│       └── resources/
│           ├── static/                     # Compiled React production assets (served by Spring Boot)
│           ├── static-legacy/              # Archived legacy HTML files
│           ├── db/migration/               # Flyway SQL migrations
│           └── application.properties
│
├── Dockerfile                              # Multi-stage production build (Frontend + Backend JAR)
├── pom.xml
└── README.md
```

---

## Running Locally

### 1. Frontend Development Mode (Hot Reload + Proxy)
```bash
cd frontend
npm install
npm run dev
# Vite runs on http://localhost:5173 with proxy to backend http://localhost:8080
```

### 2. Frontend Production Build
```bash
cd frontend
npm run build
# Compiles React into static resources at src/main/resources/static/
```

### 3. Backend Execution
```bash
mvn clean package
mvn spring-boot:run
# Serves the complete React application and API on http://localhost:8080
```

---

## Deployment Architecture

```text
GitHub
   │
   ▼
Render (Docker Runtime)
   │
   ├── Multi-Stage Docker Build
   │     ├─ Stage 1: Node 20 compiles React (Vite)
   │     ├─ Stage 2: JDK 21 packages Spring Boot JAR with compiled static assets
   │     └─ Stage 3: Lightweight JRE 21 runtime container
   │
   ▼
Neon PostgreSQL (Managed Cloud Database)
```

Both frontend and backend are packaged into the single Spring Boot container. Client-side routes (`/dashboard`, `/payments`, `/transactions`, `/receipts/:id`, `/settings`, `/login`) are seamlessly resolved via `SpaController` forwarding to `index.html`.

---

## Security Considerations

* Database credentials are supplied through environment variables.
* Authentication is handled via stateless JWT with BCrypt password/PIN hashes.
* Pessimistic row locking on accounts prevents double spending.
* Idempotency keys prevent duplicate debit on network timeouts.
* Protected operations require an authenticated session.
* Sensitive server-side error details are suppressed from client responses.

---

## Author

**Ayush Abhinav**  
GitHub: [https://github.com/Ayush5424](https://github.com/Ayush5424)

---

## License

This project is intended for educational and portfolio purposes.
