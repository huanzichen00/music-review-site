package com.musicreview.dto.questionbank;

import com.musicreview.entity.QuestionBank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuestionBankDetailResponse {

    private Long id;
    private String name;
    private String visibility;
    private String shareToken;
    private Long ownerUserId;
    private String ownerUsername;
    private Integer itemCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<QuestionBankArtistResponse> artists;

    public static QuestionBankDetailResponse fromEntity(QuestionBank questionBank, List<QuestionBankArtistResponse> artists) {
        return QuestionBankDetailResponse.builder()
                .id(questionBank.getId())
                .name(questionBank.getName())
                .visibility(questionBank.getVisibility().name())
                .shareToken(questionBank.getShareToken())
                .ownerUserId(questionBank.getOwnerUser().getId())
                .ownerUsername(questionBank.getOwnerUser().getUsername())
                .itemCount(artists.size())
                .createdAt(questionBank.getCreatedAt())
                .updatedAt(questionBank.getUpdatedAt())
                .artists(artists)
                .build();
    }
}
