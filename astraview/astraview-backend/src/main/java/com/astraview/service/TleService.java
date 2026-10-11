package com.astraview.service;

import com.astraview.exception.ApiException;
import com.astraview.model.Satellite;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.time.Duration;
import java.time.Instant;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

/** Downloads TLEs from N2YO (when an API key is set) or CelesTrak, with built-in fallbacks. */
@Service
public class TleService {

    private static final Map<Integer, String[]> FALLBACK_TLES = Map.of(
            25544, new String[]{"ISS (ZARYA)",
                    "1 25544U 98067A   26283.78925095  .00010839  00000+0  20582-3 0  9996",
                    "2 25544  51.6307  88.0087 0006720 246.7167 113.3114 15.48817123589672"},
            20580, new String[]{"HST",
                    "1 20580U 90037B   26283.95144126  .00008494  00000+0  26031-3 0  9996",
                    "2 20580  28.4737   8.6621 0001735  14.6522 345.4124 15.31895111806335"},
            33591, new String[]{"NOAA 19",
                    "1 33591U 09005A   26283.92789102  .00000042  00000+0  46123-4 0  9999",
                    "2 33591  98.9413 354.8208 0014656  65.2016 295.0679 14.13488779910830"},
            25338, new String[]{"NOAA 15",
                    "1 25338U 98030A   26283.93601917  .00000112  00000+0  63366-4 0  9999",
                    "2 25338  98.5035 301.4264 0010464  14.7155 345.4328 14.27174404477800"},
            48274, new String[]{"CSS (TIANHE)",
                    "1 48274U 21035A   26283.82865320  .00028340  00000+0  33640-3 0  9996",
                    "2 48274  41.4700 339.6647 0000756  15.6585 344.4277 15.60550432311220"},
            49260, new String[]{"LANDSAT 9",
                    "1 49260U 21088A   26283.42452862  .00000254  00000+0  66421-4 0  9997",
                    "2 49260  98.2170 352.1361 0001356  87.8119 272.3235 14.57109766267780"}
    );

    private final RestClient http;
    private final ObjectMapper mapper = new ObjectMapper();
    private final String n2yoKey;
    private final String n2yoBase;
    private final String celestrakBase;

    public TleService(@Value("${n2yo.api-key:}") String n2yoKey,
                      @Value("${n2yo.base-url}") String n2yoBase,
                      @Value("${celestrak.base-url}") String celestrakBase) {
        this.n2yoKey = n2yoKey;
        this.n2yoBase = n2yoBase;
        this.celestrakBase = celestrakBase;

        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(Duration.ofSeconds(4));
        requestFactory.setReadTimeout(Duration.ofSeconds(5));

        this.http = RestClient.builder()
                .requestFactory(requestFactory)
                .defaultHeader("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36")
                .defaultHeader("Accept", "text/plain, application/json, */*")
                .build();
    }

    public Satellite fetch(int noradId) {
        try {
            return (n2yoKey == null || n2yoKey.isBlank()) ? fromCelestrak(noradId) : fromN2yo(noradId);
        } catch (Exception e) {
            if (FALLBACK_TLES.containsKey(noradId)) {
                String[] d = FALLBACK_TLES.get(noradId);
                return build(noradId, d[0], d[1], d[2], "Cached TLE");
            }
            throw new ApiException(HttpStatus.BAD_GATEWAY, "Could not download TLE for NORAD " + noradId + ": " + e.getMessage());
        }
    }

    private Satellite fromCelestrak(int noradId) {
        String body = http.get().uri(celestrakBase + "?CATNR={id}&FORMAT=TLE", noradId)
                .retrieve().body(String.class);
        List<String> lines = body == null ? List.of()
                : Arrays.stream(body.split("\\R")).map(String::trim).filter(s -> !s.isEmpty()).toList();
        if (lines.size() < 2) {
            throw new ApiException(HttpStatus.NOT_FOUND, "No TLE found for NORAD ID " + noradId);
        }
        String name = lines.size() >= 3 ? lines.get(0) : "NORAD " + noradId;
        String l1 = lines.get(lines.size() - 2);
        String l2 = lines.get(lines.size() - 1);
        return build(noradId, name, l1, l2, "CelesTrak");
    }

    private Satellite fromN2yo(int noradId) {
        String json = http.get().uri(n2yoBase + "/tle/{id}&apiKey={key}", noradId, n2yoKey)
                .retrieve().body(String.class);
        try {
            JsonNode root = mapper.readTree(json);
            JsonNode tle = root.path("tle");
            if (tle.isMissingNode() || tle.asText().isBlank()) {
                throw new ApiException(HttpStatus.NOT_FOUND, "No TLE found for NORAD ID " + noradId);
            }
            String[] lines = tle.asText().split("\\R");
            String name = root.path("info").path("satname").asText("NORAD " + noradId);
            return build(noradId, name, lines[0].trim(), lines[1].trim(), "N2YO");
        } catch (ApiException e) {
            throw e;
        } catch (Exception e) {
            throw new ApiException(HttpStatus.BAD_GATEWAY, "Unexpected N2YO response");
        }
    }

    private Satellite build(int noradId, String name, String l1, String l2, String source) {
        if (!l1.startsWith("1 ") || !l2.startsWith("2 ")) {
            throw new ApiException(HttpStatus.BAD_GATEWAY, "Received malformed TLE data");
        }
        Satellite s = new Satellite();
        s.setNoradId(noradId);
        s.setName(name);
        s.setLine1(l1);
        s.setLine2(l2);
        s.setSource(source);
        s.setFetchedAt(Instant.now());
        return s;
    }
}
