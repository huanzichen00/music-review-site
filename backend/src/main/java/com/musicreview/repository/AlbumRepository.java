package com.musicreview.repository;

import com.musicreview.dto.album.AlbumResponse;
import com.musicreview.entity.Album;
import com.musicreview.repository.projection.ArtistAlbumCountProjection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AlbumRepository extends JpaRepository<Album, Long> {

    @Query(value = """
            SELECT new com.musicreview.dto.album.AlbumResponse(
                a.id,
                a.title,
                a.titleInitial,
                a.releaseYear,
                a.coverUrl,
                ar.id,
                ar.name
            )
            FROM Album a
            JOIN a.artist ar
            ORDER BY a.createdAt DESC
            """,
            countQuery = "SELECT COUNT(a.id) FROM Album a")
    Page<AlbumResponse> findAlbumSummaries(Pageable pageable);

    @Query("SELECT a FROM Album a " +
           "LEFT JOIN FETCH a.artist " +
           "LEFT JOIN FETCH a.genres " +
           "WHERE a.id = :id")
    Optional<Album> findByIdWithDetails(@Param("id") Long id);

    Page<Album> findByTitleInitialOrderByTitleAsc(String titleInitial, Pageable pageable);

    Page<Album> findByArtistIdOrderByReleaseYearDesc(Long artistId, Pageable pageable);

    Page<Album> findAllByOrderByCreatedAtDesc(Pageable pageable);

    Page<Album> findByTitleContainingIgnoreCase(String title, Pageable pageable);

    @Query("SELECT a FROM Album a JOIN a.genres g WHERE g.id = :genreId ORDER BY a.title ASC")
    Page<Album> findByGenreId(@Param("genreId") Long genreId, Pageable pageable);

    @Query("SELECT a FROM Album a WHERE a.releaseYear = :year ORDER BY a.title ASC")
    Page<Album> findByReleaseYear(@Param("year") Integer year, Pageable pageable);

    @Query("SELECT DISTINCT a.releaseYear FROM Album a WHERE a.releaseYear IS NOT NULL ORDER BY a.releaseYear DESC")
    List<Integer> findAllReleaseYears();

    @Query("SELECT g.id AS genreId, COUNT(a.id) AS albumCount FROM Genre g LEFT JOIN g.albums a WHERE g.id IN :genreIds GROUP BY g.id")
    List<com.musicreview.repository.projection.GenreAlbumCountProjection> countByGenreIds(@Param("genreIds") List<Long> genreIds);

    @Query("SELECT a.artist.id AS artistId, COUNT(a.id) AS albumCount FROM Album a WHERE a.artist.id IN :artistIds GROUP BY a.artist.id")
    List<ArtistAlbumCountProjection> countByArtistIds(@Param("artistIds") List<Long> artistIds);

    long countByArtistId(Long artistId);

    @Query("SELECT COUNT(a.id) FROM Album a JOIN a.genres g WHERE g.id = :genreId")
    long countByGenreId(@Param("genreId") Long genreId);
}
