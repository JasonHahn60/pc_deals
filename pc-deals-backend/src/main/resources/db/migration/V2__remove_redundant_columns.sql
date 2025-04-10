-- Remove redundant columns
ALTER TABLE gpu_prices
DROP COLUMN location,
DROP COLUMN post_url,
DROP COLUMN created_at,
DROP COLUMN reddit_id; 