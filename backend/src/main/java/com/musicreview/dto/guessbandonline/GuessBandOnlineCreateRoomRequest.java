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

    @Min(value = 1, message = "totalRounds must be at least 1")
    @Max(value = 10, message = "totalRounds must be at most 10")
    private Integer totalRounds;

    private Boolean timedMode;

    @Min(value = 10, message = "roundTimeLimitSeconds must be at least 10")
    @Max(value = 300, message = "roundTimeLimitSeconds must be at most 300")
    private Integer roundTimeLimitSeconds;
}
