package com.musicreview.controller;

import com.musicreview.dto.notification.AnnouncementRequest;
import com.musicreview.dto.notification.NotificationResponse;
import com.musicreview.service.NotificationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping("/my")
    public ResponseEntity<Page<NotificationResponse>> getMyNotifications(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(notificationService.getMyNotifications(pageable));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> getUnreadCount() {
        return ResponseEntity.ok(notificationService.getMyUnreadCount());
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<?> markRead(@PathVariable Long id) {
        try {
            notificationService.markRead(id);
            return ResponseEntity.ok(Map.of("message", "Notification marked as read"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/read-all")
    public ResponseEntity<?> markAllRead() {
        notificationService.markAllRead();
        return ResponseEntity.ok(Map.of("message", "All notifications marked as read"));
    }

    @PostMapping("/announcements")
    public ResponseEntity<?> createAnnouncement(@Valid @RequestBody AnnouncementRequest request) {
        try {
            notificationService.createAnnouncement(request.getTitle(), request.getContent());
            return ResponseEntity.ok(Map.of("message", "Announcement published"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
