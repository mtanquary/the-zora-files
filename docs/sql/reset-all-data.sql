-- Reset all data (fresh start)
-- Deletes all discoveries, episodes, and records.
-- Tables and schema remain intact.

DELETE FROM discoveries;
DELETE FROM records;
DELETE FROM episodes;

-- Verify
SELECT 'episodes' as table_name, count(*) as rows FROM episodes
UNION ALL
SELECT 'discoveries', count(*) FROM discoveries
UNION ALL
SELECT 'records', count(*) FROM records;
