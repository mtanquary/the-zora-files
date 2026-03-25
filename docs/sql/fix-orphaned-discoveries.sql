-- Fix orphaned discoveries
-- Removes discoveries that reference episodes which no longer exist.
-- This can happen if an episode was deleted but its discoveries were not
-- (should not happen with CASCADE, but just in case).

-- Preview what will be deleted
SELECT d.id, d.name, d.episode_id
FROM discoveries d
LEFT JOIN episodes e ON d.episode_id = e.id
WHERE e.id IS NULL;

-- Delete orphans
DELETE FROM discoveries
WHERE episode_id NOT IN (SELECT id FROM episodes);

-- Also remove empty-name discoveries (accidental blank entries)
DELETE FROM discoveries WHERE name = '' OR name IS NULL;

SELECT count(*) as remaining_discoveries FROM discoveries;
