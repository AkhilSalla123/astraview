package com.astraview.model;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Data
@Document("ground_stations")
public class GroundStation {
    @Id
    private String id;
    @NotBlank
    private String name;
    @DecimalMin("-90") @DecimalMax("90")
    private double latitude;
    @DecimalMin("-180") @DecimalMax("180")
    private double longitude;
    private double altitudeM;
    @DecimalMin("0") @DecimalMax("90")
    private double minElevation = 5;
    private Instant createdAt;
}
