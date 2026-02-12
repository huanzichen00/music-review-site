package com.musicreview.service;

import com.musicreview.dto.blog.BlogPostRequest;
import com.musicreview.dto.blog.BlogPostResponse;
import com.musicreview.entity.Album;
import com.musicreview.entity.BlogPost;
import com.musicreview.entity.User;
import com.musicreview.repository.AlbumRepository;
import com.musicreview.repository.BlogPostRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BlogPostService {

    private final BlogPostRepository blogPostRepository;
    private final AlbumRepository albumRepository;
    private final AuthService authService;

    public List<BlogPostResponse> getAllPosts() {
        return blogPostRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(BlogPostResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public List<BlogPostResponse> getMyPosts() {
        User currentUser = authService.getCurrentUser();
        return blogPostRepository.findByUserIdOrderByCreatedAtDesc(currentUser.getId()).stream()
                .map(BlogPostResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public List<BlogPostResponse> getPostsByUserId(Long userId) {
        return blogPostRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(BlogPostResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public BlogPostResponse createPost(BlogPostRequest request) {
        User currentUser = authService.getCurrentUser();
        Album album = resolveAlbum(request.getAlbumId());

        BlogPost post = BlogPost.builder()
                .user(currentUser)
                .album(album)
                .title(request.getTitle().trim())
                .content(request.getContent().trim())
                .build();

        return BlogPostResponse.fromEntity(blogPostRepository.save(post));
    }

    @Transactional
    public BlogPostResponse updatePost(Long id, BlogPostRequest request) {
        User currentUser = authService.getCurrentUser();
        BlogPost post = blogPostRepository.findByIdAndUserId(id, currentUser.getId())
                .orElseThrow(() -> new RuntimeException("Blog post not found with id: " + id));

        Album album = resolveAlbum(request.getAlbumId());
        post.setAlbum(album);
        post.setTitle(request.getTitle().trim());
        post.setContent(request.getContent().trim());

        return BlogPostResponse.fromEntity(blogPostRepository.save(post));
    }

    @Transactional
    public void deletePost(Long id) {
        User currentUser = authService.getCurrentUser();
        BlogPost post = blogPostRepository.findByIdAndUserId(id, currentUser.getId())
                .orElseThrow(() -> new RuntimeException("Blog post not found with id: " + id));
        blogPostRepository.delete(post);
    }

    private Album resolveAlbum(Long albumId) {
        if (albumId == null) {
            return null;
        }
        return albumRepository.findById(albumId)
                .orElseThrow(() -> new RuntimeException("Album not found with id: " + albumId));
    }
}
