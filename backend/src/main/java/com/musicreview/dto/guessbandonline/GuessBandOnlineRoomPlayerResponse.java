package com.musicreview.dto.guessbandonline;

import com.musicreview.entity.GuessBandOnlinePlayer;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class GuessBandOnlineRoomPlayerResponse {

    private Long id;
    private Integer seatIndex;
    private String displayName;
    private String avatarUrl;
    private Boolean ready;
    private Integer guessCount;
    private Boolean host;

    public static GuessBandOnlineRoomPlayerResponse fromEntity(
            GuessBandOnlinePlayer player,
            int guessCount,
            boolean host
    ) {
        return GuessBandOnlineRoomPlayerResponse.builder()
                .id(player.getId())
                .seatIndex(player.getSeatIndex())
                .displayName(player.getDisplayName())
                .avatarUrl(player.getUser() != null ? player.getUser().getAvatarUrl() : null)
                .ready(player.getReady())
                .guessCount(guessCount)
                .host(host)
                .build();
    }
}
