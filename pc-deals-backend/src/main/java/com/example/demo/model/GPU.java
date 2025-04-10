package com.example.demo.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "gpu_prices")
public class GPU {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "model")
    private String model;

    @Column(name = "price")
    private Integer price;

    @Column(name = "reddit_url")
    private String redditUrl;

    @Column(name = "reddit_posted_at")
    private LocalDateTime redditPostedAt;

    @Column(name = "reddit_post_id")
    private String redditPostId;

    @Column(name = "deal_score")
    private Double dealScore;

    public GPU() {}

    public GPU(String model, Integer price, String redditUrl, LocalDateTime redditPostedAt, String redditPostId) {
        this.model = model;
        this.price = price;
        this.redditUrl = redditUrl;
        this.redditPostedAt = redditPostedAt;
        this.redditPostId = redditPostId;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getModel() {
        return model;
    }

    public void setModel(String model) {
        this.model = model;
    }

    public Integer getPrice() {
        return price;
    }

    public void setPrice(Integer price) {
        this.price = price;
    }

    public String getRedditUrl() {
        return redditUrl;
    }

    public void setRedditUrl(String redditUrl) {
        this.redditUrl = redditUrl;
    }

    public LocalDateTime getRedditPostedAt() {
        return redditPostedAt;
    }

    public void setRedditPostedAt(LocalDateTime redditPostedAt) {
        this.redditPostedAt = redditPostedAt;
    }

    public String getRedditPostId() {
        return redditPostId;
    }

    public void setRedditPostId(String redditPostId) {
        this.redditPostId = redditPostId;
    }

    public Double getDealScore() {
        return dealScore;
    }

    public void setDealScore(Double dealScore) {
        this.dealScore = dealScore;
    }
} 