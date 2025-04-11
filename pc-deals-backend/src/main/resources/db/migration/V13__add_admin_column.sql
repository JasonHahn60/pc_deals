-- Add is_admin column to users table
ALTER TABLE users ADD COLUMN is_admin BOOLEAN NOT NULL DEFAULT false;

-- Update existing admin user
UPDATE users SET is_admin = true WHERE id = 1; 