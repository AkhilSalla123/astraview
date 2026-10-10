package com.astraview.service;

import com.astraview.model.GroundStation;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Simulated tracking antenna (az/el rotator + receiver).
 * The dish slews towards the commanded az/el at a limited rate, so pointing error,
 * tracking state and signal strength change realistically over time.
 */
@Service
public class AntennaService {

    private static class Dish {
        double az;
        double el;
        Instant last;
        String state = "PARKED";
    }

    private final Map<String, Dish> dishes = new ConcurrentHashMap<>();
    private final TrackingService tracking;
    private final HistoryService history;
    private final double maxSlew;
    private final double beamwidth;
    private final double gainDbi;
    private final double txDbm;
    private final double noiseDbm;

    public AntennaService(TrackingService tracking, HistoryService history,
                          @Value("${antenna.max-slew-deg-s}") double maxSlew,
                          @Value("${antenna.beamwidth-deg}") double beamwidth,
                          @Value("${antenna.gain-dbi}") double gainDbi,
                          @Value("${antenna.tx-power-dbm}") double txDbm,
                          @Value("${antenna.noise-floor-dbm}") double noiseDbm) {
        this.tracking = tracking;
        this.history = history;
        this.maxSlew = maxSlew;
        this.beamwidth = beamwidth;
        this.gainDbi = gainDbi;
        this.txDbm = txDbm;
        this.noiseDbm = noiseDbm;
    }

    public Map<String, Object> status(int noradId, String stationId, double frequencyMhz) {
        GroundStation gs = tracking.station(stationId);
        Map<String, Object> look = tracking.look(noradId, stationId, frequencyMhz);

        double targetAz = num(look, "azimuth");
        double targetEl = num(look, "elevation");
        double range = num(look, "range_km");
        // the antenna only tracks above the station's elevation mask
        boolean visible = targetEl > 0 && targetEl >= gs.getMinElevation();

        Dish d = dishes.computeIfAbsent(stationId + ":" + noradId, k -> new Dish());
        Instant now = Instant.now();
        double dt = d.last == null ? 0 : Math.min(10.0, (now.toEpochMilli() - d.last.toEpochMilli()) / 1000.0);
        boolean firstTick = d.last == null;
        d.last = now;

        // command: follow the satellite when it is above the horizon, otherwise park (el 0, same az)
        double cmdAz = visible ? targetAz : d.az;
        double cmdEl = visible ? targetEl : 0.0;
        if (firstTick && visible) {            // first time we see it: start from the stow position
            d.az = (targetAz + 180) % 360;
            d.el = 0;
        }
        double step = maxSlew * dt;
        d.az = (d.az + clamp(wrap(cmdAz - d.az), step) + 360) % 360;
        d.el = d.el + clamp(cmdEl - d.el, step);

        double azErr = wrap(targetAz - d.az);
        double elErr = targetEl - d.el;
        double pointingErr = visible ? Math.hypot(azErr * Math.cos(Math.toRadians(targetEl)), elErr) : 0.0;

        String state;
        if (!visible) {
            state = Math.abs(d.el) < 0.2 ? "PARKED" : "STOWING";
        } else if (pointingErr > 2.0) {
            state = "SLEWING";
        } else if (pointingErr > 0.5) {
            state = "TRACKING";
        } else {
            state = "LOCKED";
        }
        d.state = state;

        // simple link budget (dBm)
        double freq = frequencyMhz;
        double fspl = 20 * Math.log10(Math.max(range, 1)) + 20 * Math.log10(freq) + 32.44;
        double pointingLoss = 12.0 * Math.pow(pointingErr / beamwidth, 2);
        double lowElLoss = targetEl < 10 ? (10 - Math.max(targetEl, 0)) * 0.3 : 0.0;
        double rx = txDbm + gainDbi - fspl - pointingLoss - lowElLoss;
        double snr = rx - noiseDbm;
        if (!visible) {
            rx = Double.NaN;
            snr = Double.NaN;
        }

        List<String> alerts = new ArrayList<>();
        if (!visible) alerts.add("Satellite is below the station elevation mask (" + gs.getMinElevation() + " deg). Antenna parked.");
        if (visible && targetEl < 10) alerts.add("Low elevation: expect multipath and extra atmospheric loss.");
        if (visible && pointingErr > 2.0) alerts.add("Pointing error above 2 degrees. Antenna is still slewing.");
        if (visible && snr < 10) alerts.add("Signal-to-noise ratio below 10 dB. Link is marginal.");
        if (visible && Math.abs(num(look, "doppler_hz")) > 8000) alerts.add("Large Doppler shift. Retune the receiver.");

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("time", now.toString());
        out.put("noradId", noradId);
        out.put("satellite", look.get("name"));
        out.put("station", gs.getName());
        out.put("state", state);
        out.put("visible", visible);
        out.put("commandedAzimuth", round(targetAz, 2));
        out.put("commandedElevation", round(targetEl, 2));
        out.put("actualAzimuth", round(d.az, 2));
        out.put("actualElevation", round(d.el, 2));
        out.put("pointingErrorDeg", round(pointingErr, 2));
        out.put("rangeKm", round(range, 1));
        out.put("rangeRateKmS", look.get("range_rate_km_s"));
        out.put("dopplerHz", look.get("doppler_hz"));
        out.put("frequencyMhz", frequencyMhz);
        out.put("rxPowerDbm", Double.isNaN(rx) ? null : round(rx, 1));
        out.put("snrDb", Double.isNaN(snr) ? null : round(snr, 1));
        out.put("latitude", look.get("latitude"));
        out.put("longitude", look.get("longitude"));
        out.put("altitudeKm", look.get("altitude_km"));
        out.put("speedKmS", look.get("speed_km_s"));
        out.put("alerts", alerts);

        if (visible) {
            history.record(noradId, String.valueOf(look.get("name")), stationId, gs.getName(),
                    targetAz, targetEl, range, num(look, "doppler_hz"), Double.isNaN(snr) ? 0 : snr, state);
        }
        return out;
    }

    private static double num(Map<String, Object> m, String key) {
        return ((Number) m.get(key)).doubleValue();
    }

    private static double wrap(double deg) {
        double d = ((deg + 180) % 360 + 360) % 360 - 180;
        return d;
    }

    private static double clamp(double v, double limit) {
        return Math.max(-limit, Math.min(limit, v));
    }

    private static double round(double v, int places) {
        double f = Math.pow(10, places);
        return Math.round(v * f) / f;
    }
}
