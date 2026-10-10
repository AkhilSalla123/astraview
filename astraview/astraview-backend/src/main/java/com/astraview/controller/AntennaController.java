package com.astraview.controller;

import com.astraview.service.AntennaService;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/antenna")
public class AntennaController {

    private final AntennaService service;

    public AntennaController(AntennaService service) {
        this.service = service;
    }

    /** Live status of the simulated tracking antenna. Poll this every second or two. */
    @GetMapping("/{stationId}/{noradId}/status")
    public Map<String, Object> status(@PathVariable String stationId,
                                      @PathVariable int noradId,
                                      @RequestParam(defaultValue = "437.0") double frequencyMhz) {
        return service.status(noradId, stationId, frequencyMhz);
    }
}
