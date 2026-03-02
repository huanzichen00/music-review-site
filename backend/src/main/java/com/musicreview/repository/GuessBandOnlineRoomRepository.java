package com.musicreview.repository;

import com.musicreview.entity.GuessBandOnlineRoom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface GuessBandOnlineRoomRepository extends JpaRepository<GuessBandOnlineRoom, Long> {

    Optional<GuessBandOnlineRoom> findByRoomCode(String roomCode);

    Optional<GuessBandOnlineRoom> findByInviteToken(String inviteToken);
}

