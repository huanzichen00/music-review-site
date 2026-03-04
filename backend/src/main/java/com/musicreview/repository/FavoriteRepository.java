package com.musicreview.repository;

import com.musicreview.dto.favorite.FavoriteResponse;
import com.musicreview.entity.Favorite;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
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

    @Query("""
            SELECT new com.musicreview.dto.favorite.FavoriteResponse(
                f.id,
                a.id,
                a.title,
                a.coverUrl,
                a.releaseYear,
                ar.id,
                ar.name,
                f.createdAt
            )
            FROM Favorite f
            JOIN f.album a
            JOIN a.artist ar
            WHERE f.user.id = :userId
            ORDER BY f.createdAt DESC
            """)
    Page<FavoriteResponse> findFavoriteResponsesByUserId(@Param("userId") Long userId, Pageable pageable);
}
