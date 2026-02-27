package com.musicreview.dto.questionbank;

import com.musicreview.entity.QuestionBank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuestionBankSummaryResponse {

    private Long id;
    private String name;
    private String visibility;
    private String shareToken;
    private Long ownerUserId;
    private String ownerUsername;
    private Integer itemCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static QuestionBankSummaryResponse fromEntity(QuestionBank questionBank, int itemCount) {
        return QuestionBankSummaryResponse.builder()
                .id(questionBank.getId())
                .name(questionBank.getName())
                .visibility(questionBank.getVisibility().name())
                .shareToken(questionBank.getShareToken())
                .ownerUserId(questionBank.getOwnerUser().getId())
                .ownerUsername(questionBank.getOwnerUser().getUsername())
                .itemCount(itemCount)
                .createdAt(questionBank.getCreatedAt())
                .updatedAt(questionBank.getUpdatedAt())
                .build();
    }
}
