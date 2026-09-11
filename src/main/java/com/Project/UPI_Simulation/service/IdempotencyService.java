package com.Project.UPI_Simulation.service;

import com.Project.UPI_Simulation.entity.IdempotencyRecord;
import com.Project.UPI_Simulation.repository.IdempotencyRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class IdempotencyService {

    private final IdempotencyRepository idempotencyRepository;
    private final StringRedisTemplate redisTemplate;

    @Transactional
    public Optional<IdempotencyRecord> checkIdempotency(String idempotencyKey, String requestHash) {
        if (idempotencyKey == null || idempotencyKey.isBlank()) {
            return Optional.empty();
        }

        // Check Redis fast cache first
        try {
            if (redisTemplate != null) {
                String cachedResponse = redisTemplate.opsForValue().get("idempotency:" + idempotencyKey);
                if (cachedResponse != null) {
                    IdempotencyRecord record = new IdempotencyRecord();
                    record.setIdempotencyKey(idempotencyKey);
                    record.setStatus("COMPLETED");
                    record.setResponseBody(cachedResponse);
                    record.setHttpStatus(200);
                    return Optional.of(record);
                }
            }
        } catch (Exception ex) {
            log.warn("Redis idempotency lookup failed: {}", ex.getMessage());
        }

        // Check durable PostgreSQL database
        Optional<IdempotencyRecord> recordOpt = idempotencyRepository.findByIdempotencyKey(idempotencyKey);
        if (recordOpt.isPresent()) {
            IdempotencyRecord record = recordOpt.get();
            if (record.isExpired()) {
                idempotencyRepository.delete(record);
                return Optional.empty();
            }
            return Optional.of(record);
        }

        return Optional.empty();
    }

    private String hashPayload(String input) {
        if (input == null) return null;
        if (input.length() == 64 && input.matches("[0-9a-fA-F]{64}")) {
            return input;
        }
        try {
            java.security.MessageDigest digest = java.security.MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            return java.util.HexFormat.of().formatHex(hash);
        } catch (Exception ex) {
            if (input.length() > 64) {
                return input.substring(0, 64);
            }
            return input;
        }
    }

    @Transactional
    public IdempotencyRecord registerKey(String idempotencyKey, Long userId, String requestHash) {
        IdempotencyRecord record = IdempotencyRecord.builder()
                .idempotencyKey(idempotencyKey)
                .userId(userId)
                .requestHash(hashPayload(requestHash))
                .status("PROCESSING")
                .expiresAt(Instant.now().plus(Duration.ofHours(24)))
                .build();
        return idempotencyRepository.save(record);
    }

    @Transactional
    public void saveResult(String idempotencyKey, String responseBody, int httpStatus) {
        if (idempotencyKey == null || idempotencyKey.isBlank()) {
            return;
        }

        idempotencyRepository.findByIdempotencyKey(idempotencyKey).ifPresent(record -> {
            record.setStatus("COMPLETED");
            record.setResponseBody(responseBody);
            record.setHttpStatus(httpStatus);
            idempotencyRepository.save(record);
        });

        // Store in Redis fast lookup with 24h TTL
        try {
            if (redisTemplate != null) {
                redisTemplate.opsForValue().set("idempotency:" + idempotencyKey, responseBody, Duration.ofHours(24));
            }
        } catch (Exception ex) {
            log.warn("Failed to store idempotency key in Redis: {}", ex.getMessage());
        }
    }
}
