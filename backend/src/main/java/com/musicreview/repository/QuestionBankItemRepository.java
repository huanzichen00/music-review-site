package com.musicreview.repository;

import com.musicreview.entity.QuestionBankItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface QuestionBankItemRepository extends JpaRepository<QuestionBankItem, Long> {

    int countByQuestionBankId(Long questionBankId);
}
