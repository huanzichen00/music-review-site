package com.musicreview.controller;

import com.musicreview.dto.review.ReviewRequest;
import com.musicreview.dto.review.ReviewResponse;
import com.musicreview.service.ReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    /**
     * 获取最新评论（前 10 条）
     * GET /api/reviews/recent
     */
    @GetMapping("/recent")
    public ResponseEntity<Page<ReviewResponse>> getRecentReviews(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(reviewService.getRecentReviews(pageable));
    }

    /**
     * 获取某张专辑的评论
     * GET /api/reviews/album/{albumId}
     */
    @GetMapping("/album/{albumId}")
    public ResponseEntity<Page<ReviewResponse>> getReviewsByAlbum(
            @PathVariable Long albumId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(reviewService.getReviewsByAlbum(albumId, pageable));
    }

    /**
     * 获取当前用户的评论
     * GET /api/reviews/my
     */
    @GetMapping("/my")
    public ResponseEntity<Page<ReviewResponse>> getMyReviews(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(reviewService.getMyReviews(pageable));
    }

    /**
     * 获取当前用户对某张专辑的评论
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
     * 创建或更新评论
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
     * 删除评论
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
     * 获取专辑统计信息（平均分、评论数）
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
