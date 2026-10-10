package com.astraview.controller;

import com.astraview.exception.ApiException;
import com.astraview.model.GroundStation;
import com.astraview.repo.GroundStationRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/stations")
public class StationController {

    private final GroundStationRepository repo;

    public StationController(GroundStationRepository repo) {
        this.repo = repo;
    }

    @GetMapping
    public List<GroundStation> list() {
        return repo.findAll();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public GroundStation create(@Valid @RequestBody GroundStation station) {
        station.setId(null);
        station.setCreatedAt(Instant.now());
        return repo.save(station);
    }

    @PutMapping("/{id}")
    public GroundStation update(@PathVariable String id, @Valid @RequestBody GroundStation station) {
        GroundStation existing = repo.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Ground station not found"));
        station.setId(id);
        station.setCreatedAt(existing.getCreatedAt());
        return repo.save(station);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable String id) {
        repo.deleteById(id);
    }
}
