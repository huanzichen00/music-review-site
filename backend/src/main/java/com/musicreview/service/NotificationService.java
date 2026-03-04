package com.musicreview.service;

import com.musicreview.dto.notification.NotificationResponse;
import com.musicreview.entity.BlogPost;
import com.musicreview.entity.BlogReply;
import com.musicreview.entity.Notification;
import com.musicreview.entity.User;
import com.musicreview.entity.enums.NotificationType;
import com.musicreview.repository.NotificationRepository;
import com.musicreview.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final AuthService authService;

    public Page<NotificationResponse> getMyNotifications(Pageable pageable) {
        User currentUser = authService.getCurrentUser();
        return notificationRepository.findNotificationResponsesByUserId(currentUser.getId(), pageable);
    }

    public Map<String, Long> getMyUnreadCount() {
        User currentUser = authService.getCurrentUser();
        long count = notificationRepository.countByUserIdAndIsReadFalse(currentUser.getId());
        return Map.of("unreadCount", count);
    }

    @Transactional
    public void markRead(Long id) {
        User currentUser = authService.getCurrentUser();
        Notification notification = notificationRepository.findByIdAndUserId(id, currentUser.getId())
                .orElseThrow(() -> new RuntimeException("Notification not found"));
        notification.setIsRead(true);
        notificationRepository.save(notification);
    }

    @Transactional
    public void markAllRead() {
        User currentUser = authService.getCurrentUser();
        List<Notification> notifications = notificationRepository.findByUserIdOrderByCreatedAtDesc(currentUser.getId());
        notifications.forEach(notification -> notification.setIsRead(true));
        notificationRepository.saveAll(notifications);
    }

    @Transactional
    public void createBlogReplyNotification(BlogPost blogPost, BlogReply reply, User sender) {
        User postOwner = blogPost.getUser();
        if (postOwner == null || postOwner.getId().equals(sender.getId())) {
            return;
        }

        String replyContent = reply.getContent() == null ? "" : reply.getContent().trim();
        if (replyContent.length() > 500) {
            replyContent = replyContent.substring(0, 500) + "...";
        }

        Notification notification = Notification.builder()
                .user(postOwner)
                .senderUser(sender)
                .type(NotificationType.BLOG_REPLY)
                .title(sender.getUsername() + " 回复了你的文章《" + blogPost.getTitle() + "》")
                .content(replyContent.isBlank() ? "(空回复)" : replyContent)
                .relatedBlogPostId(blogPost.getId())
                .relatedBlogReplyId(reply.getId())
                .isRead(false)
                .build();
        notificationRepository.save(notification);
    }

    @Transactional
    public void createAnnouncement(String title, String content) {
        User sender = authService.getCurrentUser();
        if (!"Huan".equals(sender.getUsername())) {
            throw new RuntimeException("Only Huan can publish announcements");
        }

        int page = 0;
        int batchSize = 500;
        while (true) {
            Page<User> userPage = userRepository.findAllByOrderByIdAsc(PageRequest.of(page, batchSize));
            if (userPage.isEmpty()) {
                break;
            }
            List<Notification> notifications = new ArrayList<>(userPage.getNumberOfElements());
            for (User user : userPage.getContent()) {
                notifications.add(Notification.builder()
                        .user(user)
                        .senderUser(sender)
                        .type(NotificationType.ANNOUNCEMENT)
                        .title(title.trim())
                        .content(content.trim())
                        .isRead(false)
                        .build());
            }
            notificationRepository.saveAll(notifications);
            if (!userPage.hasNext()) {
                break;
            }
            page++;
        }
    }
}
