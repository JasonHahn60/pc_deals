package com.example.demo.controller;

import com.example.demo.service.RedditService;
import com.example.demo.model.GPU;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.logging.Logger;
import java.time.Instant;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reddit")
public class RedditController {
    private static final Logger logger = Logger.getLogger(RedditController.class.getName());
    private final RedditService redditService;

    public RedditController(RedditService redditService) {
        this.redditService = redditService;
    }

    @GetMapping("/fetch-save")
    public List<GPU> fetchAndSave() {
        return redditService.fetchAndSaveGPUListings();
    }

    @GetMapping("/fetch-save-new")
    public List<GPU> fetchNewListings() {
        Instant start = Instant.now();
        List<GPU> result = redditService.fetchAndSaveNewListings();
        Instant end = Instant.now();
        logger.info(String.format("Endpoint scraping completed in %d ms", 
            end.toEpochMilli() - start.toEpochMilli()));
        return result;
    }

}
