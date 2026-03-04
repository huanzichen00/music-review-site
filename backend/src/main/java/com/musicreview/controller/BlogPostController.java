package com.musicreview.controller;

import com.musicreview.dto.blog.BlogPostRequest;
import com.musicreview.dto.blog.BlogPostResponse;
import com.musicreview.service.BlogPostService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/blog-posts")
@RequiredArgsConstructor
public class BlogPostController {

    private final BlogPostService blogPostService;

    /**
     * Get all blog posts
     * GET /api/blog-posts
     */
    @GetMapping
    public ResponseEntity<Page<BlogPostResponse>> getAllPosts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(blogPostService.getAllPosts(pageable));
    }

    /**
     * Get current user's blog posts
     * GET /api/blog-posts/my
     */
    @GetMapping("/my")
    public ResponseEntity<Page<BlogPostResponse>> getMyPosts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(blogPostService.getMyPosts(pageable));
    }

    /**
     * Get blog posts by user id
     * GET /api/blog-posts/user/{userId}
     */
    @GetMapping("/user/{userId}")
    public ResponseEntity<Page<BlogPostResponse>> getPostsByUserId(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(blogPostService.getPostsByUserId(userId, pageable));
    }

    /**
     * Create a blog post
     * POST /api/blog-posts
     */
    @PostMapping
    public ResponseEntity<?> createPost(@Valid @RequestBody BlogPostRequest request) {
        try {
            return ResponseEntity.ok(blogPostService.createPost(request));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Update a blog post
     * PUT /api/blog-posts/{id}
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> updatePost(@PathVariable Long id, @Valid @RequestBody BlogPostRequest request) {
        try {
            return ResponseEntity.ok(blogPostService.updatePost(id, request));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Delete a blog post
     * DELETE /api/blog-posts/{id}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletePost(@PathVariable Long id) {
        try {
            blogPostService.deletePost(id);
            return ResponseEntity.ok(Map.of("message", "Blog post deleted successfully"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
