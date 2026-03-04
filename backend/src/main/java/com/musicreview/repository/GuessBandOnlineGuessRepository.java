package com.musicreview.repository;

import com.musicreview.entity.GuessBandOnlineGuess;
import com.musicreview.repository.projection.PlayerGuessCountProjection;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GuessBandOnlineGuessRepository extends JpaRepository<GuessBandOnlineGuess, Long> {

    List<GuessBandOnlineGuess> findByRoomIdOrderByCreatedAtAsc(Long roomId);

    @EntityGraph(attributePaths = {"player", "guessedArtist", "targetArtist"})
    List<GuessBandOnlineGuess> findTop80ByRoomIdOrderByCreatedAtDesc(Long roomId);

    int countByRoomId(Long roomId);

    int countByRoomIdAndPlayerId(Long roomId, Long playerId);

    int countByRoomIdAndPlayerIdAndRoundIndex(Long roomId, Long playerId, Integer roundIndex);

    int countByRoomIdAndRoundIndex(Long roomId, Integer roundIndex);

    void deleteByRoomId(Long roomId);

    @Query("""
            SELECT g.player.id AS playerId, COUNT(g.id) AS guessCount
            FROM GuessBandOnlineGuess g
            WHERE g.room.id = :roomId
            GROUP BY g.player.id
            """)
    List<PlayerGuessCountProjection> countByRoomIdGroupByPlayer(@Param("roomId") Long roomId);

    @Query("""
            SELECT g.player.id AS playerId, COUNT(g.id) AS guessCount
            FROM GuessBandOnlineGuess g
            WHERE g.room.id = :roomId
              AND g.roundIndex = :roundIndex
            GROUP BY g.player.id
            """)
    List<PlayerGuessCountProjection> countByRoomIdAndRoundGroupByPlayer(@Param("roomId") Long roomId, @Param("roundIndex") Integer roundIndex);
}
