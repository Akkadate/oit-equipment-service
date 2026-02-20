-- Add photo_url column to repair_requests
ALTER TABLE repair_requests ADD COLUMN IF NOT EXISTS photo_url TEXT;
