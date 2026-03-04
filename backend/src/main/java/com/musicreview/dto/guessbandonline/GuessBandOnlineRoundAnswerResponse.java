package com.musicreview.dto.guessbandonline;

import com.musicreview.entity.Artist;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class GuessBandOnlineRoundAnswerResponse {

    private Long artistId;
    private String artistName;
    private String artistPhotoUrl;

    public static GuessBandOnlineRoundAnswerResponse fromArtist(Artist artist) {
        if (artist == null) {
            return null;
        }

        return GuessBandOnlineRoundAnswerResponse.builder()
                .artistId(artist.getId())
                .artistName(artist.getName())
                .artistPhotoUrl(artist.getPhotoUrl())
                .build();
    }
}
