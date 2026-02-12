package com.musicreview.dto.blog;

import com.musicreview.entity.BlogPost;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BlogPostResponse {

    private Long id;
    private Long userId;
    private String username;
    private Long albumId;
    private String albumTitle;
    private String albumCoverUrl;
    private String title;
    private String content;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static BlogPostResponse fromEntity(BlogPost post) {
        return BlogPostResponse.builder()
                .id(post.getId())
                .userId(post.getUser().getId())
                .username(post.getUser().getUsername())
                .albumId(post.getAlbum() != null ? post.getAlbum().getId() : null)
                .albumTitle(post.getAlbum() != null ? post.getAlbum().getTitle() : null)
                .albumCoverUrl(post.getAlbum() != null ? post.getAlbum().getCoverUrl() : null)
                .title(post.getTitle())
                .content(post.getContent())
                .createdAt(post.getCreatedAt())
                .updatedAt(post.getUpdatedAt())
                .build();
    }
}
