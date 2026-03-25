-- Database status overview
-- Quick snapshot of what's in the database.

SELECT '=== DATABASE STATUS ===' as info;

-- Table counts
SELECT 'episodes' as table_name, count(*) as rows FROM episodes
UNION ALL
SELECT 'discoveries', count(*) FROM discoveries
UNION ALL
SELECT 'records', count(*) FROM records;

-- Episodes summary
SELECT
  season,
  count(*) as episodes,
  min(episode_number) as first_ep,
  max(episode_number) as last_ep,
  min(eos_total) as min_eos,
  max(eos_total) as max_eos,
  round(avg(eos_total)) as avg_eos
FROM episodes
GROUP BY season
ORDER BY season;

-- Discovery breakdown
SELECT
  type,
  count(*) as total,
  count(*) FILTER (WHERE is_first_unlock) as first_unlocks,
  sum(points) as total_points
FROM discoveries
GROUP BY type
ORDER BY total DESC;

-- Detection methods
SELECT
  detection_method,
  count(*) as count
FROM discoveries
GROUP BY detection_method
ORDER BY count DESC;

-- Recent activity
SELECT
  episode_number, season, title, location_name, eos_total,
  shoot_date, created_at
FROM episodes
ORDER BY created_at DESC
LIMIT 5;
