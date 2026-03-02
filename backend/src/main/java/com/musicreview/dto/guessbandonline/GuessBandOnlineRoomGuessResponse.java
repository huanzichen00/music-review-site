package com.musicreview.dto.guessbandonline;

import com.musicreview.entity.GuessBandOnlineGuess;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class GuessBandOnlineRoomGuessResponse {

    private Long id;
    private String playerDisplayName;
    private Integer playerSeatIndex;
    private String artistName;
    private Boolean correct;
    private LocalDateTime createdAt;

    public static GuessBandOnlineRoomGuessResponse fromEntity(GuessBandOnlineGuess guess) {
        return GuessBandOnlineRoomGuessResponse.builder()
                .id(guess.getId())
                .playerDisplayName(guess.getPlayer().getDisplayName())
                .playerSeatIndex(guess.getPlayer().getSeatIndex())
                .artistName(guess.getGuessedArtist().getName())
                .correct(guess.getCorrect())
                .createdAt(guess.getCreatedAt())
                .build();
    }
}
