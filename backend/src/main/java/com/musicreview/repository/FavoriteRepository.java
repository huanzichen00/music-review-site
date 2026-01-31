package com.musicreview.repository;

import com.musicreview.entity.Favorite;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FavoriteRepository extends JpaRepository<Favorite, Long> {

    List<Favorite> findByUserIdOrderByCreatedAtDesc(Long userId);

    Optional<Favorite> findByUserIdAndAlbumId(Long userId, Long albumId);

    boolean existsByUserIdAndAlbumId(Long userId, Long albumId);

    void deleteByUserIdAndAlbumId(Long userId, Long albumId);

    long countByAlbumId(Long albumId);

    int countByUserId(Long userId);
}
