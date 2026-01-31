package com.musicreview.dto.album;

import com.musicreview.dto.artist.ArtistResponse;
import com.musicreview.entity.Album;
import com.musicreview.entity.Genre;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AlbumResponse {

    private Long id;
    private String title;
    private String titleInitial;
    private Integer releaseYear;
    private String coverUrl;
    private String description;
    private LocalDateTime createdAt;

    // Artist info
    private Long artistId;
    private String artistName;

    // Genres
    private Set<GenreDTO> genres;

    // Tracks
    private List<TrackDTO> tracks;

    // Stats
    private Integer trackCount;
    private Integer totalDuration; // in seconds
    private String formattedTotalDuration;
    private Double averageRating;
    private Integer reviewCount;
    private Integer favoriteCount;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class GenreDTO {
        private Long id;
        private String name;

        public static GenreDTO fromEntity(Genre genre) {
            return GenreDTO.builder()
                    .id(genre.getId())
                    .name(genre.getName())
                    .build();
        }
    }

    public static AlbumResponse fromEntity(Album album) {
        // Calculate total duration
        int totalDuration = album.getTracks() != null
                ? album.getTracks().stream()
                    .filter(t -> t.getDuration() != null)
                    .mapToInt(t -> t.getDuration())
                    .sum()
                : 0;

        // Calculate average rating
        Double avgRating = album.getReviews() != null && !album.getReviews().isEmpty()
                ? album.getReviews().stream()
                    .filter(r -> r.getRating() != null)
                    .mapToDouble(r -> r.getRating().doubleValue())
                    .average()
                    .orElse(0.0)
                : null;

        return AlbumResponse.builder()
                .id(album.getId())
                .title(album.getTitle())
                .titleInitial(album.getTitleInitial())
                .releaseYear(album.getReleaseYear())
                .coverUrl(album.getCoverUrl())
                .description(album.getDescription())
                .createdAt(album.getCreatedAt())
                .artistId(album.getArtist().getId())
                .artistName(album.getArtist().getName())
                .genres(album.getGenres() != null
                        ? album.getGenres().stream()
                            .map(GenreDTO::fromEntity)
                            .collect(Collectors.toSet())
                        : null)
                .tracks(album.getTracks() != null
                        ? album.getTracks().stream()
                            .map(TrackDTO::fromEntity)
                            .collect(Collectors.toList())
                        : null)
                .trackCount(album.getTracks() != null ? album.getTracks().size() : 0)
                .totalDuration(totalDuration)
                .formattedTotalDuration(formatDuration(totalDuration))
                .averageRating(avgRating != null ? Math.round(avgRating * 10.0) / 10.0 : null)
                .reviewCount(album.getReviews() != null ? album.getReviews().size() : 0)
                .favoriteCount(album.getFavorites() != null ? album.getFavorites().size() : 0)
                .build();
    }

    public static AlbumResponse fromEntitySimple(Album album) {
        return AlbumResponse.builder()
                .id(album.getId())
                .title(album.getTitle())
                .titleInitial(album.getTitleInitial())
                .releaseYear(album.getReleaseYear())
                .coverUrl(album.getCoverUrl())
                .artistId(album.getArtist().getId())
                .artistName(album.getArtist().getName())
                .build();
    }

    private static String formatDuration(int totalSeconds) {
        int hours = totalSeconds / 3600;
        int minutes = (totalSeconds % 3600) / 60;
        int seconds = totalSeconds % 60;

        if (hours > 0) {
            return String.format("%d:%02d:%02d", hours, minutes, seconds);
        }
        return String.format("%d:%02d", minutes, seconds);
    }
}
