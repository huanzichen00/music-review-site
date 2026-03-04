package com.musicreview.dto.notification;

import com.musicreview.entity.Notification;
import com.musicreview.entity.enums.NotificationType;
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

    public NotificationResponse(
            Long id,
            NotificationType type,
            String title,
            String content,
            Boolean isRead,
            Long relatedBlogPostId,
            Long relatedBlogReplyId,
            Long senderUserId,
            String senderUsername,
            LocalDateTime createdAt
    ) {
        this.id = id;
        this.type = type != null ? type.name() : null;
        this.title = title;
        this.content = content;
        this.isRead = isRead;
        this.relatedBlogPostId = relatedBlogPostId;
        this.relatedBlogReplyId = relatedBlogReplyId;
        this.senderUserId = senderUserId;
        this.senderUsername = senderUsername;
        this.createdAt = createdAt;
    }

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
