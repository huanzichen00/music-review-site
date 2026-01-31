package com.musicreview.repository;

import com.musicreview.entity.Review;
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
}
