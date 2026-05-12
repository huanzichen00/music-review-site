package com.musicreview.controller;

import com.musicreview.dto.favorite.FavoriteResponse;
import com.musicreview.service.FavoriteService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/favorites")
@RequiredArgsConstructor
public class FavoriteController {

    private final FavoriteService favoriteService;

    /**
     * 获取当前用户的收藏
     * GET /api/favorites
     */
    @GetMapping
    public ResponseEntity<Page<FavoriteResponse>> getMyFavorites(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(favoriteService.getMyFavorites(pageable));
    }

    /**
     * 检查专辑是否已被收藏
     * GET /api/favorites/check/{albumId}
     */
    @GetMapping("/check/{albumId}")
    public ResponseEntity<Map<String, Boolean>> checkFavorite(@PathVariable Long albumId) {
        boolean isFavorited = favoriteService.isFavorited(albumId);
        return ResponseEntity.ok(Map.of("isFavorited", isFavorited));
    }

    /**
     * 收藏专辑
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
     * 取消收藏专辑
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
