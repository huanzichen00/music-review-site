package com.musicreview.repository;

import com.musicreview.entity.Track;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TrackRepository extends JpaRepository<Track, Long> {

    List<Track> findByAlbumIdOrderByTrackNumberAsc(Long albumId);

    void deleteByAlbumId(Long albumId);
}
