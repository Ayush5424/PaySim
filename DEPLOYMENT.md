# Deployment

This is a Spring Boot app that requires Java 21 and a hosted PostgreSQL database. It is configured for Render to create and use a managed PostgreSQL database, so you do not need a local database.

## Required environment variables

- `URL`: optional full JDBC URL for PostgreSQL, for example `jdbc:postgresql://localhost:5432/upi_simulation`
- `DB_HOST`: PostgreSQL host, used when `URL` is not set
- `DB_PORT`: PostgreSQL port, used when `URL` is not set; defaults to `5432`
- `DB_NAME`: PostgreSQL database name, used when `URL` is not set
- `DB_USERNAME`: PostgreSQL username
- `DB_PASSWORD`: PostgreSQL password
- `PORT`: optional; cloud hosts usually set this automatically

## Render

1. Push this project to a Git repository.
2. In Render, create a new Blueprint from the repository.
3. Render will read `render.yaml` at the repository root, create the web service and PostgreSQL database, and wire the database environment variables automatically.

## Docker

Build locally:

```sh
docker build -t upi-simulation .
```

Run locally against a hosted database:

```sh
docker run --rm -p 8080:8080 \
  -e URL='jdbc:postgresql://your-cloud-db-host:5432/your-db-name?sslmode=require' \
  -e DB_USERNAME='your-db-user' \
  -e DB_PASSWORD='your-db-password' \
  upi-simulation
```

## Maven artifact

Build the jar:

```sh
./mvnw -DskipTests package
```

Run the jar:

```sh
java -jar target/UPI-Simulation-0.0.1-SNAPSHOT.jar
```
