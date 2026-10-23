-- Stays: bookable places (fire lookouts now; cabins and campsites later).
--
-- Run in the Supabase SQL editor (or psql against local Postgres). Idempotent.
-- The site reads and writes these through the server-side pg pool
-- (DATABASE_URL), which bypasses RLS. RLS is enabled with NO policies so the
-- public Supabase anon key can't read or write them through PostgREST.

-- ── Sites ────────────────────────────────────────────────────────────────
create table if not exists stay_sites (
  id                   text primary key,          -- 'recgov-234387', 'wv-thorny-mountain'
  kind                 text not null default 'lookout'
                         check (kind in ('lookout', 'cabin', 'campsite')),
  name                 text not null,
  state                text not null,
  operator             text,
  managing_unit        text,
  lat                  double precision,
  lng                  double precision,
  coords_approximate   boolean not null default false,
  platform             text not null,             -- recgov | goingtocamp | wv_state_parks | phone | airbnb
  provider_ref         text,                      -- Recreation.gov facility id, Airbnb room id, ...
  booking_url          text,
  info_url             text,
  -- Our own seasonal judgement, re-validated each winter. Deliberately
  -- separate from provider_reservable: the two can disagree.
  season_status        text not null default 'unknown'
                         check (season_status in ('open', 'seasonal', 'maintenance_closure',
                                                  'administrative_closure', 'unavailable', 'unknown')),
  season_notes         text,
  season_checked_at    date,
  provider_reservable  boolean,                   -- as reported by RIDB / Recreation.gov
  release_rule         jsonb not null,            -- see src/lib/stays/release.ts
  rating               numeric(3, 2),             -- first-party only (Recreation.gov)
  rating_count         integer,
  rating_source        text,
  sources              text[] not null default '{}',
  active               boolean not null default true,
  seed_version         integer,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create unique index if not exists idx_stay_sites_provider
  on stay_sites (platform, provider_ref) where provider_ref is not null;
create index if not exists idx_stay_sites_kind on stay_sites (kind, active);

-- ── Availability snapshot (latest known status per night) ────────────────
-- unit_id is the bookable unit inside a facility (Rec.gov campsite id).
-- Lookouts have one; campgrounds will have many.
create table if not exists stay_availability (
  site_id     text not null references stay_sites (id) on delete cascade,
  unit_id     text not null default '',
  date        date not null,
  status      text not null,   -- available | reserved | not_released | walk_up | lottery | closed
  raw_status  text,
  fetched_at  timestamptz not null,
  primary key (site_id, unit_id, date)
);
create index if not exists idx_stay_availability_date on stay_availability (date, status);

-- ── Status changes (drives alerts + "how fast it sells out") ─────────────
create table if not exists stay_availability_changes (
  id          bigserial primary key,
  site_id     text not null references stay_sites (id) on delete cascade,
  unit_id     text not null default '',
  date        date not null,
  old_status  text,
  new_status  text not null,
  changed_at  timestamptz not null default now()
);
create index if not exists idx_stay_changes_recent on stay_availability_changes (changed_at desc);
create index if not exists idx_stay_changes_site on stay_availability_changes (site_id, date);

-- ── Per site-month fetch bookkeeping (staleness + back-off) ──────────────
create table if not exists stay_fetch_state (
  site_id          text not null references stay_sites (id) on delete cascade,
  month            date not null,            -- first of month
  fetched_at       timestamptz,              -- last successful fetch
  last_http_status integer,
  error_count      integer not null default 0,
  next_attempt_at  timestamptz,              -- back-off gate
  primary key (site_id, month)
);

-- ── Poll run log (health check) ──────────────────────────────────────────
create table if not exists stay_poll_runs (
  id           bigserial primary key,
  provider     text not null,
  started_at   timestamptz not null default now(),
  finished_at  timestamptz,
  requests     integer not null default 0,
  ok           integer not null default 0,
  errors       integer not null default 0,
  changes      integer not null default 0,
  notes        text
);
create index if not exists idx_stay_poll_runs_started on stay_poll_runs (started_at desc);

-- ── Config (cadence etc., editable without a deploy) ─────────────────────
create table if not exists stay_config (
  key         text primary key,
  value       jsonb not null,
  updated_at  timestamptz not null default now()
);

insert into stay_config (key, value) values
  ('poll.recgov', '{
     "enabled": true,
     "batch_size": 12,
     "request_delay_ms": 2500,
     "refresh_hours": 24,
     "base_backoff_minutes": 30,
     "max_backoff_hours": 24,
     "cooldown_minutes_on_block": 120
   }'::jsonb)
on conflict (key) do nothing;

-- ── Lock it down from the public API ─────────────────────────────────────
alter table stay_sites                enable row level security;
alter table stay_availability         enable row level security;
alter table stay_availability_changes enable row level security;
alter table stay_fetch_state          enable row level security;
alter table stay_poll_runs            enable row level security;
alter table stay_config               enable row level security;
