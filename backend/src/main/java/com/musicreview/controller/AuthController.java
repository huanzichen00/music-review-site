package com.musicreview.controller;

import com.musicreview.dto.auth.AuthResponse;
import com.musicreview.dto.auth.LoginRequest;
import com.musicreview.dto.auth.RegisterRequest;
import com.musicreview.service.AuthService;
import com.musicreview.service.LoginThrottleService;
import com.musicreview.service.SecurityAuditService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private static final String AUTH_COOKIE_NAME = "auth_token";

    private final AuthService authService;
    private final LoginThrottleService loginThrottleService;
    private final SecurityAuditService securityAuditService;
    @Value("${jwt.expiration}")
    private long jwtExpirationMs;
    @Value("${app.auth.cookie-secure:true}")
    private boolean cookieSecure;

    /**
     * Register a new user
     * POST /api/auth/register
     */
    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request, HttpServletRequest httpRequest) {
        String ip = extractClientIp(httpRequest);
        try {
            AuthResponse response = authService.register(request);
            securityAuditService.log("register_success", request.getUsername(), ip, "user_registered");
            ResponseCookie cookie = buildAuthCookie(response.getToken(), httpRequest);
            response.setToken(null);
            return ResponseEntity.ok()
                    .header(HttpHeaders.SET_COOKIE, cookie.toString())
                    .body(response);
        } catch (RuntimeException e) {
            securityAuditService.log("register_failed", request.getUsername(), ip, e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Login user
     * POST /api/auth/login
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request, HttpServletRequest httpRequest) {
        String ip = extractClientIp(httpRequest);
        String throttleKey = loginThrottleService.buildThrottleKey(request.getUsername(), ip);
        if (loginThrottleService.isBlocked(throttleKey)) {
            securityAuditService.log("login_blocked", request.getUsername(), ip, "rate_limit");
            return ResponseEntity.status(429).body(Map.of(
                    "error", "Too many login attempts. Please try again later.",
                    "retryAfterSeconds", loginThrottleService.getRetryAfterSeconds(throttleKey)
            ));
        }
        try {
            AuthResponse response = authService.login(request);
            loginThrottleService.recordSuccess(throttleKey);
            securityAuditService.log("login_success", request.getUsername(), ip, "authenticated");
            ResponseCookie cookie = buildAuthCookie(response.getToken(), httpRequest);
            response.setToken(null);
            return ResponseEntity.ok()
                    .header(HttpHeaders.SET_COOKIE, cookie.toString())
                    .body(response);
        } catch (Exception e) {
            loginThrottleService.recordFailure(throttleKey);
            if (loginThrottleService.isBlocked(throttleKey)) {
                securityAuditService.log("login_blocked", request.getUsername(), ip, "rate_limit_after_failure");
                return ResponseEntity.status(429).body(Map.of(
                        "error", "Too many login attempts. Please try again later.",
                        "retryAfterSeconds", loginThrottleService.getRetryAfterSeconds(throttleKey)
                ));
            }
            securityAuditService.log("login_failed", request.getUsername(), ip, "invalid_credentials");
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid username or password"));
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletRequest httpRequest) {
        String ip = extractClientIp(httpRequest);
        ResponseCookie clearCookie = clearAuthCookie(httpRequest);
        securityAuditService.log("logout", "-", ip, "cookie_cleared");
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, clearCookie.toString())
                .body(Map.of("message", "Logged out"));
    }

    @GetMapping("/csrf")
    public ResponseEntity<?> csrf(CsrfToken csrfToken) {
        return ResponseEntity.ok(Map.of(
                "token", csrfToken.getToken(),
                "headerName", csrfToken.getHeaderName(),
                "parameterName", csrfToken.getParameterName()
        ));
    }

    /**
     * Get current user info
     * GET /api/auth/me
     */
    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser() {
        try {
            var user = authService.getCurrentUser();
            return ResponseEntity.ok(Map.of(
                    "id", user.getId(),
                    "username", user.getUsername(),
                    "email", user.getEmail(),
                    "role", user.getRole(),
                    "avatarUrl", user.getAvatarUrl() != null ? user.getAvatarUrl() : "",
                    "bio", user.getBio() != null ? user.getBio() : ""
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    private ResponseCookie buildAuthCookie(String token, HttpServletRequest request) {
        return ResponseCookie.from(AUTH_COOKIE_NAME, token)
                .httpOnly(true)
                .secure(isSecureRequest(request))
                .path("/")
                .sameSite("Lax")
                .maxAge(jwtExpirationMs / 1000)
                .build();
    }

    private ResponseCookie clearAuthCookie(HttpServletRequest request) {
        return ResponseCookie.from(AUTH_COOKIE_NAME, "")
                .httpOnly(true)
                .secure(isSecureRequest(request))
                .path("/")
                .sameSite("Lax")
                .maxAge(0)
                .build();
    }

    private boolean isSecureRequest(HttpServletRequest request) {
        if (cookieSecure) {
            return true;
        }
        String forwardedProto = request.getHeader("X-Forwarded-Proto");
        return request.isSecure() || "https".equalsIgnoreCase(forwardedProto);
    }

    private String extractClientIp(HttpServletRequest request) {
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            return forwardedFor.split(",")[0].trim();
        }
        String realIp = request.getHeader("X-Real-IP");
        if (realIp != null && !realIp.isBlank()) {
            return realIp.trim();
        }
        return request.getRemoteAddr();
    }
}
