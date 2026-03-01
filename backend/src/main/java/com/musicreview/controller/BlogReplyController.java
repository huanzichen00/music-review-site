package com.musicreview.controller;

import com.musicreview.dto.blog.BlogReplyRequest;
import com.musicreview.dto.blog.BlogReplyResponse;
import com.musicreview.service.BlogReplyService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/blog-replies")
@RequiredArgsConstructor
public class BlogReplyController {

    private final BlogReplyService blogReplyService;

    @GetMapping("/post/{blogPostId}")
    public ResponseEntity<List<BlogReplyResponse>> getRepliesByBlogPost(@PathVariable Long blogPostId) {
        return ResponseEntity.ok(blogReplyService.getRepliesByBlogPost(blogPostId));
    }

    @PostMapping
    public ResponseEntity<?> createReply(@Valid @RequestBody BlogReplyRequest request) {
        try {
            return ResponseEntity.ok(blogReplyService.createReply(request));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateReply(@PathVariable Long id, @RequestBody Map<String, String> request) {
        try {
            String content = request.get("content");
            if (content == null || content.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Content is required"));
            }
            return ResponseEntity.ok(blogReplyService.updateReply(id, content));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteReply(@PathVariable Long id) {
        try {
            blogReplyService.deleteReply(id);
            return ResponseEntity.ok(Map.of("message", "Blog reply deleted successfully"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}

