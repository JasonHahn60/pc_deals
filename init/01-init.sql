-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS pc_deals;
USE pc_deals;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at datetime(6) DEFAULT CURRENT_TIMESTAMP(6),
    INDEX users_email_idx (email)
);

-- Create gpu_prices table
CREATE TABLE IF NOT EXISTS gpu_prices (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    model VARCHAR(255) NOT NULL,
    price INT NOT NULL,
    reddit_url VARCHAR(255),
    reddit_posted_at datetime(6),
    reddit_post_id VARCHAR(255),
    deal_score DECIMAL(10,2),
    created_at datetime(6) DEFAULT CURRENT_TIMESTAMP(6)
);

-- Create user_favorites table
CREATE TABLE IF NOT EXISTS user_favorites (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    model VARCHAR(255) NOT NULL,
    created_at datetime(6) DEFAULT CURRENT_TIMESTAMP(6),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_model (user_id, model)
);

-- Create user_notification_preferences table
CREATE TABLE IF NOT EXISTS user_notification_preferences (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    gpu_model VARCHAR(255) NOT NULL,
    price_threshold INT NOT NULL,
    created_at datetime(6) DEFAULT CURRENT_TIMESTAMP(6),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_gpu (user_id, gpu_model)
); 