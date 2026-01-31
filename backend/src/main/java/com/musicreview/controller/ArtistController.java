package com.musicreview.controller;

import com.musicreview.dto.artist.ArtistRequest;
import com.musicreview.dto.artist.ArtistResponse;
import com.musicreview.service.ArtistService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
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
     * Get all artists
     * GET /api/artists
     */
    @GetMapping
    public ResponseEntity<List<ArtistResponse>> getAllArtists() {
        return ResponseEntity.ok(artistService.getAllArtists());
    }

    /**
     * Get artists by initial letter
     * GET /api/artists/initial/{letter}
     */
    @GetMapping("/initial/{letter}")
    public ResponseEntity<List<ArtistResponse>> getArtistsByInitial(@PathVariable String letter) {
        return ResponseEntity.ok(artistService.getArtistsByInitial(letter));
    }

    /**
     * Get artist by ID
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
     * Search artists by name
     * GET /api/artists/search?q=xxx
     */
    @GetMapping("/search")
    public ResponseEntity<List<ArtistResponse>> searchArtists(@RequestParam("q") String query) {
        return ResponseEntity.ok(artistService.searchArtists(query));
    }

    /**
     * Create a new artist
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
     * Update an artist
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
     * Delete an artist
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
