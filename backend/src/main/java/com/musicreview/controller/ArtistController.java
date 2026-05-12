package com.musicreview.controller;

import com.musicreview.dto.artist.ArtistRequest;
import com.musicreview.dto.artist.ArtistResponse;
import com.musicreview.dto.artist.ArtistSearchItemResponse;
import com.musicreview.service.ArtistService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/artists")
@RequiredArgsConstructor
public class ArtistController {

    private final ArtistService artistService;

    /**
     * 获取全部艺术家
     * GET /api/artists
     */
    @GetMapping
    public ResponseEntity<Page<ArtistResponse>> getAllArtists(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(artistService.getAllArtists(pageable));
    }

    /**
     * 按首字母获取艺术家
     * GET /api/artists/initial/{letter}
     */
    @GetMapping("/initial/{letter}")
    public ResponseEntity<Page<ArtistResponse>> getArtistsByInitial(
            @PathVariable String letter,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(artistService.getArtistsByInitial(letter, pageable));
    }

    /**
     * 按 ID 获取艺术家
     * GET /api/artists/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getArtistById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(artistService.getArtistById(id));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * 按名称搜索艺术家
     * GET /api/artists/search?q=xxx
     */
    @GetMapping(value = "/search", params = {"q", "!limit"})
    public ResponseEntity<Page<ArtistResponse>> searchArtists(
            @RequestParam("q") String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(artistService.searchArtists(query, pageable));
    }

    /**
     * 搜索艺术家名称（轻量结果）
     * GET /api/artists/search?q=xxx&limit=20
     */
    @GetMapping(value = "/search", params = {"q", "limit"})
    public ResponseEntity<List<ArtistSearchItemResponse>> searchArtistNames(
            @RequestParam("q") String query,
            @RequestParam(defaultValue = "20") Integer limit
    ) {
        return ResponseEntity.ok(artistService.searchArtistNames(query, limit));
    }

    /**
     * 创建艺术家
     * POST /api/artists
     */
    @PostMapping
    public ResponseEntity<?> createArtist(@Valid @RequestBody ArtistRequest request) {
        try {
            ArtistResponse response = artistService.createArtist(request);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * 更新艺术家
     * PUT /api/artists/{id}
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> updateArtist(@PathVariable Long id, @Valid @RequestBody ArtistRequest request) {
        try {
            ArtistResponse response = artistService.updateArtist(id, request);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * 删除艺术家
     * DELETE /api/artists/{id}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteArtist(@PathVariable Long id) {
        try {
            artistService.deleteArtist(id);
            return ResponseEntity.ok(Map.of("message", "Artist deleted successfully"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
