package com.musicreview.repository;

import com.musicreview.entity.QuestionBankItem;
import com.musicreview.repository.projection.QuestionBankItemCountProjection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuestionBankItemRepository extends JpaRepository<QuestionBankItem, Long> {

    int countByQuestionBankId(Long questionBankId);

    @Query("""
            SELECT q.questionBank.id AS questionBankId, COUNT(q.id) AS itemCount
            FROM QuestionBankItem q
            WHERE q.questionBank.id IN :questionBankIds
            GROUP BY q.questionBank.id
            """)
    List<QuestionBankItemCountProjection> countByQuestionBankIds(@Param("questionBankIds") List<Long> questionBankIds);
}
