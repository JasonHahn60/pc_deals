-- Modify users table to add default value for created_at
ALTER TABLE users MODIFY COLUMN created_at datetime(6) DEFAULT CURRENT_TIMESTAMP(6);

-- Modify user_favorites table to add default value for created_at
ALTER TABLE user_favorites MODIFY COLUMN created_at timestamp DEFAULT CURRENT_TIMESTAMP;

-- Modify user_notification_preferences table to add default value for created_at
ALTER TABLE user_notification_preferences MODIFY COLUMN created_at datetime(6) DEFAULT CURRENT_TIMESTAMP(6); 