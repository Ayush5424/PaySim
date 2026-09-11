package com.Project.UPI_Simulation.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@Slf4j
@Service
public class RateLimitingService {

    private final StringRedisTemplate redisTemplate;
    private final boolean enabled;
    private final int authLimit;
    private final int paymentLimit;
    private final int generalLimit;

    // Fallback in-memory map when Redis is offline
    private final Map<String, TokenBucket> inMemoryBuckets = new ConcurrentHashMap<>();

    public RateLimitingService(
            StringRedisTemplate redisTemplate,
            @Value("${app.rate-limiting.enabled:true}") boolean enabled,
            @Value("${app.rate-limiting.auth-requests-per-minute:30}") int authLimit,
            @Value("${app.rate-limiting.payment-requests-per-minute:20}") int paymentLimit,
            @Value("${app.rate-limiting.general-requests-per-minute:120}") int generalLimit
    ) {
        this.redisTemplate = redisTemplate;
        this.enabled = enabled;
        this.authLimit = authLimit;
        this.paymentLimit = paymentLimit;
        this.generalLimit = generalLimit;
    }

    public boolean isAllowed(String key, String type) {
        if (!enabled) {
            return true;
        }

        int maxRequests = switch (type.toLowerCase()) {
            case "auth" -> authLimit;
            case "payment" -> paymentLimit;
            default -> generalLimit;
        };

        String redisKey = "rate_limit:" + type + ":" + key;

        try {
            if (redisTemplate != null) {
                Long current = redisTemplate.opsForValue().increment(redisKey);
                if (current != null && current == 1) {
                    redisTemplate.expire(redisKey, Duration.ofMinutes(1));
                }
                return current != null && current <= maxRequests;
            }
        } catch (Exception ex) {
            log.warn("Redis rate limiting unavailable, falling back to in-memory: {}", ex.getMessage());
        }

        // Fallback to in-memory rate limiting
        long currentWindow = System.currentTimeMillis() / 60000;
        String memoryKey = redisKey + ":" + currentWindow;
        TokenBucket bucket = inMemoryBuckets.computeIfAbsent(memoryKey, k -> new TokenBucket());
        return bucket.incrementAndGet() <= maxRequests;
    }

    private static class TokenBucket {
        private final AtomicInteger count = new AtomicInteger(0);

        public int incrementAndGet() {
            return count.incrementAndGet();
        }
    }
}
