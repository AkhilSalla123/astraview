package com.astraview.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Data
@Document("satellites")
public class Satellite {
    @Id
    private String id;
    @Indexed(unique = true)
    private int noradId;
    private String name;
    private String line1;
    private String line2;
    private String source;
    private Instant fetchedAt;
}
