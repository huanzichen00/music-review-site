package com.musicreview.dto.guessbandonline;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class GuessBandOnlineJoinRoomRequest {

    @NotBlank(message = "Display name is required")
    private String displayName;

    @NotBlank(message = "Room code or invite token is required")
    private String roomCodeOrToken;
}
