package com.Project.UPI_Simulation.security;

import com.Project.UPI_Simulation.entity.RefreshToken;
import com.Project.UPI_Simulation.entity.User;
import com.Project.UPI_Simulation.exception.UnauthorizedException;
import com.Project.UPI_Simulation.repository.RefreshTokenRepository;
import com.Project.UPI_Simulation.repository.UserRepository;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.Base64;
import java.util.Date;
import java.util.HexFormat;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class JwtService {

    private final JwtProperties jwtProperties;
    private final RefreshTokenRepository refreshTokenRepository;
    private final UserRepository userRepository;

    public String generateAccessToken(User user) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(String.valueOf(user.getId()))
                .claim("upiId", user.getUpiId())
                .claim("type", "access")
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusMillis(jwtProperties.getAccessTokenExpirationMs())))
                .signWith(getSigningKey())
                .compact();
    }

    @Transactional
    public String generateRefreshToken(User user) {
        refreshTokenRepository.deleteByExpiresAtBefore(Instant.now());

        String token = UUID.randomUUID() + "." + UUID.randomUUID();
        RefreshToken refreshToken = RefreshToken.builder()
                .user(user)
                .tokenHash(hashToken(token))
                .expiresAt(Instant.now().plusMillis(jwtProperties.getRefreshTokenExpirationMs()))
                .revoked(false)
                .build();
        refreshTokenRepository.save(refreshToken);
        return token;
    }

    public boolean isJwtToken(String token) {
        return token != null && token.chars().filter(ch -> ch == '.').count() == 2;
    }

    @Transactional(readOnly = true)
    public User validateAccessToken(String token) {
        try {
            Claims claims = parseClaims(token);
            if (!"access".equals(claims.get("type", String.class))) {
                throw new UnauthorizedException("Invalid access token");
            }
            Long userId = Long.parseLong(claims.getSubject());
            return userRepository.findById(userId)
                    .orElseThrow(() -> new UnauthorizedException("User not found"));
        } catch (UnauthorizedException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new UnauthorizedException("Invalid or expired token");
        }
    }

    @Transactional
    public User validateAndRotateRefreshToken(String refreshToken) {
        RefreshToken stored = refreshTokenRepository.findByTokenHash(hashToken(refreshToken))
                .orElseThrow(() -> new UnauthorizedException("Invalid refresh token"));

        if (stored.isRevoked() || stored.isExpired()) {
            throw new UnauthorizedException("Refresh token expired or revoked");
        }

        stored.setRevoked(true);
        refreshTokenRepository.save(stored);
        return stored.getUser();
    }

    @Transactional
    public void revokeRefreshToken(String refreshToken) {
        refreshTokenRepository.findByTokenHash(hashToken(refreshToken))
                .ifPresent(token -> {
                    token.setRevoked(true);
                    refreshTokenRepository.save(token);
                });
    }

    @Transactional
    public void revokeAllForUser(User user) {
        refreshTokenRepository.deleteByUser(user);
    }

    public long getAccessTokenExpirationMs() {
        return jwtProperties.getAccessTokenExpirationMs();
    }

    private Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private SecretKey getSigningKey() {
        String secret = jwtProperties.getSecret();
        byte[] keyBytes;
        try {
            keyBytes = Base64.getDecoder().decode(secret);
        } catch (IllegalArgumentException ex) {
            keyBytes = secret.getBytes(StandardCharsets.UTF_8);
        }
        if (keyBytes.length < 32) {
            try {
                keyBytes = MessageDigest.getInstance("SHA-256").digest(keyBytes);
            } catch (NoSuchAlgorithmException ex) {
                throw new IllegalStateException("SHA-256 is not available", ex);
            }
        }
        return Keys.hmacShaKeyFor(keyBytes);
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
