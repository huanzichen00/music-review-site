package com.musicreview.controller;

import com.musicreview.dto.genre.GenreRequest;
import com.musicreview.dto.genre.GenreResponse;
import com.musicreview.service.GenreService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/genres")
@RequiredArgsConstructor
public class GenreController {

    private final GenreService genreService;

    /**
     * 获取全部流派
     * GET /api/genres
     */
    @GetMapping
    public ResponseEntity<List<GenreResponse>> getAllGenres() {
        return ResponseEntity.ok(genreService.getAllGenres());
    }

    /**
     * 按 ID 获取流派
     * GET /api/genres/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getGenreById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(genreService.getGenreById(id));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * 创建流派
     * POST /api/genres
     */
    @PostMapping
    public ResponseEntity<?> createGenre(@Valid @RequestBody GenreRequest request) {
        try {
            GenreResponse response = genreService.createGenre(request);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * 删除流派
     * DELETE /api/genres/{id}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteGenre(@PathVariable Long id) {
        try {
            genreService.deleteGenre(id);
            return ResponseEntity.ok(Map.of("message", "Genre deleted successfully"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
