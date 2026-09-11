package com.Project.UPI_Simulation.service;

import com.Project.UPI_Simulation.exception.RateLimitExceededException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@Service
@Slf4j
public class RateLimitService {

    private final Optional<StringRedisTemplate> redisTemplate;
    private final boolean enabled;
    private final int authLimit;
    private final int paymentLimit;
    private final int generalLimit;
    private final ConcurrentHashMap<String, WindowCounter> fallbackCounters = new ConcurrentHashMap<>();

    public RateLimitService(
            Optional<StringRedisTemplate> redisTemplate,
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

    public void checkAuthLimit(String key) {
        checkLimit("auth:" + key, authLimit);
    }

    public void checkPaymentLimit(String key) {
        checkLimit("payment:" + key, paymentLimit);
    }

    public void checkGeneralLimit(String key) {
        checkLimit("general:" + key, generalLimit);
    }

    private void checkLimit(String key, int limit) {
        if (!enabled) {
            return;
        }
        try {
            if (redisTemplate.isPresent()) {
                checkWithRedis(key, limit);
            } else {
                checkWithFallback(key, limit);
            }
        } catch (RateLimitExceededException ex) {
            throw ex;
        } catch (Exception ex) {
            log.warn("Rate limiting degraded for key {}: {}", key, ex.getMessage());
            checkWithFallback(key, limit);
        }
    }

    private void checkWithRedis(String key, int limit) {
        String redisKey = "ratelimit:" + key;
        Long count = redisTemplate.get().opsForValue().increment(redisKey);
        if (count != null && count == 1L) {
            redisTemplate.get().expire(redisKey, Duration.ofMinutes(1));
        }
        if (count != null && count > limit) {
            throw new RateLimitExceededException("Too many requests. Please try again later.");
        }
    }

    private void checkWithFallback(String key, int limit) {
        long window = System.currentTimeMillis() / 60_000;
        String counterKey = key + ":" + window;
        WindowCounter counter = fallbackCounters.computeIfAbsent(counterKey, k -> new WindowCounter());
        if (counter.incrementAndGet() > limit) {
            throw new RateLimitExceededException("Too many requests. Please try again later.");
        }
    }

    private static class WindowCounter {
        private final AtomicInteger count = new AtomicInteger(0);

        int incrementAndGet() {
            return count.incrementAndGet();
        }
    }
}
