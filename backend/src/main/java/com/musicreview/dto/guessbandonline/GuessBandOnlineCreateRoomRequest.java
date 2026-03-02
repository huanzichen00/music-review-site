package com.musicreview.dto.guessbandonline;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class GuessBandOnlineCreateRoomRequest {

    @NotBlank(message = "Display name is required")
    private String displayName;

    private Long questionBankId;

    @Min(value = 1, message = "maxAttempts must be at least 1")
    @Max(value = 30, message = "maxAttempts must be at most 30")
    private Integer maxAttempts;
}
