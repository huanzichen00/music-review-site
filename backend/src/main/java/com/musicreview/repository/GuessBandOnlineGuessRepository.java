package com.musicreview.repository;

import com.musicreview.entity.GuessBandOnlineGuess;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GuessBandOnlineGuessRepository extends JpaRepository<GuessBandOnlineGuess, Long> {

    List<GuessBandOnlineGuess> findByRoomIdOrderByCreatedAtAsc(Long roomId);

    int countByRoomId(Long roomId);

    int countByRoomIdAndPlayerId(Long roomId, Long playerId);

    int countByRoomIdAndPlayerIdAndRoundIndex(Long roomId, Long playerId, Integer roundIndex);

    int countByRoomIdAndRoundIndex(Long roomId, Integer roundIndex);
}
