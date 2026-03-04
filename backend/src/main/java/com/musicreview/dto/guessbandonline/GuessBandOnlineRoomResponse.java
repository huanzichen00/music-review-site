package com.musicreview.dto.guessbandonline;

import com.musicreview.entity.enums.GuessBandRoomStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class GuessBandOnlineRoomResponse {

    private String roomCode;
    private String inviteToken;
    private GuessBandRoomStatus status;
    private Integer maxAttempts;
    private Integer totalRounds;
    private Integer currentRound;
    private Boolean timedMode;
    private Integer roundTimeLimitSeconds;
    private LocalDateTime roundStartedAt;
    private Long questionBankId;
    private String questionBankName;
    private LocalDateTime startedAt;
    private LocalDateTime finishedAt;
    private String winnerDisplayName;
    private Boolean awaitingNextRound;
    private GuessBandOnlineRoundAnswerResponse roundAnswer;
    private List<GuessBandOnlineRoomPlayerResponse> players;
    private List<GuessBandOnlineRoomGuessResponse> guesses;
}
