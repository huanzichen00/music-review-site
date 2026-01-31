package com.musicreview.service;

import com.musicreview.dto.review.ReviewRequest;
import com.musicreview.dto.review.ReviewResponse;
import com.musicreview.entity.Album;
import com.musicreview.entity.Review;
import com.musicreview.entity.User;
import com.musicreview.repository.AlbumRepository;
import com.musicreview.repository.ReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final AlbumRepository albumRepository;
    private final AuthService authService;

    /**
     * Get reviews for an album
     */
    public List<ReviewResponse> getReviewsByAlbum(Long albumId) {
        return reviewRepository.findByAlbumIdOrderByCreatedAtDesc(albumId).stream()
                .map(ReviewResponse::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Get current user's reviews
     */
    public List<ReviewResponse> getMyReviews() {
        User currentUser = authService.getCurrentUser();
        return reviewRepository.findByUserIdOrderByCreatedAtDesc(currentUser.getId()).stream()
                .map(ReviewResponse::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Get current user's review for an album
     */
    public ReviewResponse getMyReviewForAlbum(Long albumId) {
        User currentUser = authService.getCurrentUser();
        return reviewRepository.findByUserIdAndAlbumId(currentUser.getId(), albumId)
                .map(ReviewResponse::fromEntity)
                .orElse(null);
    }

    /**
     * Create or update a review
     */
    @Transactional
    public ReviewResponse createOrUpdateReview(ReviewRequest request) {
        User currentUser = authService.getCurrentUser();

        // Get album
        Album album = albumRepository.findById(request.getAlbumId())
                .orElseThrow(() -> new RuntimeException("Album not found with id: " + request.getAlbumId()));

        // Check if review already exists
        Review review = reviewRepository.findByUserIdAndAlbumId(currentUser.getId(), request.getAlbumId())
                .orElse(null);

        if (review == null) {
            // Create new review
            review = Review.builder()
                    .user(currentUser)
                    .album(album)
                    .rating(request.getRating())
                    .content(request.getContent())
                    .build();
        } else {
            // Update existing review
            review.setRating(request.getRating());
            review.setContent(request.getContent());
        }

        Review saved = reviewRepository.save(review);
        return ReviewResponse.fromEntity(saved);
    }

    /**
     * Delete a review
     */
    @Transactional
    public void deleteReview(Long reviewId) {
        User currentUser = authService.getCurrentUser();

        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new RuntimeException("Review not found with id: " + reviewId));

        // Check if the review belongs to current user
        if (!review.getUser().getId().equals(currentUser.getId())) {
            throw new RuntimeException("You can only delete your own reviews");
        }

        reviewRepository.delete(review);
    }

    /**
     * Get average rating for an album
     */
    public Double getAverageRating(Long albumId) {
        Double avg = reviewRepository.getAverageRatingByAlbumId(albumId);
        return avg != null ? Math.round(avg * 10.0) / 10.0 : null;
    }

    /**
     * Get review count for an album
     */
    public long getReviewCount(Long albumId) {
        return reviewRepository.countByAlbumId(albumId);
    }
}
