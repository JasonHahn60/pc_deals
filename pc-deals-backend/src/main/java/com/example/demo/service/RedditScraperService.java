package com.example.demo.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import java.time.Instant;
import java.time.LocalTime;
import java.util.logging.Logger;
import java.time.ZoneId;
import java.time.ZonedDateTime;

@Service
public class RedditScraperService {
    private static final Logger logger = Logger.getLogger(RedditScraperService.class.getName());

    @Autowired
    private RedditService redditService;

    // Always runs every minute, but we conditionally skip based on the time. 
    @Scheduled(fixedRate = 60000) //60,000 = 1 min
    public void fetchNewListings() {
        ZonedDateTime now = ZonedDateTime.now(ZoneId.of("America/Chicago"));
        int currentHour = now.getHour();

        // Active scraping between 9am–10pm every minute
        // Outside of those hours, run only every 10 minutes (if minute % 10 == 0)
        int currentMinute = now.getMinute();

        boolean shouldRunNow =
            (currentHour >= 9 && currentHour < 24) ||  // 9:00 to 21:59 → every 1 minute
            (currentMinute % 10 == 0);                // Other hours → only every 10 minutes
        System.out.println("Hour: " + currentHour);
        System.out.println("Minute: " + currentMinute);
        if (!shouldRunNow) {
            logger.info("Skipped fetch — outside active hours and not a 10-minute interval");
            return;
        }

        Instant start = Instant.now();
        try {
            redditService.fetchAndSaveNewListings();
            Instant end = Instant.now();
            logger.info(String.format("Scheduled scraping completed in %d ms",
                end.toEpochMilli() - start.toEpochMilli()));
        } catch (Exception e) {
            logger.severe("Error during scheduled scraping: " + e.getMessage());
        }
    }
}
