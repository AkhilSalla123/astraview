package com.astraview.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
public class RootController {

    @GetMapping({"", "/", "/api", "/api/"})
    public Map<String, Object> root() {
        return Map.of(
            "status", "UP",
            "service", "AstraView Backend API",
            "version", "1.0.0",
            "description", "Spring Boot backend for real-time satellite tracking and antenna monitoring",
            "endpoints", List.of(
                "/api/health",
                "/api/satellites",
                "/api/stations",
                "/api/tracking/orbit/{noradId}",
                "/api/tracking/passes/{noradId}",
                "/api/antenna/{stationId}/{noradId}/status",
                "/api/history"
            )
        );
    }
}
