package com.musicreview.service;

import com.musicreview.dto.reply.ReplyRequest;
import com.musicreview.dto.reply.ReplyResponse;
import com.musicreview.entity.Review;
import com.musicreview.entity.ReviewReply;
import com.musicreview.entity.User;
import com.musicreview.repository.ReviewReplyRepository;
import com.musicreview.repository.ReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReplyService {

    private final ReviewReplyRepository replyRepository;
    private final ReviewRepository reviewRepository;
    private final AuthService authService;

    /**
     * Get replies for a review
     */
    public List<ReplyResponse> getRepliesByReview(Long reviewId) {
        return replyRepository.findByReviewIdOrderByCreatedAtAsc(reviewId).stream()
                .map(ReplyResponse::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Create a reply
     */
    @Transactional
    public ReplyResponse createReply(ReplyRequest request) {
        User currentUser = authService.getCurrentUser();

        Review review = reviewRepository.findById(request.getReviewId())
                .orElseThrow(() -> new RuntimeException("Review not found"));

        ReviewReply reply = ReviewReply.builder()
                .review(review)
                .user(currentUser)
                .content(request.getContent())
                .build();

        ReviewReply saved = replyRepository.save(reply);
        return ReplyResponse.fromEntity(saved);
    }

    /**
     * Update a reply
     */
    @Transactional
    public ReplyResponse updateReply(Long replyId, String content) {
        User currentUser = authService.getCurrentUser();

        ReviewReply reply = replyRepository.findById(replyId)
                .orElseThrow(() -> new RuntimeException("Reply not found"));

        if (!reply.getUser().getId().equals(currentUser.getId())) {
            throw new RuntimeException("You can only edit your own replies");
        }

        reply.setContent(content);
        ReviewReply saved = replyRepository.save(reply);
        return ReplyResponse.fromEntity(saved);
    }

    /**
     * Delete a reply
     */
    @Transactional
    public void deleteReply(Long replyId) {
        User currentUser = authService.getCurrentUser();

        ReviewReply reply = replyRepository.findById(replyId)
                .orElseThrow(() -> new RuntimeException("Reply not found"));

        if (!reply.getUser().getId().equals(currentUser.getId())) {
            throw new RuntimeException("You can only delete your own replies");
        }

        replyRepository.delete(reply);
    }

    /**
     * Get reply count for a review
     */
    public int getReplyCount(Long reviewId) {
        return replyRepository.countByReviewId(reviewId);
    }
}
