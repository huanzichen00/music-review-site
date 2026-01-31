package com.musicreview.controller;

import com.musicreview.dto.user.UserProfileRequest;
import com.musicreview.dto.user.UserProfileResponse;
import com.musicreview.entity.User;
import com.musicreview.repository.FavoriteRepository;
import com.musicreview.repository.ReviewRepository;
import com.musicreview.repository.UserRepository;
import com.musicreview.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;
    private final ReviewRepository reviewRepository;
    private final FavoriteRepository favoriteRepository;
    private final AuthService authService;

    /**
     * Get current user profile
     * GET /api/users/me
     */
    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUserProfile() {
        try {
            User user = authService.getCurrentUser();
            int reviewCount = reviewRepository.countByUserId(user.getId());
            int favoriteCount = favoriteRepository.countByUserId(user.getId());
            return ResponseEntity.ok(UserProfileResponse.fromEntity(user, reviewCount, favoriteCount));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Update current user profile
     * PUT /api/users/me
     */
    @PutMapping("/me")
    public ResponseEntity<?> updateCurrentUserProfile(@Valid @RequestBody UserProfileRequest request) {
        try {
            User user = authService.getCurrentUser();
            
            if (request.getAvatarUrl() != null) {
                user.setAvatarUrl(request.getAvatarUrl());
            }
            if (request.getBio() != null) {
                user.setBio(request.getBio());
            }
            
            User saved = userRepository.save(user);
            return ResponseEntity.ok(UserProfileResponse.fromEntity(saved));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Get user profile by ID (public)
     * GET /api/users/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getUserProfile(@PathVariable Long id) {
        try {
            User user = userRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("User not found"));
            int reviewCount = reviewRepository.countByUserId(id);
            int favoriteCount = favoriteRepository.countByUserId(id);
            return ResponseEntity.ok(UserProfileResponse.fromEntity(user, reviewCount, favoriteCount));
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }
}
