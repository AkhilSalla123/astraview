package com.astraview.controller;

import com.astraview.service.TrackingService;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/tracking")
public class TrackingController {

    private final TrackingService service;

    public TrackingController(TrackingService service) {
        this.service = service;
    }

    /** Current sub-satellite point (lat, lon, altitude, speed). */
    @GetMapping("/position/{noradId}")
    public Map<String, Object> position(@PathVariable int noradId) {
        return service.position(noradId);
    }

    /** Orbit samples starting now, used for the 3D orbit line. */
    @GetMapping("/orbit/{noradId}")
    public Map<String, Object> orbit(@PathVariable int noradId,
                                     @RequestParam(defaultValue = "100") int minutes,
                                     @RequestParam(defaultValue = "30") int step) {
        return service.orbitPath(noradId, minutes, step);
    }

    /** Azimuth, elevation, range and Doppler from a ground station. */
    @GetMapping("/look/{noradId}")
    public Map<String, Object> look(@PathVariable int noradId,
                                    @RequestParam String stationId,
                                    @RequestParam(defaultValue = "437.0") double frequencyMhz) {
        return service.look(noradId, stationId, frequencyMhz);
    }

    /** Upcoming passes over a ground station. */
    @GetMapping("/passes/{noradId}")
    public Map<String, Object> passes(@PathVariable int noradId,
                                      @RequestParam String stationId,
                                      @RequestParam(defaultValue = "24") double hours,
                                      @RequestParam(defaultValue = "5") double minElevation) {
        return service.passes(noradId, stationId, hours, minElevation);
    }
}
