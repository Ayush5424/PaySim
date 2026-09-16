package com.Project.UPI_Simulation;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.net.URI;

@SpringBootApplication
public class UpiSimulationApplication {

	public static void main(String[] args) {
		configureDatabaseUrl();
		SpringApplication.run(UpiSimulationApplication.class, args);
	}

	private static void configureDatabaseUrl() {
		String dbUrl = System.getenv("DATABASE_URL");
		if (dbUrl == null || dbUrl.isBlank()) {
			dbUrl = System.getenv("URL");
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
