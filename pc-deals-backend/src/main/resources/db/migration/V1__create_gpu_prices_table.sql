-- Create gpu_prices table
CREATE TABLE gpu_prices (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    model VARCHAR(255) NOT NULL,
    price INT NOT NULL,
    reddit_url VARCHAR(255) NOT NULL,
    reddit_posted_at TIMESTAMP NOT NULL,
    reddit_post_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_model (model),
    INDEX idx_posted_at (reddit_posted_at)
); 