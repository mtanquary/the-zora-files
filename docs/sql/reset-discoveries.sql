-- Reset discoveries only
-- Keeps episodes and records intact.
-- Use this if you want to re-log discoveries without recreating episodes.

DELETE FROM discoveries;

-- Reset discovery points in zora_score for all episodes
UPDATE episodes
SET zora_score = jsonb_set(
  jsonb_set(zora_score, '{discovery_points}', '0'),
  '{total}',
  to_jsonb((zora_score->>'eos_index')::int + (zora_score->>'effort_points')::int)
);

SELECT count(*) as remaining_discoveries FROM discoveries;
