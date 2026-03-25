-- Add detection_method column to discoveries table
-- Safe to run multiple times (IF NOT EXISTS).
-- Run this on any database that was created before the detection method feature.

ALTER TABLE discoveries
ADD COLUMN IF NOT EXISTS detection_method TEXT NOT NULL DEFAULT 'photographed'
CHECK (detection_method IN ('photographed', 'visual', 'audio', 'visual_and_audio'));

-- Verify
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'discoveries' AND column_name = 'detection_method';
