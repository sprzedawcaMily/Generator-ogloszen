-- Add new column to track Vinted publication status
-- Run this SQL command in your Supabase SQL Editor

ALTER TABLE advertisements ADD COLUMN is_published_to_vinted BOOLEAN DEFAULT FALSE;

-- Optional: Update existing records if needed
-- Uncomment the line below if you want to mark all completed items as not published to Vinted
-- UPDATE advertisements SET is_published_to_vinted = FALSE WHERE is_completed = TRUE;

-- Check the result
SELECT id, title, is_completed, is_published_to_vinted FROM advertisements LIMIT 5;
