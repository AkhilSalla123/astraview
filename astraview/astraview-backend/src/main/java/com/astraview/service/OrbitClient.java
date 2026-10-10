package com.astraview.service;

import com.astraview.exception.ApiException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.util.Map;

/** Thin client for the Python SGP4 orbit service. */
@Component
public class OrbitClient {

    private final RestClient client;

    public OrbitClient(@Value("${orbit.service.url}") String baseUrl) {
        this.client = RestClient.builder()
                .baseUrl(baseUrl)
                .requestFactory(new SimpleClientHttpRequestFactory())
                .build();
    }

    public Map<String, Object> post(String path, Map<String, Object> body) {
        try {
            return client.post()
                    .uri(path)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(new ParameterizedTypeReference<Map<String, Object>>() {});
        } catch (HttpClientErrorException e) {
            throw new ApiException(HttpStatus.UNPROCESSABLE_ENTITY,
                    "Orbit service rejected the request: " + e.getResponseBodyAsString());
        } catch (RestClientException e) {
            throw new ApiException(HttpStatus.BAD_GATEWAY,
                    "Orbit service is not reachable. Start it with: uvicorn app.main:app --port 8000");
        }
    }
}
