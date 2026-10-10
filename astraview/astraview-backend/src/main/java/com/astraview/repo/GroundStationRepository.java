package com.astraview.repo;

import com.astraview.model.GroundStation;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface GroundStationRepository extends MongoRepository<GroundStation, String> {
}
