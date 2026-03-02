package com.musicreview.dto.guessbandonline;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class GuessBandOnlineStartRequest {

    @NotBlank(message = "playerToken is required")
    private String playerToken;
}
