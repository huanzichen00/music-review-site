package com.musicreview.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

@Service
public class LoginThrottleService {

    private static final Logger LOG = LoggerFactory.getLogger(LoginThrottleService.class);

    private final int maxAttempts;
    private final long windowSeconds;
    private final long lockSeconds;
    private final boolean redisEnabled;
    private final StringRedisTemplate redisTemplate;
    private final Map<String, AttemptState> attempts = new ConcurrentHashMap<>();

    public LoginThrottleService(
            @Value("${app.auth.login.max-attempts:8}") int maxAttempts,
            @Value("${app.auth.login.window-seconds:300}") long windowSeconds,
            @Value("${app.auth.login.lock-seconds:900}") long lockSeconds,
            @Value("${app.auth.login.redis.enabled:true}") boolean redisEnabled,
            ObjectProvider<StringRedisTemplate> redisTemplateProvider
    ) {
        this.maxAttempts = maxAttempts;
        this.windowSeconds = windowSeconds;
        this.lockSeconds = lockSeconds;
        this.redisEnabled = redisEnabled;
        this.redisTemplate = redisTemplateProvider.getIfAvailable();
    }

    public String buildThrottleKey(String username, String clientIp) {
        String safeUsername = username == null ? "" : username.trim().toLowerCase(Locale.ROOT);
        String safeIp = clientIp == null ? "unknown" : clientIp.trim();
        return safeIp + "|" + safeUsername;
    }

    public long getRetryAfterSeconds(String key) {
        Long redisRetryAfter = getRetryAfterSecondsFromRedis(key);
        if (redisRetryAfter != null) {
            return Math.max(redisRetryAfter, 0);
        }

        AttemptState state = attempts.get(key);
        if (state == null) {
            return 0;
        }
        return state.getRetryAfterSeconds(nowEpochSecond());
    }

    public boolean isBlocked(String key) {
        return getRetryAfterSeconds(key) > 0;
    }

    public void recordFailure(String key) {
        if (recordFailureToRedis(key)) {
            return;
        }

        long now = nowEpochSecond();
        AttemptState state = attempts.computeIfAbsent(key, k -> new AttemptState());
        synchronized (state) {
            state.pruneOld(now, windowSeconds);
            state.failures.addLast(now);
            if (state.failures.size() >= maxAttempts) {
                state.blockedUntil = now + lockSeconds;
                state.failures.clear();
            }
        }
    }

    public void recordSuccess(String key) {
        if (redisEnabled && redisTemplate != null) {
            try {
                redisTemplate.delete(failureKey(key));
                redisTemplate.delete(blockedKey(key));
            } catch (Exception e) {
                LOG.warn("Failed to clear redis throttle key, fallback to memory only: {}", e.getMessage());
            }
        }
        attempts.remove(key);
    }

    private long nowEpochSecond() {
        return Instant.now().getEpochSecond();
    }

    private Long getRetryAfterSecondsFromRedis(String key) {
        if (!redisEnabled || redisTemplate == null) {
            return null;
        }
        try {
            Long ttl = redisTemplate.getExpire(blockedKey(key), TimeUnit.SECONDS);
            if (ttl == null || ttl <= 0) {
                return 0L;
            }
            return ttl;
        } catch (Exception e) {
            LOG.warn("Redis unavailable for throttle query, fallback to memory: {}", e.getMessage());
            return null;
        }
    }

    private boolean recordFailureToRedis(String key) {
        if (!redisEnabled || redisTemplate == null) {
            return false;
        }
        try {
            Long count = redisTemplate.opsForValue().increment(failureKey(key));
            if (count != null && count == 1L) {
                redisTemplate.expire(failureKey(key), windowSeconds, TimeUnit.SECONDS);
            }
            if (count != null && count >= maxAttempts) {
                redisTemplate.opsForValue().set(blockedKey(key), "1", lockSeconds, TimeUnit.SECONDS);
                redisTemplate.delete(failureKey(key));
            }
            return true;
        } catch (Exception e) {
            LOG.warn("Redis unavailable for throttle write, fallback to memory: {}", e.getMessage());
            return false;
        }
    }

    private String failureKey(String key) {
        return "auth:login:fail:" + key;
    }

    private String blockedKey(String key) {
        return "auth:login:block:" + key;
    }

    private static class AttemptState {
        private final Deque<Long> failures = new ArrayDeque<>();
        private long blockedUntil = 0;

        private void pruneOld(long now, long windowSeconds) {
            while (!failures.isEmpty() && now - failures.peekFirst() > windowSeconds) {
                failures.pollFirst();
            }
        }

        private long getRetryAfterSeconds(long now) {
            if (blockedUntil <= now) {
                return 0;
            }
            return blockedUntil - now;
        }
    }
}
