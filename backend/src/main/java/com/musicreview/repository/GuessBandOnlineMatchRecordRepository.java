package com.musicreview.repository;

import com.musicreview.entity.GuessBandOnlineMatchRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GuessBandOnlineMatchRecordRepository extends JpaRepository<GuessBandOnlineMatchRecord, Long> {

    List<GuessBandOnlineMatchRecord> findTop50ByOrderByCreatedAtDesc();
}
