package com.musicreview.repository;

import com.musicreview.dto.blog.BlogPostResponse;
import com.musicreview.entity.BlogPost;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BlogPostRepository extends JpaRepository<BlogPost, Long> {

    List<BlogPost> findAllByOrderByCreatedAtDesc();

    List<BlogPost> findByUserIdOrderByCreatedAtDesc(Long userId);

    Optional<BlogPost> findByIdAndUserId(Long id, Long userId);

    @Query("""
            SELECT new com.musicreview.dto.blog.BlogPostResponse(
                p.id,
                u.id,
                u.username,
                a.id,
                a.title,
                a.coverUrl,
                p.title,
                p.content,
                p.createdAt,
                p.updatedAt
            )
            FROM BlogPost p
            JOIN p.user u
            LEFT JOIN p.album a
            ORDER BY p.createdAt DESC
            """)
    Page<BlogPostResponse> findPostResponses(Pageable pageable);

    @Query("""
            SELECT new com.musicreview.dto.blog.BlogPostResponse(
                p.id,
                u.id,
                u.username,
                a.id,
                a.title,
                a.coverUrl,
                p.title,
                p.content,
                p.createdAt,
                p.updatedAt
            )
            FROM BlogPost p
            JOIN p.user u
            LEFT JOIN p.album a
            WHERE u.id = :userId
            ORDER BY p.createdAt DESC
            """)
    Page<BlogPostResponse> findPostResponsesByUserId(@Param("userId") Long userId, Pageable pageable);
}
