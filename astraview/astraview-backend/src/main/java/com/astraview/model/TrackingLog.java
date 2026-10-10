package com.astraview.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Data
@Document("tracking_logs")
public class TrackingLog {
    @Id
    private String id;
    @Indexed
    private int noradId;
    private String satelliteName;
    private String stationId;
    private String stationName;
    @Indexed
    private Instant time;
    private double azimuth;
    private double elevation;
    private double rangeKm;
    private double dopplerHz;
    private double snrDb;
    private String state;
}
