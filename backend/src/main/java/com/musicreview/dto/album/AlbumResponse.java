package com.musicreview.dto.album;

import com.musicreview.entity.Album;
import com.musicreview.entity.Genre;
import com.musicreview.entity.Track;
import com.musicreview.entity.Review;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
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
        AlbumResponse.AlbumResponseBuilder builder = AlbumResponse.builder()
                .id(album.getId())
                .title(album.getTitle())
                .titleInitial(album.getTitleInitial())
                .releaseYear(album.getReleaseYear())
                .coverUrl(album.getCoverUrl())
                .description(album.getDescription())
                .createdAt(album.getCreatedAt())
                .artistId(album.getArtist() != null ? album.getArtist().getId() : null)
                .artistName(album.getArtist() != null ? album.getArtist().getName() : null);

        // Safely copy tracks
        List<TrackDTO> trackList = new ArrayList<>();
        int totalDuration = 0;
        try {
            if (album.getTracks() != null) {
                for (Track track : new ArrayList<>(album.getTracks())) {
                    trackList.add(TrackDTO.fromEntity(track));
                    if (track.getDuration() != null) {
                        totalDuration += track.getDuration();
                    }
                }
            }
        } catch (Exception e) {
            // Ignore lazy loading errors
        }
        builder.tracks(trackList);
        builder.trackCount(trackList.size());
        builder.totalDuration(totalDuration);
        builder.formattedTotalDuration(formatDuration(totalDuration));

        // Safely copy genres
        Set<GenreDTO> genreSet = new HashSet<>();
        try {
            if (album.getGenres() != null) {
                for (Genre genre : new HashSet<>(album.getGenres())) {
                    genreSet.add(GenreDTO.fromEntity(genre));
                }
            }
        } catch (Exception e) {
            // Ignore lazy loading errors
        }
        builder.genres(genreSet);

        // Safely get review stats
        Double avgRating = null;
        int reviewCount = 0;
        try {
            if (album.getReviews() != null && !album.getReviews().isEmpty()) {
                List<Review> reviews = new ArrayList<>(album.getReviews());
                reviewCount = reviews.size();
                double sum = 0;
                int count = 0;
                for (Review r : reviews) {
                    if (r.getRating() != null) {
                        sum += r.getRating().doubleValue();
                        count++;
                    }
                }
                if (count > 0) {
                    avgRating = Math.round(sum / count * 10.0) / 10.0;
                }
            }
        } catch (Exception e) {
            // Ignore lazy loading errors
        }
        builder.averageRating(avgRating);
        builder.reviewCount(reviewCount);

        // Safely get favorite count
        int favoriteCount = 0;
        try {
            if (album.getFavorites() != null) {
                favoriteCount = album.getFavorites().size();
            }
        } catch (Exception e) {
            // Ignore lazy loading errors
        }
        builder.favoriteCount(favoriteCount);

        return builder.build();
    }

    public static AlbumResponse fromEntitySimple(Album album) {
        return AlbumResponse.builder()
                .id(album.getId())
                .title(album.getTitle())
                .titleInitial(album.getTitleInitial())
                .releaseYear(album.getReleaseYear())
                .coverUrl(album.getCoverUrl())
                .artistId(album.getArtist() != null ? album.getArtist().getId() : null)
                .artistName(album.getArtist() != null ? album.getArtist().getName() : null)
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
