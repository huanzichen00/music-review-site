package com.musicreview.repository;

import com.musicreview.entity.QuestionBank;
import com.musicreview.entity.enums.QuestionBankVisibility;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface QuestionBankRepository extends JpaRepository<QuestionBank, Long> {

    @EntityGraph(attributePaths = {"ownerUser"})
    List<QuestionBank> findByOwnerUserIdOrderByUpdatedAtDesc(Long ownerUserId);

    @EntityGraph(attributePaths = {"ownerUser"})
    List<QuestionBank> findByVisibilityOrderByUpdatedAtDesc(QuestionBankVisibility visibility);

    @EntityGraph(attributePaths = {"ownerUser", "items", "items.artist"})
    Optional<QuestionBank> findByShareToken(String shareToken);

    @EntityGraph(attributePaths = {"ownerUser", "items", "items.artist"})
    Optional<QuestionBank> findDetailById(Long id);

    @EntityGraph(attributePaths = {"ownerUser", "items", "items.artist"})
    Optional<QuestionBank> findByIdAndOwnerUserId(Long id, Long ownerUserId);
}
