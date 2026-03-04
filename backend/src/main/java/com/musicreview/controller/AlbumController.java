package com.musicreview.controller;

import com.musicreview.dto.album.AlbumRequest;
import com.musicreview.dto.album.AlbumResponse;
import com.musicreview.service.AlbumService;
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

    /**
     * Get all albums
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
     * Get albums by title initial letter
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
     * Get album by ID (with full details)
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
     * Get albums by artist
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
     * Get albums by genre
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
     * Get albums by release year
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
     * Get all available release years
     * GET /api/albums/years
     */
    @GetMapping("/years")
    public ResponseEntity<List<Integer>> getAllReleaseYears() {
        return ResponseEntity.ok(albumService.getAllReleaseYears());
    }

    /**
     * Search albums by title
     * GET /api/albums/search?q=xxx
     */
    @GetMapping("/search")
    public ResponseEntity<Page<AlbumResponse>> searchAlbums(
            @RequestParam("q") String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(albumService.searchAlbums(query, pageable));
    }

    /**
     * Create a new album
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
     * Update an album
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
     * Delete an album
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
}
