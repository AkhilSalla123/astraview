package com.astraview.service;

import com.astraview.exception.ApiException;
import com.astraview.model.Satellite;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.time.Instant;
import java.util.Arrays;
import java.util.List;

/** Downloads TLEs from N2YO (when an API key is set) or CelesTrak. */
@Service
public class TleService {

    private final RestClient http = RestClient.create();
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
    }

    public Satellite fetch(int noradId) {
        try {
            return n2yoKey == null || n2yoKey.isBlank() ? fromCelestrak(noradId) : fromN2yo(noradId);
        } catch (RestClientException e) {
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
