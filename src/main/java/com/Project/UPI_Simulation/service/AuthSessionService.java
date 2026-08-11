package com.Project.UPI_Simulation.service;

import com.Project.UPI_Simulation.entity.AuthSession;
import com.Project.UPI_Simulation.entity.User;
import com.Project.UPI_Simulation.repository.AuthSessionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.time.Instant;
import java.util.HexFormat;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthSessionService {

    private static final Duration SESSION_TTL = Duration.ofDays(30);

    private final AuthSessionRepository authSessionRepository;

    @Transactional
    public String createSession(User user) {
        authSessionRepository.deleteByExpiresAtBefore(Instant.now());

        String token = UUID.randomUUID() + "-" + UUID.randomUUID();
        AuthSession session = new AuthSession();
        session.setTokenHash(hashToken(token));
        session.setUser(user);
        session.setCreatedAt(Instant.now());
        session.setExpiresAt(Instant.now().plus(SESSION_TTL));
        authSessionRepository.save(session);
        return token;
    }

    @Transactional(readOnly = true)
    public User requireUser(String authorizationHeader) {
        String token = extractBearerToken(authorizationHeader);
        AuthSession session = authSessionRepository.findByTokenHash(hashToken(token))
                .orElseThrow(() -> new RuntimeException("Authentication required"));

        if (session.getExpiresAt().isBefore(Instant.now())) {
            throw new RuntimeException("Session expired");
        }

        return session.getUser();
    }

    @Transactional
    public void logout(String authorizationHeader) {
        String token = extractBearerToken(authorizationHeader);
        authSessionRepository.deleteByTokenHash(hashToken(token));
    }

    @Transactional
    public void deleteSessionsForUser(User user) {
        authSessionRepository.deleteByUser(user);
    }

    private String extractBearerToken(String authorizationHeader) {
        if (authorizationHeader == null || !authorizationHeader.startsWith("Bearer ")) {
            throw new RuntimeException("Authentication required");
        }
        String token = authorizationHeader.substring(7).trim();
        if (token.isBlank()) {
            throw new RuntimeException("Authentication required");
        }
        return token;
    }

    private String hashToken(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(token.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 is not available", ex);
        }
    }
}
