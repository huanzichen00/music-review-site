package com.musicreview.repository;

import com.musicreview.entity.Artist;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ArtistRepository extends JpaRepository<Artist, Long> {

    Page<Artist> findByNameInitialOrderByNameAsc(String nameInitial, Pageable pageable);

    Page<Artist> findAllByOrderByNameAsc(Pageable pageable);

    Page<Artist> findByNameContainingIgnoreCase(String name, Pageable pageable);

    boolean existsByName(String name);

    @Query("""
            SELECT a FROM Artist a
            WHERE a.name IS NOT NULL
              AND a.country IS NOT NULL
              AND a.formedYear IS NOT NULL
              AND a.genre IS NOT NULL
              AND a.memberCount IS NOT NULL
              AND a.status IS NOT NULL
            """)
    List<Artist> findPlayableArtists();

    @Query("""
            SELECT a FROM QuestionBankItem qbi
            JOIN qbi.artist a
            WHERE qbi.questionBank.id = :questionBankId
              AND a.name IS NOT NULL
              AND a.country IS NOT NULL
              AND a.formedYear IS NOT NULL
              AND a.genre IS NOT NULL
              AND a.memberCount IS NOT NULL
              AND a.status IS NOT NULL
            """)
    List<Artist> findPlayableArtistsByQuestionBankId(@Param("questionBankId") Long questionBankId);
}
