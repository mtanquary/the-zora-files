-- Create the zorafiles database (run manually first):
--   createdb zorafiles
-- Then run this file:
--   psql -d zorafiles -f scripts/setup-db.sql

CREATE TABLE IF NOT EXISTS episodes (
  id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  episode_number INTEGER NOT NULL,
  season        INTEGER NOT NULL DEFAULT 1,
  title         TEXT NOT NULL,
  location_name TEXT NOT NULL,
  country       TEXT NOT NULL DEFAULT 'US',
  region        TEXT,
  coordinates   JSONB NOT NULL DEFAULT '{"lat":0,"lng":0}',
  shoot_date    DATE NOT NULL,
  publish_date  DATE,
  youtube_url   TEXT,

  -- Eos Index sub-scores (stored as full JSON for rationale support)
  eos_index     JSONB NOT NULL,
  eos_total     INTEGER NOT NULL,

  -- Effort
  effort_rating INTEGER NOT NULL CHECK (effort_rating BETWEEN 1 AND 5),
  effort_points INTEGER NOT NULL CHECK (effort_points IN (0, 5, 10, 15, 20)),

  -- Zora Score
  zora_score    JSONB NOT NULL,

  -- Context
  distance_miles        REAL,
  elevation_gain_ft     REAL,
  minutes_before_sunrise INTEGER,
  weather_notes         TEXT,
  streak_active         BOOLEAN NOT NULL DEFAULT false,

  thumbnail_url TEXT,
  notes         TEXT,

  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS discoveries (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  episode_id      TEXT NOT NULL REFERENCES episodes(id) ON DELETE CASCADE,
  type            TEXT NOT NULL CHECK (type IN ('wildlife', 'plant', 'geographic', 'cultural_historical')),
  name            TEXT NOT NULL,
  scientific_name TEXT,
  country         TEXT NOT NULL DEFAULT 'US',
  rarity_tier     TEXT NOT NULL CHECK (rarity_tier IN ('common', 'uncommon', 'rare', 'very_rare', 'exceptional')),
  points          INTEGER NOT NULL,
  photo_url       TEXT,
  fun_fact        TEXT,
  first_spotted   DATE NOT NULL,
  location_name   TEXT NOT NULL,
  is_first_unlock BOOLEAN NOT NULL DEFAULT true,
  subsequent_find_number INTEGER,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS records (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  category        TEXT NOT NULL,
  value           TEXT NOT NULL,
  episode_id      TEXT NOT NULL REFERENCES episodes(id) ON DELETE CASCADE,
  set_date        DATE NOT NULL,
  previous_holder TEXT,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_episodes_eos_total ON episodes (eos_total DESC);
CREATE INDEX IF NOT EXISTS idx_discoveries_episode ON discoveries (episode_id);
CREATE INDEX IF NOT EXISTS idx_records_category ON records (category);
