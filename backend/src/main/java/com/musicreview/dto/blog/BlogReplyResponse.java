package com.musicreview.dto.blog;

import com.musicreview.entity.BlogReply;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BlogReplyResponse {

    private Long id;
    private Long blogPostId;
    private Long userId;
    private String username;
    private String userAvatar;
    private String content;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static BlogReplyResponse fromEntity(BlogReply reply) {
        return BlogReplyResponse.builder()
                .id(reply.getId())
                .blogPostId(reply.getBlogPost().getId())
                .userId(reply.getUser().getId())
                .username(reply.getUser().getUsername())
                .userAvatar(reply.getUser().getAvatarUrl())
                .content(reply.getContent())
                .createdAt(reply.getCreatedAt())
                .updatedAt(reply.getUpdatedAt())
                .build();
    }
}

