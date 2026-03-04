package com.musicreview.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class LoginThrottleService {

    private final int maxAttempts;
    private final long windowSeconds;
    private final long lockSeconds;
    private final Map<String, AttemptState> attempts = new ConcurrentHashMap<>();

    public LoginThrottleService(
            @Value("${app.auth.login.max-attempts:8}") int maxAttempts,
            @Value("${app.auth.login.window-seconds:300}") long windowSeconds,
            @Value("${app.auth.login.lock-seconds:900}") long lockSeconds
    ) {
        this.maxAttempts = maxAttempts;
        this.windowSeconds = windowSeconds;
        this.lockSeconds = lockSeconds;
    }

    public String buildThrottleKey(String username, String clientIp) {
        String safeUsername = username == null ? "" : username.trim().toLowerCase(Locale.ROOT);
        String safeIp = clientIp == null ? "unknown" : clientIp.trim();
        return safeIp + "|" + safeUsername;
    }

    public long getRetryAfterSeconds(String key) {
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
        attempts.remove(key);
    }

    private long nowEpochSecond() {
        return Instant.now().getEpochSecond();
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
