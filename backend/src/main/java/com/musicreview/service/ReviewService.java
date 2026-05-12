package com.musicreview.service;

import com.musicreview.dto.review.ReviewRequest;
import com.musicreview.dto.review.ReviewResponse;
import com.musicreview.entity.Album;
import com.musicreview.entity.Review;
import com.musicreview.entity.User;
import com.musicreview.repository.AlbumRepository;
import com.musicreview.repository.ReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final AlbumRepository albumRepository;
    private final AuthService authService;

    /**
     * 获取某张专辑的评论
     */
    public Page<ReviewResponse> getReviewsByAlbum(Long albumId, Pageable pageable) {
        return reviewRepository.findReviewResponsesByAlbumId(albumId, pageable);
    }

    /**
     * 获取当前用户的评论
     */
    public Page<ReviewResponse> getMyReviews(Pageable pageable) {
        User currentUser = authService.getCurrentUser();
        return reviewRepository.findReviewResponsesByUserId(currentUser.getId(), pageable);
    }

    /**
     * 获取当前用户对某张专辑的评论
     */
    public ReviewResponse getMyReviewForAlbum(Long albumId) {
        User currentUser = authService.getCurrentUser();
        return reviewRepository.findReviewResponseByUserIdAndAlbumId(currentUser.getId(), albumId)
                .orElse(null);
    }

    /**
     * 创建或更新评论
     */
    @Transactional
    public ReviewResponse createOrUpdateReview(ReviewRequest request) {
        User currentUser = authService.getCurrentUser();

        // 查询专辑
        Album album = albumRepository.findById(request.getAlbumId())
                .orElseThrow(() -> new RuntimeException("Album not found with id: " + request.getAlbumId()));

        // 检查评论是否已存在
        Review review = reviewRepository.findByUserIdAndAlbumId(currentUser.getId(), request.getAlbumId())
                .orElse(null);

        if (review == null) {
            // 创建新评论
            review = Review.builder()
                    .user(currentUser)
                    .album(album)
                    .rating(request.getRating())
                    .content(request.getContent())
                    .build();
        } else {
            // 更新已有评论
            review.setRating(request.getRating());
            review.setContent(request.getContent());
        }

        Review saved = reviewRepository.save(review);
        return ReviewResponse.fromEntity(saved);
    }

    /**
     * 删除评论
     */
    @Transactional
    public void deleteReview(Long reviewId) {
        User currentUser = authService.getCurrentUser();

        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new RuntimeException("Review not found with id: " + reviewId));

        // 检查评论是否属于当前用户
        if (!review.getUser().getId().equals(currentUser.getId())) {
            throw new RuntimeException("You can only delete your own reviews");
        }

        reviewRepository.delete(review);
    }

    /**
     * 获取专辑平均评分
     */
    public Double getAverageRating(Long albumId) {
        Double avg = reviewRepository.getAverageRatingByAlbumId(albumId);
        return avg != null ? Math.round(avg * 10.0) / 10.0 : null;
    }

    /**
     * 获取专辑评论数
     */
    public long getReviewCount(Long albumId) {
        return reviewRepository.countByAlbumId(albumId);
    }

    /**
     * 获取最新评论（前 10 条）
     */
    public Page<ReviewResponse> getRecentReviews(Pageable pageable) {
        return reviewRepository.findRecentReviewResponses(pageable);
    }
}
