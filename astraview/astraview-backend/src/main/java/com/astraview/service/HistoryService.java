package com.astraview.service;

import com.astraview.model.TrackingLog;
import com.astraview.repo.TrackingLogRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/** Stores tracking samples (at most one every 5 s per satellite/station pair). */
@Service
public class HistoryService {

    private static final Duration MIN_GAP = Duration.ofSeconds(5);

    private final TrackingLogRepository repo;
    private final Map<String, Instant> lastSaved = new ConcurrentHashMap<>();

    public HistoryService(TrackingLogRepository repo) {
        this.repo = repo;
    }

    public void record(int noradId, String satName, String stationId, String stationName,
                       double az, double el, double rangeKm, double dopplerHz, double snrDb, String state) {
        String key = stationId + ":" + noradId;
        Instant now = Instant.now();
        Instant prev = lastSaved.get(key);
        if (prev != null && Duration.between(prev, now).compareTo(MIN_GAP) < 0) {
            return;
        }
        lastSaved.put(key, now);
        TrackingLog log = new TrackingLog();
        log.setNoradId(noradId);
        log.setSatelliteName(satName);
        log.setStationId(stationId);
        log.setStationName(stationName);
        log.setTime(now);
        log.setAzimuth(az);
        log.setElevation(el);
        log.setRangeKm(rangeKm);
        log.setDopplerHz(dopplerHz);
        log.setSnrDb(snrDb);
        log.setState(state);
        repo.save(log);
    }

    public List<TrackingLog> recent(Integer noradId, int limit) {
        PageRequest page = PageRequest.of(0, Math.max(1, Math.min(limit, 5000)));
        return noradId == null ? repo.findAllByOrderByTimeDesc(page) : repo.findByNoradIdOrderByTimeDesc(noradId, page);
    }

    public void clear() {
        repo.deleteAll();
    }

    public String toCsv(List<TrackingLog> logs) {
        StringBuilder sb = new StringBuilder("time,noradId,satellite,station,azimuth,elevation,rangeKm,dopplerHz,snrDb,state\n");
        for (TrackingLog l : logs) {
            sb.append(l.getTime()).append(',').append(l.getNoradId()).append(',')
              .append(csv(l.getSatelliteName())).append(',').append(csv(l.getStationName())).append(',')
              .append(l.getAzimuth()).append(',').append(l.getElevation()).append(',')
              .append(l.getRangeKm()).append(',').append(l.getDopplerHz()).append(',')
              .append(l.getSnrDb()).append(',').append(l.getState()).append('\n');
        }
        return sb.toString();
    }

    private static String csv(String s) {
        return s == null ? "" : "\"" + s.replace("\"", "\"\"") + "\"";
    }
}
