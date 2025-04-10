package com.example.demo.repository;

import com.example.demo.model.UserNotificationPreference;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserNotificationPreferenceRepository extends JpaRepository<UserNotificationPreference, Long> {
    List<UserNotificationPreference> findByGpuModelAndPriceThresholdGreaterThan(String gpuModel, Integer priceThreshold);
    List<UserNotificationPreference> findByUserId(Integer userId);
    boolean existsByUserIdAndGpuModel(Integer userId, String gpuModel);
    UserNotificationPreference findByUserIdAndGpuModel(Integer userId, String gpuModel);
    long countByUserId(Integer userId);
} 