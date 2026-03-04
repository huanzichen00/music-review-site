package com.musicreview.repository;

import com.musicreview.entity.BlogReply;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BlogReplyRepository extends JpaRepository<BlogReply, Long> {

    @EntityGraph(attributePaths = {"blogPost", "user"})
    List<BlogReply> findByBlogPostIdOrderByCreatedAtAsc(Long blogPostId);

    Optional<BlogReply> findByIdAndUserId(Long id, Long userId);
}
