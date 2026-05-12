package com.musicreview.controller;

import com.musicreview.dto.reply.ReplyRequest;
import com.musicreview.dto.reply.ReplyResponse;
import com.musicreview.service.ReplyService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/replies")
@RequiredArgsConstructor
public class ReplyController {

    private final ReplyService replyService;

    /**
     * 获取某条评论下的回复
     * GET /api/replies/review/{reviewId}
     */
    @GetMapping("/review/{reviewId}")
    public ResponseEntity<List<ReplyResponse>> getRepliesByReview(@PathVariable Long reviewId) {
        return ResponseEntity.ok(replyService.getRepliesByReview(reviewId));
    }

    /**
     * 创建回复
     * POST /api/replies
     */
    @PostMapping
    public ResponseEntity<?> createReply(@Valid @RequestBody ReplyRequest request) {
        try {
            ReplyResponse response = replyService.createReply(request);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * 更新回复
     * PUT /api/replies/{id}
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> updateReply(@PathVariable Long id, @RequestBody Map<String, String> request) {
        try {
            String content = request.get("content");
            if (content == null || content.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Content is required"));
            }
            ReplyResponse response = replyService.updateReply(id, content);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * 删除回复
     * DELETE /api/replies/{id}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteReply(@PathVariable Long id) {
        try {
            replyService.deleteReply(id);
            return ResponseEntity.ok(Map.of("message", "Reply deleted successfully"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
