# Deployment

## Local (Docker Compose)
1. cp .env.example .env && edit .env with your secrets
2. docker compose up -d
3. App available at http://localhost:8080
4. Swagger UI at http://localhost:8080/swagger-ui.html
5. Actuator at http://localhost:8080/actuator/health

## Production (Render / Railway)
- Set env vars: SPRING_PROFILES_ACTIVE=prod, SPRING_DATASOURCE_URL, etc.
- See render.yaml for Render deployment configuration.

## JAR Build
./mvnw package
java -jar target/UPI-Simulation-0.0.1-SNAPSHOT.jar --spring.profiles.active=prod
