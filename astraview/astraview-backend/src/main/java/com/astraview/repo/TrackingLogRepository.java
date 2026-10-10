package com.astraview.repo;

import com.astraview.model.TrackingLog;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface TrackingLogRepository extends MongoRepository<TrackingLog, String> {
    List<TrackingLog> findByNoradIdOrderByTimeDesc(int noradId, Pageable pageable);
    List<TrackingLog> findAllByOrderByTimeDesc(Pageable pageable);
}
