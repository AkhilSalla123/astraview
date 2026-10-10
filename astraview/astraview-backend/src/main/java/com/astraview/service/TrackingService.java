package com.astraview.service;

import com.astraview.exception.ApiException;
import com.astraview.model.GroundStation;
import com.astraview.model.Satellite;
import com.astraview.repo.GroundStationRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.Map;

/** Builds requests for the orbit service from stored satellites and ground stations. */
@Service
public class TrackingService {

    private final SatelliteService satellites;
    private final GroundStationRepository stations;
    private final OrbitClient orbit;

    public TrackingService(SatelliteService satellites, GroundStationRepository stations, OrbitClient orbit) {
        this.satellites = satellites;
        this.stations = stations;
        this.orbit = orbit;
    }

    public GroundStation station(String id) {
        return stations.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Ground station not found"));
    }

    public Map<String, Object> position(int noradId) {
        Satellite s = satellites.getOrFetch(noradId);
        Map<String, Object> out = new LinkedHashMap<>(orbit.post("/v1/position", Map.of("tle", tle(s))));
        out.put("noradId", noradId);
        out.put("name", s.getName());
        return out;
    }

    public Map<String, Object> orbitPath(int noradId, int minutes, int stepSeconds) {
        Satellite s = satellites.getOrFetch(noradId);
        return orbit.post("/v1/orbit", Map.of("tle", tle(s), "minutes", minutes, "step_s", stepSeconds));
    }

    public Map<String, Object> look(int noradId, String stationId, double frequencyMhz) {
        Satellite s = satellites.getOrFetch(noradId);
        GroundStation gs = station(stationId);
        Map<String, Object> out = new LinkedHashMap<>(orbit.post("/v1/look", Map.of(
                "tle", tle(s), "station", stationMap(gs), "frequency_mhz", frequencyMhz)));
        out.put("noradId", noradId);
        out.put("name", s.getName());
        return out;
    }

    public Map<String, Object> passes(int noradId, String stationId, double hours, double minElevation) {
        Satellite s = satellites.getOrFetch(noradId);
        GroundStation gs = station(stationId);
        return orbit.post("/v1/passes", Map.of(
                "tle", tle(s), "station", stationMap(gs), "hours", hours, "min_elevation", minElevation));
    }

    private Map<String, Object> tle(Satellite s) {
        return Map.of("name", s.getName(), "line1", s.getLine1(), "line2", s.getLine2());
    }

    private Map<String, Object> stationMap(GroundStation g) {
        return Map.of("lat", g.getLatitude(), "lon", g.getLongitude(), "alt_m", g.getAltitudeM());
    }
}
