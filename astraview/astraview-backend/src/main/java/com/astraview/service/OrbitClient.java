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

import java.time.Duration;
import java.util.Map;

/** Thin client for the Python SGP4 orbit service. */
@Component
public class OrbitClient {

    private final RestClient client;
    private final String resolvedUrl;

    public OrbitClient(@Value("${orbit.service.url:https://astraview-orbit-service.onrender.com}") String baseUrl) {
        if (baseUrl == null || baseUrl.isBlank() || baseUrl.contains("localhost") || baseUrl.contains(":8000")) {
            baseUrl = "https://astraview-orbit-service.onrender.com";
        }
        this.resolvedUrl = baseUrl;
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofSeconds(10));
        factory.setReadTimeout(Duration.ofSeconds(15));

        this.client = RestClient.builder()
                .baseUrl(baseUrl)
                .requestFactory(factory)
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
                    "Orbit service error (" + resolvedUrl + "): " + e.getMessage());
        }
    }
}
