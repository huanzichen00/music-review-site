package com.musicreview.controller;

import com.musicreview.dto.album.AlbumRequest;
import com.musicreview.dto.album.AlbumResponse;
import com.musicreview.service.AlbumService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
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
    public ResponseEntity<List<AlbumResponse>> getAllAlbums() {
        return ResponseEntity.ok(albumService.getAllAlbums());
    }

    /**
     * Get albums by title initial letter
     * GET /api/albums/initial/{letter}
     */
    @GetMapping("/initial/{letter}")
    public ResponseEntity<List<AlbumResponse>> getAlbumsByInitial(@PathVariable String letter) {
        return ResponseEntity.ok(albumService.getAlbumsByInitial(letter));
    }

    /**
     * Get album by ID (with full details)
     * GET /api/albums/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getAlbumById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(albumService.getAlbumById(id));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Get albums by artist
     * GET /api/albums/artist/{artistId}
     */
    @GetMapping("/artist/{artistId}")
    public ResponseEntity<List<AlbumResponse>> getAlbumsByArtist(@PathVariable Long artistId) {
        return ResponseEntity.ok(albumService.getAlbumsByArtist(artistId));
    }

    /**
     * Get albums by genre
     * GET /api/albums/genre/{genreId}
     */
    @GetMapping("/genre/{genreId}")
    public ResponseEntity<List<AlbumResponse>> getAlbumsByGenre(@PathVariable Long genreId) {
        return ResponseEntity.ok(albumService.getAlbumsByGenre(genreId));
    }

    /**
     * Get albums by release year
     * GET /api/albums/year/{year}
     */
    @GetMapping("/year/{year}")
    public ResponseEntity<List<AlbumResponse>> getAlbumsByYear(@PathVariable Integer year) {
        return ResponseEntity.ok(albumService.getAlbumsByYear(year));
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
    public ResponseEntity<List<AlbumResponse>> searchAlbums(@RequestParam("q") String query) {
        return ResponseEntity.ok(albumService.searchAlbums(query));
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
