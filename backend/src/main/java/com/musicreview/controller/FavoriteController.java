package com.musicreview.controller;

import com.musicreview.dto.favorite.FavoriteResponse;
import com.musicreview.service.FavoriteService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/favorites")
@RequiredArgsConstructor
public class FavoriteController {

    private final FavoriteService favoriteService;

    /**
     * Get current user's favorites
     * GET /api/favorites
     */
    @GetMapping
    public ResponseEntity<List<FavoriteResponse>> getMyFavorites() {
        return ResponseEntity.ok(favoriteService.getMyFavorites());
    }

    /**
     * Check if album is favorited
     * GET /api/favorites/check/{albumId}
     */
    @GetMapping("/check/{albumId}")
    public ResponseEntity<Map<String, Boolean>> checkFavorite(@PathVariable Long albumId) {
        boolean isFavorited = favoriteService.isFavorited(albumId);
        return ResponseEntity.ok(Map.of("isFavorited", isFavorited));
    }

    /**
     * Add album to favorites
     * POST /api/favorites/{albumId}
     */
    @PostMapping("/{albumId}")
    public ResponseEntity<?> addFavorite(@PathVariable Long albumId) {
        try {
            FavoriteResponse response = favoriteService.addFavorite(albumId);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Remove album from favorites
     * DELETE /api/favorites/{albumId}
     */
    @DeleteMapping("/{albumId}")
    public ResponseEntity<?> removeFavorite(@PathVariable Long albumId) {
        try {
            favoriteService.removeFavorite(albumId);
            return ResponseEntity.ok(Map.of("message", "Removed from favorites"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
