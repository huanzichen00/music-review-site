package com.musicreview.repository;

import com.musicreview.entity.BlogPost;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BlogPostRepository extends JpaRepository<BlogPost, Long> {

    List<BlogPost> findAllByOrderByCreatedAtDesc();

    List<BlogPost> findByUserIdOrderByCreatedAtDesc(Long userId);

    Optional<BlogPost> findByIdAndUserId(Long id, Long userId);
}
