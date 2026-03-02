package com.musicreview.dto.guessbandonline;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class GuessBandOnlineGuessRequest {

    @NotBlank(message = "playerToken is required")
    private String playerToken;

    @NotNull(message = "artistId is required")
    private Long artistId;
}
