-- Fix episode numbering gaps
-- Re-numbers episodes sequentially within each season based on shoot_date.
-- Example: if you deleted E02 and have E01, E03, E04, this makes them E01, E02, E03.

WITH renumbered AS (
  SELECT id,
         ROW_NUMBER() OVER (PARTITION BY season ORDER BY shoot_date, created_at) as new_number
  FROM episodes
)
UPDATE episodes
SET episode_number = renumbered.new_number
FROM renumbered
WHERE episodes.id = renumbered.id
  AND episodes.episode_number != renumbered.new_number;

-- Show the result
SELECT season, episode_number, title, shoot_date
FROM episodes
ORDER BY season, episode_number;
