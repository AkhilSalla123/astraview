package com.astraview.repo;

import com.astraview.model.Satellite;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface SatelliteRepository extends MongoRepository<Satellite, String> {
    Optional<Satellite> findByNoradId(int noradId);
    void deleteByNoradId(int noradId);
}
