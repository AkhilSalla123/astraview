package com.astraview.controller;

import com.astraview.model.Satellite;
import com.astraview.service.SatelliteService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/satellites")
public class SatelliteController {

    private final SatelliteService service;

    public SatelliteController(SatelliteService service) {
        this.service = service;
    }

    @GetMapping
    public List<Satellite> list() {
        return service.list();
    }

    @GetMapping("/{noradId}")
    public Satellite get(@PathVariable int noradId) {
        return service.get(noradId);
    }

    /** Downloads the latest TLE for a NORAD ID and saves (or updates) it. */
    @PostMapping("/fetch/{noradId}")
    @ResponseStatus(HttpStatus.CREATED)
    public Satellite fetch(@PathVariable int noradId) {
        return service.fetchAndSave(noradId);
    }

    @PostMapping("/refresh")
    public List<Satellite> refreshAll() {
        return service.refreshAll();
    }

    @DeleteMapping("/{noradId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable int noradId) {
        service.delete(noradId);
    }
}
