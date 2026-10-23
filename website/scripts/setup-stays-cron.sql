-- Schedule the lookout availability poller from Supabase.
--
-- SUPABASE ONLY (needs the pg_cron, pg_net, and vault extensions).
-- Run AFTER scripts/setup-stays.sql, in the Supabase SQL editor.
--
-- Supabase is the clock: every 5 minutes pg_cron makes pg_net POST to the
-- site's worker route, which polls one small, polite batch and writes the
-- results back into Postgres. Cadence knobs live in stay_config, not here.
--
-- HOW TO RUN: paste this whole file into the Supabase SQL editor, replace
-- <CRON_SECRET> on the ONE line marked below with the same value you set as
-- CRON_SECRET in Vercel, and run it. Don't save the secret into this file in
-- the repo. It's stored in Supabase Vault, so it never appears in the cron
-- job text. Re-running with a new value rotates it.

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Store (or rotate) the shared secret in Vault.
do $$
declare
  secret text := '<CRON_SECRET>';  -- <== replace with your secret (keep the quotes)
begin
  if secret like '<%>' or length(secret) < 20 then
    raise exception 'Replace <CRON_SECRET> with your real secret (the same value as CRON_SECRET in Vercel) before running.';
  end if;
  if exists (select 1 from vault.secrets where name = 'lookouts_cron_secret') then
    perform vault.update_secret(
      (select id from vault.secrets where name = 'lookouts_cron_secret'),
      secret
    );
  else
    perform vault.create_secret(secret, 'lookouts_cron_secret');
  end if;
end $$;

-- Replace any earlier schedule, then create it.
select cron.unschedule(jobid) from cron.job where jobname = 'lookouts-poll';

select cron.schedule(
  'lookouts-poll',
  '*/5 * * * *',
  $$
  select net.http_post(
    url := 'https://www.thezorafiles.com/api/cron/lookouts',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (
        select decrypted_secret from vault.decrypted_secrets where name = 'lookouts_cron_secret'
      )
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 60000
  );
  $$
);

-- Handy checks:
--   select * from cron.job where jobname = 'lookouts-poll';
--   select * from cron.job_run_details order by start_time desc limit 10;
--   select * from stay_poll_runs order by started_at desc limit 20;
--   update stay_config set value = jsonb_set(value, '{enabled}', 'false') where key = 'poll.recgov';  -- pause
