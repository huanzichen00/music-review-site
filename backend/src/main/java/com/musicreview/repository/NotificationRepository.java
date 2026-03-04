package com.musicreview.repository;

import com.musicreview.dto.notification.NotificationResponse;
import com.musicreview.entity.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findByUserIdOrderByCreatedAtDesc(Long userId);

    Optional<Notification> findByIdAndUserId(Long id, Long userId);

    long countByUserIdAndIsReadFalse(Long userId);

    @Query("""
            SELECT new com.musicreview.dto.notification.NotificationResponse(
                n.id,
                n.type,
                n.title,
                n.content,
                n.isRead,
                n.relatedBlogPostId,
                n.relatedBlogReplyId,
                sender.id,
                sender.username,
                n.createdAt
            )
            FROM Notification n
            LEFT JOIN n.senderUser sender
            WHERE n.user.id = :userId
            ORDER BY n.createdAt DESC
            """)
    Page<NotificationResponse> findNotificationResponsesByUserId(@Param("userId") Long userId, Pageable pageable);
}
