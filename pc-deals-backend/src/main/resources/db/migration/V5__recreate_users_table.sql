-- Drop tables in correct order to handle foreign key constraints
DROP TABLE IF EXISTS user_alerts;
DROP TABLE IF EXISTS user_notification_preferences;
DROP TABLE IF EXISTS user_favorites;
DROP TABLE IF EXISTS users;

-- Create new users table with email as primary identifier
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX users_email_idx (email)
);

-- Recreate user_favorites table
CREATE TABLE user_favorites (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    model VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_model (user_id, model)
);

-- Recreate user_notification_preferences table
CREATE TABLE user_notification_preferences (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    gpu_model VARCHAR(255) NOT NULL,
    price_threshold DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_gpu (user_id, gpu_model)
); 