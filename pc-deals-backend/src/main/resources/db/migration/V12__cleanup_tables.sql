-- Drop all old tables that conflict with our new schema
DROP TABLE IF EXISTS gpu;
DROP TABLE IF EXISTS user;
DROP TABLE IF EXISTS user_favorite;
DROP TABLE IF EXISTS notification_preference;
DROP TABLE IF EXISTS user_alerts;

-- Note: The following tables are managed by JPA entities and should not be dropped:
-- users (mapped to User.java)
-- gpu_prices (mapped to GPU.java)
-- user_notification_preferences (mapped to UserNotificationPreference.java)
-- user_favorites (managed through UserService) 