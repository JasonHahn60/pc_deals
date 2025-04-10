package com.example.demo.controller;

import com.example.demo.model.UserNotificationPreference;
import com.example.demo.repository.UserNotificationPreferenceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {
    private static final int MAX_ALERTS_PER_USER = 10;

    @Autowired
    private UserNotificationPreferenceRepository notificationPreferenceRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @PostMapping("/preferences")
    public ResponseEntity<?> setNotificationPreference(
            @RequestParam Integer userId,
            @RequestParam String gpuModel,
            @RequestParam Integer priceThreshold) {
        try {
            // Check if user has reached the maximum number of alerts
            long currentAlertCount = notificationPreferenceRepository.countByUserId(userId);
            if (currentAlertCount >= MAX_ALERTS_PER_USER) {
                return ResponseEntity.badRequest().body(
                    String.format("Maximum number of alerts (%d) reached. Please remove some alerts before adding new ones.", 
                    MAX_ALERTS_PER_USER)
                );
            }

            // Check if alert already exists for this GPU model
            if (notificationPreferenceRepository.existsByUserIdAndGpuModel(userId, gpuModel)) {
                return ResponseEntity.badRequest().body("Alert already exists for this GPU model");
            }

            // Create a new preference with explicit SQL to handle created_at
            String sql = "INSERT INTO user_notification_preferences (user_id, gpu_model, price_threshold, created_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP(6))";
            jdbcTemplate.update(sql, userId, gpuModel, priceThreshold);
            
            // Fetch the newly created preference
            UserNotificationPreference savedPreference = notificationPreferenceRepository.findByUserIdAndGpuModel(userId, gpuModel);
            return ResponseEntity.ok(savedPreference);
        } catch (Exception e) {
            e.printStackTrace(); // Log the error for debugging
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error setting notification preference: " + e.getMessage());
        }
    }

    @GetMapping("/preferences/{userId}")
    public List<UserNotificationPreference> getUserPreferences(@PathVariable Integer userId) {
        return notificationPreferenceRepository.findByUserId(userId);
    }

    @DeleteMapping("/preferences/{id}")
    public ResponseEntity<?> deleteNotificationPreference(@PathVariable Long id) {
        try {
            notificationPreferenceRepository.deleteById(id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error deleting notification preference");
        }
    }
} 