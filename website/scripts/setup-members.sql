-- Member accounts + self-service Eos scoring.
--
-- RUN THIS IN THE SUPABASE SQL EDITOR (cloud project), not local Postgres —
-- it depends on the `auth.users` table that Supabase Auth manages.
--
-- Creates:
--   profiles            — name + email + marketing consent (the email list)
--   member_submissions  — each scored sunrise (private history + usage ledger)
-- plus a trigger that creates a profile row on signup, and RLS so members can
-- only ever see their own rows.

-- ── profiles: one row per member ───────────────────────────────────────────
create table if not exists public.profiles (
  id                uuid primary key references auth.users (id) on delete cascade,
  email             text,
  full_name         text,
  marketing_consent boolean not null default false,
  created_at        timestamptz not null default now()
);

-- ── member_submissions: scored sunrises (also the monthly-quota ledger) ─────
create table if not exists public.member_submissions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  photo_path  text,
  photo_url   text,
  location    text,
  eos_index   jsonb not null,
  eos_total   integer not null,
  created_at  timestamptz not null default now()
);

create index if not exists idx_member_submissions_user_created
  on public.member_submissions (user_id, created_at desc);

-- ── auto-create a profile when a user signs up ─────────────────────────────
-- Pulls name/consent from sign-up metadata (email flow) or OAuth claims (Google).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, marketing_consent)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      ''
    ),
    coalesce((new.raw_user_meta_data ->> 'marketing_consent')::boolean, false)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── Row-Level Security ─────────────────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.member_submissions enable row level security;

-- profiles: a member can read and update only their own row.
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select using (auth.uid() = id);

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- Fallback insert policy (the trigger above normally handles creation).
drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles
  for insert with check (auth.uid() = id);

-- member_submissions: a member can read and create only their own rows.
drop policy if exists submissions_select_own on public.member_submissions;
create policy submissions_select_own on public.member_submissions
  for select using (auth.uid() = user_id);

drop policy if exists submissions_insert_own on public.member_submissions;
create policy submissions_insert_own on public.member_submissions
  for insert with check (auth.uid() = user_id);
