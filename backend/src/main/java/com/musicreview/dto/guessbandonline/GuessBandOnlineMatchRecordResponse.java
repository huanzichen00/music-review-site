package com.musicreview.dto.guessbandonline;

import com.musicreview.entity.GuessBandOnlineMatchRecord;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class GuessBandOnlineMatchRecordResponse {

    private Long id;
    private String roomCode;
    private String questionBankName;
    private String hostDisplayName;
    private String guestDisplayName;
    private String winnerDisplayName;
    private Integer totalGuesses;
    private LocalDateTime startedAt;
    private LocalDateTime finishedAt;
    private LocalDateTime createdAt;

    public static GuessBandOnlineMatchRecordResponse fromEntity(GuessBandOnlineMatchRecord record) {
        return GuessBandOnlineMatchRecordResponse.builder()
                .id(record.getId())
                .roomCode(record.getRoomCode())
                .questionBankName(record.getQuestionBank() != null ? record.getQuestionBank().getName() : null)
                .hostDisplayName(record.getHostDisplayName())
                .guestDisplayName(record.getGuestDisplayName())
                .winnerDisplayName(record.getWinnerDisplayName())
                .totalGuesses(record.getTotalGuesses())
                .startedAt(record.getStartedAt())
                .finishedAt(record.getFinishedAt())
                .createdAt(record.getCreatedAt())
                .build();
    }
}
