package com.musicreview.repository;

import com.musicreview.dto.review.ReviewResponse;
import com.musicreview.entity.Review;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {

    List<Review> findByAlbumIdOrderByCreatedAtDesc(Long albumId);

    List<Review> findByUserIdOrderByCreatedAtDesc(Long userId);

    Optional<Review> findByUserIdAndAlbumId(Long userId, Long albumId);

    boolean existsByUserIdAndAlbumId(Long userId, Long albumId);

    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.album.id = :albumId")
    Double getAverageRatingByAlbumId(@Param("albumId") Long albumId);

    long countByAlbumId(Long albumId);

    int countByUserId(Long userId);

    // Get recent reviews ordered by creation time
    List<Review> findTop10ByOrderByCreatedAtDesc();

    @Query("""
            SELECT new com.musicreview.dto.review.ReviewResponse(
                r.id,
                u.id,
                u.username,
                u.avatarUrl,
                a.id,
                a.title,
                a.coverUrl,
                ar.name,
                r.rating,
                r.content,
                r.createdAt,
                r.updatedAt
            )
            FROM Review r
            JOIN r.user u
            JOIN r.album a
            JOIN a.artist ar
            WHERE a.id = :albumId
            """)
    Page<ReviewResponse> findReviewResponsesByAlbumId(@Param("albumId") Long albumId, Pageable pageable);

    @Query("""
            SELECT new com.musicreview.dto.review.ReviewResponse(
                r.id,
                u.id,
                u.username,
                u.avatarUrl,
                a.id,
                a.title,
                a.coverUrl,
                ar.name,
                r.rating,
                r.content,
                r.createdAt,
                r.updatedAt
            )
            FROM Review r
            JOIN r.user u
            JOIN r.album a
            JOIN a.artist ar
            WHERE u.id = :userId
            """)
    Page<ReviewResponse> findReviewResponsesByUserId(@Param("userId") Long userId, Pageable pageable);

    @Query("""
            SELECT new com.musicreview.dto.review.ReviewResponse(
                r.id,
                u.id,
                u.username,
                u.avatarUrl,
                a.id,
                a.title,
                a.coverUrl,
                ar.name,
                r.rating,
                r.content,
                r.createdAt,
                r.updatedAt
            )
            FROM Review r
            JOIN r.user u
            JOIN r.album a
            JOIN a.artist ar
            WHERE u.id = :userId AND a.id = :albumId
            """)
    Optional<ReviewResponse> findReviewResponseByUserIdAndAlbumId(@Param("userId") Long userId, @Param("albumId") Long albumId);

    @Query("""
            SELECT new com.musicreview.dto.review.ReviewResponse(
                r.id,
                u.id,
                u.username,
                u.avatarUrl,
                a.id,
                a.title,
                a.coverUrl,
                ar.name,
                r.rating,
                r.content,
                r.createdAt,
                r.updatedAt
            )
            FROM Review r
            JOIN r.user u
            JOIN r.album a
            JOIN a.artist ar
            ORDER BY r.createdAt DESC
            """)
    Page<ReviewResponse> findRecentReviewResponses(Pageable pageable);
}
