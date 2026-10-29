package com.Project.UPI_Simulation;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.io.BufferedReader;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@SpringBootApplication
public class UpiSimulationApplication {

	public static void main(String[] args) {
		loadDotEnv();
		configureDatabaseUrl();
		SpringApplication.run(UpiSimulationApplication.class, args);
	}

	private static void loadDotEnv() {
		Path[] searchPaths = new Path[]{
				Paths.get(".env"),
				Paths.get("UPI-Simulation", ".env"),
				Paths.get("..", ".env")
		};

		for (Path path : searchPaths) {
			if (Files.isRegularFile(path)) {
				try (BufferedReader reader = Files.newBufferedReader(path, StandardCharsets.UTF_8)) {
					String line;
					while ((line = reader.readLine()) != null) {
						line = line.trim();
						if (line.isEmpty() || line.startsWith("#")) {
							continue;
						}
						int eqIdx = line.indexOf('=');
						if (eqIdx > 0) {
							String key = line.substring(0, eqIdx).trim();
							String value = line.substring(eqIdx + 1).trim();
							if ((value.startsWith("\"") && value.endsWith("\"")) ||
								(value.startsWith("'") && value.endsWith("'"))) {
								value = value.substring(1, value.length() - 1);
							}
							if (System.getProperty(key) == null && System.getenv(key) == null) {
								System.setProperty(key, value);
							}
							if ("DB_URL".equals(key) && System.getProperty("spring.datasource.url") == null && System.getenv("spring.datasource.url") == null) {
								System.setProperty("spring.datasource.url", value);
							} else if ("DB_USERNAME".equals(key) && System.getProperty("spring.datasource.username") == null && System.getenv("spring.datasource.username") == null) {
								System.setProperty("spring.datasource.username", value);
							} else if ("DB_PASSWORD".equals(key) && System.getProperty("spring.datasource.password") == null && System.getenv("spring.datasource.password") == null) {
								System.setProperty("spring.datasource.password", value);
							} else if ("SPRING_PROFILES_ACTIVE".equals(key) && System.getProperty("spring.profiles.active") == null && System.getenv("spring.profiles.active") == null) {
								System.setProperty("spring.profiles.active", value);
							} else if ("PORT".equals(key) && System.getProperty("server.port") == null && System.getenv("server.port") == null) {
								System.setProperty("server.port", value);
							}
						}
					}
					System.out.println("[PaySim] Loaded environment configuration from: " + path.toAbsolutePath().normalize());
					break;
				} catch (Exception ex) {
					System.err.println("[PaySim] Warning: Could not read .env from " + path + ": " + ex.getMessage());
				}
			}
		}
	}

	private static void configureDatabaseUrl() {
		String dbUrl = System.getenv("DATABASE_URL");
		if (dbUrl == null || dbUrl.isBlank()) {
			dbUrl = System.getProperty("DATABASE_URL");
		}
		if (dbUrl == null || dbUrl.isBlank()) {
			dbUrl = System.getenv("URL");
		}
		if (dbUrl == null || dbUrl.isBlank()) {
			dbUrl = System.getProperty("URL");
		}
		if (dbUrl != null && !dbUrl.isBlank()) {
			try {
				if (dbUrl.startsWith("postgres://") || dbUrl.startsWith("postgresql://")) {
					URI uri = new URI(dbUrl);
					String userInfo = uri.getUserInfo();
					if (userInfo != null && userInfo.contains(":")) {
						String[] parts = userInfo.split(":", 2);
						System.setProperty("spring.datasource.username", parts[0]);
						System.setProperty("spring.datasource.password", parts[1]);
					}
					int port = uri.getPort() == -1 ? 5432 : uri.getPort();
					String jdbcUrl = "jdbc:postgresql://" + uri.getHost() + ":" + port + uri.getPath();
					if (uri.getQuery() != null && !uri.getQuery().isBlank()) {
						jdbcUrl += "?" + uri.getQuery();
					}
					System.setProperty("spring.datasource.url", jdbcUrl);
				} else if (dbUrl.startsWith("jdbc:postgresql://")) {
					System.setProperty("spring.datasource.url", dbUrl);
				}
			} catch (Exception ignored) {
			}
		}
	}

}
