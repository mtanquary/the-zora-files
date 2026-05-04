-- Migration: add episode_media table for photos and videos attached to episodes
-- Run against existing database:
--   psql -d zorafiles -f scripts/add-episode-media.sql

CREATE TABLE IF NOT EXISTS episode_media (
  id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  episode_id    TEXT NOT NULL REFERENCES episodes(id) ON DELETE CASCADE,
  kind          TEXT NOT NULL CHECK (kind IN ('photo', 'video')),
  url           TEXT NOT NULL,
  storage_path  TEXT,
  caption       TEXT,
  mime_type     TEXT,
  size_bytes    BIGINT,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_episode_media_episode ON episode_media (episode_id, sort_order);
