package com.musicreview.controller;

import com.musicreview.dto.album.AlbumRequest;
import com.musicreview.dto.album.AlbumResponse;
import com.musicreview.dto.search.HotSearchResponse;
import com.musicreview.service.AlbumService;
import com.musicreview.service.SearchAnalyticsService;
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
@RequestMapping("/api/albums")
@RequiredArgsConstructor
public class AlbumController {

    private final AlbumService albumService;
    private final SearchAnalyticsService searchAnalyticsService;

    /**
     * 获取全部专辑
     * GET /api/albums
     */
    @GetMapping
    public ResponseEntity<Page<AlbumResponse>> getAllAlbums(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(albumService.getAllAlbums(pageable));
    }

    /**
     * 按标题首字母获取专辑
     * GET /api/albums/initial/{letter}
     */
    @GetMapping("/initial/{letter}")
    public ResponseEntity<Page<AlbumResponse>> getAlbumsByInitial(
            @PathVariable String letter,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(albumService.getAlbumsByInitial(letter, pageable));
    }

    /**
     * 按 ID 获取专辑（包含完整详情）
     * GET /api/albums/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getAlbumById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(albumService.getAlbumById(id));
        } catch (Exception e) {
            e.printStackTrace();
            String errorMsg = e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName();
            return ResponseEntity.status(404).body(Map.of("error", errorMsg));
        }
    }

    /**
     * 获取某位艺术家的专辑
     * GET /api/albums/artist/{artistId}
     */
    @GetMapping("/artist/{artistId}")
    public ResponseEntity<Page<AlbumResponse>> getAlbumsByArtist(
            @PathVariable Long artistId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(albumService.getAlbumsByArtist(artistId, pageable));
    }

    /**
     * 获取某个流派下的专辑
     * GET /api/albums/genre/{genreId}
     */
    @GetMapping("/genre/{genreId}")
    public ResponseEntity<Page<AlbumResponse>> getAlbumsByGenre(
            @PathVariable Long genreId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(albumService.getAlbumsByGenre(genreId, pageable));
    }

    /**
     * 按发行年份获取专辑
     * GET /api/albums/year/{year}
     */
    @GetMapping("/year/{year}")
    public ResponseEntity<Page<AlbumResponse>> getAlbumsByYear(
            @PathVariable Integer year,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(albumService.getAlbumsByYear(year, pageable));
    }

    /**
     * 获取全部可用发行年份
     * GET /api/albums/years
     */
    @GetMapping("/years")
    public ResponseEntity<List<Integer>> getAllReleaseYears() {
        return ResponseEntity.ok(albumService.getAllReleaseYears());
    }

    /**
     * 按标题搜索专辑
     * GET /api/albums/search?q=xxx
     */
    @GetMapping("/search")
    public ResponseEntity<Page<AlbumResponse>> searchAlbums(
            @RequestParam("q") String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        Page<AlbumResponse> result = (albumService.searchAlbums(query, pageable));

        if (!result.isEmpty()) {
            searchAnalyticsService.recordAlbumSearch(query);
        }

        return ResponseEntity.ok(result);

    }

    /**
     * 创建专辑
     * POST /api/albums
     */
    @PostMapping
    public ResponseEntity<?> createAlbum(@Valid @RequestBody AlbumRequest request) {
        try {
            AlbumResponse response = albumService.createAlbum(request);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * 更新专辑
     * PUT /api/albums/{id}
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> updateAlbum(@PathVariable Long id, @Valid @RequestBody AlbumRequest request) {
        try {
            AlbumResponse response = albumService.updateAlbum(id, request);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * 删除专辑
     * DELETE /api/albums/{id}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteAlbum(@PathVariable Long id) {
        try {
            albumService.deleteAlbum(id);
            return ResponseEntity.ok(Map.of("message", "Album deleted successfully"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/hot-searches")
    public ResponseEntity<List<HotSearchResponse>> getHotSearches(
        @RequestParam(defaultValue = "10") Integer limit
    ) {
        return ResponseEntity.ok(searchAnalyticsService.getAlbumHotSearches(limit));
    }
}
