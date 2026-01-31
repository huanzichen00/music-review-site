package com.musicreview.repository;

import com.musicreview.entity.Artist;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ArtistRepository extends JpaRepository<Artist, Long> {

    List<Artist> findByNameInitialOrderByNameAsc(String nameInitial);

    List<Artist> findAllByOrderByNameAsc();

    List<Artist> findByNameContainingIgnoreCase(String name);

    boolean existsByName(String name);
}
