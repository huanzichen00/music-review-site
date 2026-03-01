package com.musicreview.dto.notification;

import com.musicreview.entity.Notification;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationResponse {

    private Long id;
    private String type;
    private String title;
    private String content;
    private Boolean isRead;
    private Long relatedBlogPostId;
    private Long relatedBlogReplyId;
    private Long senderUserId;
    private String senderUsername;
    private LocalDateTime createdAt;

    public static NotificationResponse fromEntity(Notification notification) {
        return NotificationResponse.builder()
                .id(notification.getId())
                .type(notification.getType().name())
                .title(notification.getTitle())
                .content(notification.getContent())
                .isRead(notification.getIsRead())
                .relatedBlogPostId(notification.getRelatedBlogPostId())
                .relatedBlogReplyId(notification.getRelatedBlogReplyId())
                .senderUserId(notification.getSenderUser() != null ? notification.getSenderUser().getId() : null)
                .senderUsername(notification.getSenderUser() != null ? notification.getSenderUser().getUsername() : null)
                .createdAt(notification.getCreatedAt())
                .build();
    }
}

