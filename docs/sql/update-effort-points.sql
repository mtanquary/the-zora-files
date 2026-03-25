-- Update effort point values from (0, 5, 10, 15, 20) to (0, 5, 15, 25, 40)
-- The effort curve now balloons to properly reward exponential difficulty increases.

-- Drop the old constraint and add the new one
ALTER TABLE episodes DROP CONSTRAINT IF EXISTS episodes_effort_points_check;
ALTER TABLE episodes ADD CONSTRAINT episodes_effort_points_check CHECK (effort_points IN (0, 5, 15, 25, 40));

-- Update any existing data with old point values
UPDATE episodes SET effort_points = 15 WHERE effort_rating = 3 AND effort_points = 10;
UPDATE episodes SET effort_points = 25 WHERE effort_rating = 4 AND effort_points = 15;
UPDATE episodes SET effort_points = 40 WHERE effort_rating = 5 AND effort_points = 20;

-- Recalculate zora_score totals for affected episodes
UPDATE episodes SET zora_score = jsonb_set(
  zora_score,
  '{total}',
  to_jsonb((zora_score->>'eos_index')::int + effort_points + (zora_score->>'discovery_points')::int)
),
zora_score = jsonb_set(
  zora_score,
  '{effort_points}',
  to_jsonb(effort_points)
);

-- Verify
SELECT episode_number, title, effort_rating, effort_points, zora_score->>'total' as zora_total
FROM episodes ORDER BY episode_number;
