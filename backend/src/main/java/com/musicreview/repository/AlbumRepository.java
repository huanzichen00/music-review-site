package com.musicreview.repository;

import com.musicreview.entity.Album;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AlbumRepository extends JpaRepository<Album, Long> {

    List<Album> findByTitleInitialOrderByTitleAsc(String titleInitial);

    List<Album> findByArtistIdOrderByReleaseYearDesc(Long artistId);

    List<Album> findAllByOrderByCreatedAtDesc();

    List<Album> findByTitleContainingIgnoreCase(String title);

    @Query("SELECT a FROM Album a JOIN a.genres g WHERE g.id = :genreId ORDER BY a.title ASC")
    List<Album> findByGenreId(@Param("genreId") Long genreId);

    @Query("SELECT a FROM Album a WHERE a.releaseYear = :year ORDER BY a.title ASC")
    List<Album> findByReleaseYear(@Param("year") Integer year);

    @Query("SELECT DISTINCT a.releaseYear FROM Album a WHERE a.releaseYear IS NOT NULL ORDER BY a.releaseYear DESC")
    List<Integer> findAllReleaseYears();
}
