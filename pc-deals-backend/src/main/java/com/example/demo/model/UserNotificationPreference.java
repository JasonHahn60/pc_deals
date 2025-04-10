package com.example.demo.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_notification_preferences")
public class UserNotificationPreference {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Integer userId;

    @Column(name = "gpu_model", nullable = false)
    private String gpuModel;

    @Column(name = "price_threshold", nullable = false)
    private Integer priceThreshold;

    @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
    private LocalDateTime createdAt;

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Integer getUserId() {
        return userId;
    }

    public void setUserId(Integer userId) {
        this.userId = userId;
    }

    public String getGpuModel() {
        return gpuModel;
    }

    public void setGpuModel(String gpuModel) {
        this.gpuModel = gpuModel;
    }

    public Integer getPriceThreshold() {
        return priceThreshold;
    }

    public void setPriceThreshold(Integer priceThreshold) {
        this.priceThreshold = priceThreshold;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
} 