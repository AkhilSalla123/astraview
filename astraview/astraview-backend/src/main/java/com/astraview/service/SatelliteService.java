package com.astraview.service;

import com.astraview.exception.ApiException;
import com.astraview.model.Satellite;
import com.astraview.repo.SatelliteRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.List;

@Service
public class SatelliteService {

    private static final Duration STALE_AFTER = Duration.ofDays(3);

    private final SatelliteRepository repo;
    private final TleService tleService;

    public SatelliteService(SatelliteRepository repo, TleService tleService) {
        this.repo = repo;
        this.tleService = tleService;
    }

    public List<Satellite> list() {
        return repo.findAll();
    }

    public Satellite get(int noradId) {
        return repo.findByNoradId(noradId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Satellite " + noradId + " is not saved yet"));
    }

    /** Returns the saved satellite, downloading it first if it is missing or its TLE is stale. */
    public Satellite getOrFetch(int noradId) {
        return repo.findByNoradId(noradId)
                .filter(s -> s.getFetchedAt() != null && s.getFetchedAt().isAfter(Instant.now().minus(STALE_AFTER)))
                .orElseGet(() -> fetchAndSave(noradId));
    }

    public Satellite fetchAndSave(int noradId) {
        Satellite fresh = tleService.fetch(noradId);
        repo.findByNoradId(noradId).ifPresent(existing -> fresh.setId(existing.getId()));
        return repo.save(fresh);
    }

    public List<Satellite> refreshAll() {
        return repo.findAll().stream().map(s -> fetchAndSave(s.getNoradId())).toList();
    }

    public void delete(int noradId) {
        repo.deleteByNoradId(noradId);
    }
}
