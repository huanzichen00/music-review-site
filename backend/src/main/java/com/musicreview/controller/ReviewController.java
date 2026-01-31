package com.musicreview.controller;

import com.musicreview.dto.review.ReviewRequest;
import com.musicreview.dto.review.ReviewResponse;
import com.musicreview.service.ReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    /**
     * Get recent reviews (top 10)
     * GET /api/reviews/recent
     */
    @GetMapping("/recent")
    public ResponseEntity<List<ReviewResponse>> getRecentReviews() {
        return ResponseEntity.ok(reviewService.getRecentReviews());
    }

    /**
     * Get reviews for an album
     * GET /api/reviews/album/{albumId}
     */
    @GetMapping("/album/{albumId}")
    public ResponseEntity<List<ReviewResponse>> getReviewsByAlbum(@PathVariable Long albumId) {
        return ResponseEntity.ok(reviewService.getReviewsByAlbum(albumId));
    }

    /**
     * Get current user's reviews
     * GET /api/reviews/my
     */
    @GetMapping("/my")
    public ResponseEntity<List<ReviewResponse>> getMyReviews() {
        return ResponseEntity.ok(reviewService.getMyReviews());
    }

    /**
     * Get current user's review for an album
     * GET /api/reviews/my/{albumId}
     */
    @GetMapping("/my/{albumId}")
    public ResponseEntity<?> getMyReviewForAlbum(@PathVariable Long albumId) {
        ReviewResponse review = reviewService.getMyReviewForAlbum(albumId);
        if (review == null) {
            return ResponseEntity.ok(Map.of("exists", false));
        }
        return ResponseEntity.ok(review);
    }

    /**
     * Create or update a review
     * POST /api/reviews
     */
    @PostMapping
    public ResponseEntity<?> createOrUpdateReview(@Valid @RequestBody ReviewRequest request) {
        try {
            ReviewResponse response = reviewService.createOrUpdateReview(request);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Delete a review
     * DELETE /api/reviews/{id}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteReview(@PathVariable Long id) {
        try {
            reviewService.deleteReview(id);
            return ResponseEntity.ok(Map.of("message", "Review deleted successfully"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Get album stats (average rating, review count)
     * GET /api/reviews/stats/{albumId}
     */
    @GetMapping("/stats/{albumId}")
    public ResponseEntity<Map<String, Object>> getAlbumStats(@PathVariable Long albumId) {
        Double avgRating = reviewService.getAverageRating(albumId);
        long reviewCount = reviewService.getReviewCount(albumId);
        return ResponseEntity.ok(Map.of(
                "averageRating", avgRating != null ? avgRating : 0,
                "reviewCount", reviewCount
        ));
    }
}
