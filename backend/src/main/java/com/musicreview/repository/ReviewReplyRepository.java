package com.musicreview.repository;

import com.musicreview.entity.ReviewReply;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReviewReplyRepository extends JpaRepository<ReviewReply, Long> {

    List<ReviewReply> findByReviewIdOrderByCreatedAtAsc(Long reviewId);

    int countByReviewId(Long reviewId);

    List<ReviewReply> findByUserIdOrderByCreatedAtDesc(Long userId);
}
