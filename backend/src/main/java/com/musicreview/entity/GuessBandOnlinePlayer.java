package com.musicreview.entity;

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
@Table(
        name = "guess_band_online_players",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_guess_band_room_player_token", columnNames = {"room_id", "player_token"})
        }
)
public class GuessBandOnlinePlayer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "room_id", nullable = false)
    private GuessBandOnlineRoom room;

    @Column(name = "player_token", nullable = false, length = 64)
    private String playerToken;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "display_name", nullable = false, length = 80)
    private String displayName;

    @Column(name = "seat_index", nullable = false)
    private Integer seatIndex;

    @Column(name = "is_ready", nullable = false)
    @Builder.Default
    private Boolean ready = false;

    @Column(name = "last_seen_at")
    private LocalDateTime lastSeenAt;

    @CreationTimestamp
    @Column(name = "joined_at", updatable = false)
    private LocalDateTime joinedAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}

