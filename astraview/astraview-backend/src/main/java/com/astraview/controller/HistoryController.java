package com.astraview.controller;

import com.astraview.model.TrackingLog;
import com.astraview.service.HistoryService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class HistoryController {

    private final HistoryService service;

    public HistoryController(HistoryService service) {
        this.service = service;
    }

    @GetMapping("/history")
    public List<TrackingLog> history(@RequestParam(required = false) Integer noradId,
                                     @RequestParam(defaultValue = "100") int limit) {
        return service.recent(noradId, limit);
    }

    @GetMapping("/history/export.csv")
    public ResponseEntity<String> export(@RequestParam(required = false) Integer noradId,
                                         @RequestParam(defaultValue = "5000") int limit) {
        String csv = service.toCsv(service.recent(noradId, limit));
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"astraview-history.csv\"")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(csv);
    }

    @DeleteMapping("/history")
    public Map<String, String> clear() {
        service.clear();
        return Map.of("status", "cleared");
    }

    @GetMapping("/health")
    public Map<String, String> health() {
        return Map.of("status", "ok", "service", "astraview-backend");
    }
}
