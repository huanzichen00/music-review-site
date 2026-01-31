package com.musicreview.dto.review;

import com.musicreview.entity.Review;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReviewResponse {

    private Long id;
    private Long userId;
    private String username;
    private String userAvatar;
    private Long albumId;
    private String albumTitle;
    private String albumCoverUrl;
    private String artistName;
    private BigDecimal rating;
    private String content;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static ReviewResponse fromEntity(Review review) {
        return ReviewResponse.builder()
                .id(review.getId())
                .userId(review.getUser().getId())
                .username(review.getUser().getUsername())
                .userAvatar(review.getUser().getAvatarUrl())
                .albumId(review.getAlbum().getId())
                .albumTitle(review.getAlbum().getTitle())
                .albumCoverUrl(review.getAlbum().getCoverUrl())
                .artistName(review.getAlbum().getArtist().getName())
                .rating(review.getRating())
                .content(review.getContent())
                .createdAt(review.getCreatedAt())
                .updatedAt(review.getUpdatedAt())
                .build();
    }
}
