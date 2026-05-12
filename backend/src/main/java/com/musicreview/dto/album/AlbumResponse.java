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

    // 艺术家信息
    private Long artistId;
    private String artistName;

    // 流派
    private Set<GenreDTO> genres;

    // 曲目
    private List<TrackDTO> tracks;

    // 统计信息
    private Integer trackCount;
    private Integer totalDuration; // 单位：秒
    private String formattedTotalDuration;
    private Double averageRating;
    private Integer reviewCount;
    private Integer favoriteCount;

    public AlbumResponse(Long id,
                         String title,
                         String titleInitial,
                         Integer releaseYear,
                         String coverUrl,
                         Long artistId,
                         String artistName) {
        this.id = id;
        this.title = title;
        this.titleInitial = titleInitial;
        this.releaseYear = releaseYear;
        this.coverUrl = coverUrl;
        this.artistId = artistId;
        this.artistName = artistName;
    }

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

        // 安全复制曲目
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
            // 忽略懒加载异常
        }
        builder.tracks(trackList);
        builder.trackCount(trackList.size());
        builder.totalDuration(totalDuration);
        builder.formattedTotalDuration(formatDuration(totalDuration));

        // 安全复制流派
        Set<GenreDTO> genreSet = new HashSet<>();
        try {
            if (album.getGenres() != null) {
                for (Genre genre : new HashSet<>(album.getGenres())) {
                    genreSet.add(GenreDTO.fromEntity(genre));
                }
            }
        } catch (Exception e) {
            // 忽略懒加载异常
        }
        builder.genres(genreSet);

        // 安全读取评论统计
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
            // 忽略懒加载异常
        }
        builder.averageRating(avgRating);
        builder.reviewCount(reviewCount);

        // 安全读取收藏数量
        int favoriteCount = 0;
        try {
            if (album.getFavorites() != null) {
                favoriteCount = album.getFavorites().size();
            }
        } catch (Exception e) {
            // 忽略懒加载异常
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
