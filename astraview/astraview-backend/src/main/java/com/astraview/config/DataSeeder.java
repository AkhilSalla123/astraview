package com.astraview.config;

import com.astraview.model.GroundStation;
import com.astraview.model.Satellite;
import com.astraview.repo.GroundStationRepository;
import com.astraview.repo.SatelliteRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Instant;

@Configuration
public class DataSeeder {

    /** Creates one demo ground station and seeds ISS on first start. */
    @Bean
    CommandLineRunner seedData(GroundStationRepository stationRepo, SatelliteRepository satRepo) {
        return args -> {
            if (stationRepo.count() == 0) {
                GroundStation gs = new GroundStation();
                gs.setName("Demo Ground Station (edit me)");
                gs.setLatitude(51.4769);
                gs.setLongitude(-0.0005);
                gs.setAltitudeM(50);
                gs.setMinElevation(5);
                gs.setCreatedAt(Instant.now());
                stationRepo.save(gs);
            }
            if (satRepo.count() == 0) {
                Satellite iss = new Satellite();
                iss.setNoradId(25544);
                iss.setName("ISS (ZARYA)");
                iss.setLine1("1 25544U 98067A   26283.78925095  .00010839  00000+0  20582-3 0  9996");
                iss.setLine2("2 25544  51.6307  88.0087 0006720 246.7167 113.3114 15.48817123589672");
                iss.setSource("Pre-seeded");
                iss.setFetchedAt(Instant.now());
                satRepo.save(iss);
            }
        };
    }
}
