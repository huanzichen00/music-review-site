package com.musicreview.dto.guessbandonline;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class GuessBandOnlineJoinResponse {

    private String playerToken;
    private GuessBandOnlineRoomResponse room;
}
