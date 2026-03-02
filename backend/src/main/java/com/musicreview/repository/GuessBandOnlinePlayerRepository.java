package com.musicreview.repository;

import com.musicreview.entity.GuessBandOnlinePlayer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GuessBandOnlinePlayerRepository extends JpaRepository<GuessBandOnlinePlayer, Long> {

    List<GuessBandOnlinePlayer> findByRoomIdOrderBySeatIndexAsc(Long roomId);

    Optional<GuessBandOnlinePlayer> findByRoomIdAndPlayerToken(Long roomId, String playerToken);
}

