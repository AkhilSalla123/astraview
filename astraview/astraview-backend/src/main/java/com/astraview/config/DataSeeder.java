package com.astraview.config;

import com.astraview.model.GroundStation;
import com.astraview.repo.GroundStationRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Instant;

@Configuration
public class DataSeeder {

    /** Creates one editable demo ground station on first start. */
    @Bean
    CommandLineRunner seedStation(GroundStationRepository repo) {
        return args -> {
            if (repo.count() == 0) {
                GroundStation gs = new GroundStation();
                gs.setName("Demo Ground Station (edit me)");
                gs.setLatitude(51.4769);
                gs.setLongitude(-0.0005);
                gs.setAltitudeM(50);
                gs.setMinElevation(5);
                gs.setCreatedAt(Instant.now());
                repo.save(gs);
            }
        };
    }
}
