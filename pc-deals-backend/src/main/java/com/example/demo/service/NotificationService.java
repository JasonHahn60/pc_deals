package com.example.demo.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.example.demo.model.GPU;
import com.example.demo.model.UserNotificationPreference;
import com.example.demo.repository.UserNotificationPreferenceRepository;
import com.example.demo.repository.UserRepository;
import java.util.List;
import java.util.logging.Logger;

@Service
public class NotificationService {
    private static final Logger logger = Logger.getLogger(NotificationService.class.getName());

    @Autowired
    private UserNotificationPreferenceRepository userNotificationPreferenceRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmailService emailService;

    public void checkForPriceAlerts(GPU newGPU) {
        // Get all users who want notifications for this GPU model
        List<UserNotificationPreference> preferences = 
            userNotificationPreferenceRepository.findByGpuModelAndPriceThresholdGreaterThan(
                newGPU.getModel(), 
                newGPU.getPrice()
            );

        for (UserNotificationPreference preference : preferences) {
            // Send notification if price is below threshold
            if (newGPU.getPrice() <= preference.getPriceThreshold()) {
                sendNotification(preference, newGPU);
            }
        }
    }

    private void sendNotification(UserNotificationPreference preference, GPU gpu) {
        try {
            // Get user's email
            String userEmail = userRepository.findById(preference.getUserId())
                .map(user -> user.getEmail())
                .orElse(null);

            if (userEmail != null) {
                // Send email notification
                emailService.sendPriceAlertEmail(
                    userEmail,
                    gpu.getModel(),
                    gpu.getPrice(),
                    preference.getPriceThreshold(),
                    gpu.getRedditUrl()
                );
                logger.info(String.format(
                    "Price alert email sent to %s: %s listed at $%d (below threshold of $%d) - %s",
                    userEmail,
                    gpu.getModel(),
                    gpu.getPrice(),
                    preference.getPriceThreshold(),
                    gpu.getRedditUrl()
                ));
            }
        } catch (Exception e) {
            logger.severe("Failed to send notification: " + e.getMessage());
        }
    }
} 