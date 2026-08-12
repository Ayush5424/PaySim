# UPI Payment System

A full-stack UPI payment simulation built with **Spring Boot, PostgreSQL, Spring Security, REST APIs, and HTML/CSS/JavaScript**.

The project simulates core UPI functionality such as user registration, authentication, account management, peer-to-peer payments, QR-based payments, balance management, and transaction history.

> **Note:** This is a simulation project for learning and portfolio purposes. It does not connect to real UPI networks or process real money.

---

## 🚀 Features

### Authentication & User Management

* User registration and profile creation
* Phone number validation
* Unique user and UPI ID validation
* Session-based authentication
* Login and logout functionality
* Persistent login sessions until explicit logout
* Account management
* Delete account functionality

### 💸 Payments

* Peer-to-peer payments
* Payment validation
* Balance verification before transactions
* Secure payment processing
* Transaction records
* Transaction history

### 📱 QR Payments

* Generate UPI QR codes
* Scan/pay using UPI QR information
* QR-based payment processing

### 💰 Account & Balance

* User account creation
* Account balance management
* Balance inquiry
* Secure account operations

### 🔐 Security

* Spring Security
* Session-based authentication
* Protected backend APIs
* Server-side validation
* Unique user and UPI ID constraints
* Sensitive database credentials handled through environment variables

---

## 🛠️ Tech Stack

### Backend

* Java 21
* Spring Boot
* Spring Security
* Spring Data JPA
* Hibernate
* REST APIs
* Maven

### Database

* PostgreSQL
* Neon PostgreSQL for cloud deployment

### Frontend

* HTML5
* CSS3
* JavaScript

### QR Code

* ZXing

### Deployment

* Render
* Neon PostgreSQL

---

## 🏗️ Architecture

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

## 📂 Project Structure

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

## 🔄 Application Flow

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

## 🔐 Environment Variables

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

## 💻 Running Locally

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

## 🌐 Deployment

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

## 🧪 Build Verification

The project has been verified using:

```bash
mvn clean package
```

Expected result:

```text
BUILD SUCCESS
```

---

## 📌 API Areas

The backend provides REST endpoints covering:

* Authentication
* User management
* Payments
* Transactions
* Balance management
* QR payments

API requests are authenticated where required.

---

## 🔒 Security Considerations

* Database credentials are supplied through environment variables.
* Authentication is handled server-side.
* Protected operations require an authenticated session.
* Payment operations validate account state and balance.
* User uniqueness is validated before account creation.
* Sensitive server-side error details are not exposed to clients.

---

## ⚠️ Disclaimer

This project is a **UPI simulation** created for educational and portfolio purposes.

It does not integrate with:

* NPCI
* Real UPI infrastructure
* Banks
* Real payment gateways

No real financial transactions are processed.

---

## 👨‍💻 Author

**Ayush Abhinav**

B.Tech — Computer Science & Engineering

GitHub:
https://github.com/Ayush5424

---

## ⭐ Future Improvements

Potential future enhancements include:

* Email/phone verification
* Rate limiting
* Refresh-token authentication
* Payment notifications
* Improved transaction monitoring
* Automated testing
* Docker-based deployment
* CI/CD pipeline
* Production-grade logging and monitoring
* Integration with a real payment gateway for sandbox testing

---

## 📄 License

This project is intended primarily for educational and portfolio purposes.
