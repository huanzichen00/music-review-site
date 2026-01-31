package com.musicreview.dto.favorite;

import com.musicreview.entity.Favorite;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FavoriteResponse {

    private Long id;
    private Long albumId;
    private String albumTitle;
    private String albumCoverUrl;
    private Integer releaseYear;
    private Long artistId;
    private String artistName;
    private LocalDateTime createdAt;

    public static FavoriteResponse fromEntity(Favorite favorite) {
        return FavoriteResponse.builder()
                .id(favorite.getId())
                .albumId(favorite.getAlbum().getId())
                .albumTitle(favorite.getAlbum().getTitle())
                .albumCoverUrl(favorite.getAlbum().getCoverUrl())
                .releaseYear(favorite.getAlbum().getReleaseYear())
                .artistId(favorite.getAlbum().getArtist().getId())
                .artistName(favorite.getAlbum().getArtist().getName())
                .createdAt(favorite.getCreatedAt())
                .build();
    }
}
