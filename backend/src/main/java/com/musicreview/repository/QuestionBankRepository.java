package com.musicreview.repository;

import com.musicreview.entity.QuestionBank;
import com.musicreview.entity.enums.QuestionBankVisibility;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface QuestionBankRepository extends JpaRepository<QuestionBank, Long> {

    List<QuestionBank> findByOwnerUserIdOrderByUpdatedAtDesc(Long ownerUserId);

    List<QuestionBank> findByVisibilityOrderByUpdatedAtDesc(QuestionBankVisibility visibility);

    Optional<QuestionBank> findByShareToken(String shareToken);

    Optional<QuestionBank> findByIdAndOwnerUserId(Long id, Long ownerUserId);
}
