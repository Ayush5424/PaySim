# Stage 1: Build React frontend
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: Build Spring Boot backend
FROM eclipse-temurin:21-jdk AS backend-build
WORKDIR /app
COPY mvnw pom.xml ./
COPY .mvn .mvn
RUN chmod +x mvnw && ./mvnw -DskipTests dependency:go-offline
COPY src src
COPY --from=frontend-build /app/frontend/dist src/main/resources/static
RUN ./mvnw -DskipTests package

# Stage 3: Minimal JRE runtime
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=backend-build /app/target/UPI-Simulation-0.0.1-SNAPSHOT.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
