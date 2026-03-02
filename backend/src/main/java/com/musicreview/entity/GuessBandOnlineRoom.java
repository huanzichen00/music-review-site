package com.musicreview.entity;

import com.musicreview.entity.enums.GuessBandRoomStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "guess_band_online_rooms")
public class GuessBandOnlineRoom {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "room_code", nullable = false, unique = true, length = 16)
    private String roomCode;

    @Column(name = "invite_token", nullable = false, unique = true, length = 64)
    private String inviteToken;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private GuessBandRoomStatus status = GuessBandRoomStatus.WAITING;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_bank_id")
    private QuestionBank questionBank;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "target_artist_id")
    private Artist targetArtist;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_user_id")
    private User ownerUser;

    @Column(name = "owner_player_token", nullable = false, length = 64)
    private String ownerPlayerToken;

    @Column(name = "max_attempts", nullable = false)
    @Builder.Default
    private Integer maxAttempts = 10;

    @Column(name = "total_rounds")
    @Builder.Default
    private Integer totalRounds = 1;

    @Column(name = "current_round")
    @Builder.Default
    private Integer currentRound = 0;

    @Column(name = "timed_mode")
    @Builder.Default
    private Boolean timedMode = false;

    @Column(name = "round_time_limit_seconds")
    private Integer roundTimeLimitSeconds;

    @Column(name = "round_started_at")
    private LocalDateTime roundStartedAt;

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "finished_at")
    private LocalDateTime finishedAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
