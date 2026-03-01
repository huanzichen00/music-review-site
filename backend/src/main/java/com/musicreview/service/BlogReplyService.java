package com.musicreview.service;

import com.musicreview.dto.blog.BlogReplyRequest;
import com.musicreview.dto.blog.BlogReplyResponse;
import com.musicreview.entity.BlogPost;
import com.musicreview.entity.BlogReply;
import com.musicreview.entity.User;
import com.musicreview.repository.BlogPostRepository;
import com.musicreview.repository.BlogReplyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BlogReplyService {

    private final BlogReplyRepository blogReplyRepository;
    private final BlogPostRepository blogPostRepository;
    private final AuthService authService;
    private final NotificationService notificationService;

    public List<BlogReplyResponse> getRepliesByBlogPost(Long blogPostId) {
        return blogReplyRepository.findByBlogPostIdOrderByCreatedAtAsc(blogPostId).stream()
                .map(BlogReplyResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public BlogReplyResponse createReply(BlogReplyRequest request) {
        User currentUser = authService.getCurrentUser();
        BlogPost blogPost = blogPostRepository.findById(request.getBlogPostId())
                .orElseThrow(() -> new RuntimeException("Blog post not found"));

        BlogReply reply = BlogReply.builder()
                .blogPost(blogPost)
                .user(currentUser)
                .content(request.getContent().trim())
                .build();

        BlogReply saved = blogReplyRepository.save(reply);
        notificationService.createBlogReplyNotification(blogPost, saved, currentUser);
        return BlogReplyResponse.fromEntity(saved);
    }

    @Transactional
    public BlogReplyResponse updateReply(Long id, String content) {
        User currentUser = authService.getCurrentUser();
        BlogReply reply = blogReplyRepository.findByIdAndUserId(id, currentUser.getId())
                .orElseThrow(() -> new RuntimeException("Reply not found"));

        reply.setContent(content.trim());
        BlogReply saved = blogReplyRepository.save(reply);
        return BlogReplyResponse.fromEntity(saved);
    }

    @Transactional
    public void deleteReply(Long id) {
        User currentUser = authService.getCurrentUser();
        BlogReply reply = blogReplyRepository.findByIdAndUserId(id, currentUser.getId())
                .orElseThrow(() -> new RuntimeException("Reply not found"));
        blogReplyRepository.delete(reply);
    }
}

