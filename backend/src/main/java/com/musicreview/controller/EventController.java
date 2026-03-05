package com.musicreview.controller;

import com.musicreview.security.UserDetailsImpl;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.Set;
import java.util.concurrent.TimeUnit;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class EventController {

    private static final Set<String> ALLOWED_EVENTS = Set.of(
            "page_view",
            "game_start",
            "guess_submit",
            "game_finish"
    );

    private final JdbcTemplate jdbcTemplate;

    @PostMapping("/event")
    public ResponseEntity<Void> trackEvent(
            HttpServletRequest request,
            @RequestBody(required = false) Map<String, String> body
    ) {
        if (body == null) {
            return ResponseEntity.badRequest().build();
        }

        String event = normalize(body.get("event"), 50);
        String page = normalize(body.get("page"), 100);
        if (!ALLOWED_EVENTS.contains(event) || page == null || page.isBlank()) {
            return ResponseEntity.badRequest().build();
        }

        String ip = extractIp(request);
        String userAgent = normalize(request.getHeader("User-Agent"), 2000);
        String userId = resolveUserId();

        jdbcTemplate.update(
                "INSERT INTO events(event_type,page,user_id,ip,user_agent) VALUES (?,?,?,?,?)",
                event, page, userId, ip, userAgent
        );

        return ResponseEntity.noContent()
                .cacheControl(CacheControl.maxAge(0, TimeUnit.SECONDS).cachePrivate().mustRevalidate().noStore())
                .build();
    }

    private String resolveUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return "guest";
        }
        Object principal = authentication.getPrincipal();
        if (principal instanceof UserDetailsImpl details && details.getId() != null) {
            return String.valueOf(details.getId());
        }
        return "guest";
    }

    private String extractIp(HttpServletRequest request) {
        String cfConnectingIp = normalize(request.getHeader("CF-Connecting-IP"), 64);
        if (cfConnectingIp != null && !cfConnectingIp.isBlank()) {
            return cfConnectingIp;
        }
        String xForwardedFor = normalize(request.getHeader("X-Forwarded-For"), 255);
        if (xForwardedFor != null && !xForwardedFor.isBlank()) {
            String[] parts = xForwardedFor.split(",");
            if (parts.length > 0) {
                String firstIp = normalize(parts[0], 64);
                if (firstIp != null && !firstIp.isBlank()) {
                    return firstIp;
                }
            }
        }
        return normalize(request.getRemoteAddr(), 64);
    }

    private String normalize(String value, int maxLength) {
        if (value == null) {
            return null;
        }
        String normalized = value.trim();
        if (normalized.length() <= maxLength) {
            return normalized;
        }
        return normalized.substring(0, maxLength);
    }
}
