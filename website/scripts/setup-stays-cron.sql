-- Schedule the lookout availability poller from Supabase.
--
-- SUPABASE ONLY (needs the pg_cron, pg_net, and vault extensions).
-- Run AFTER scripts/setup-stays.sql, in the Supabase SQL editor.
--
-- Supabase is the clock: every 5 minutes pg_cron makes pg_net POST to the
-- site's worker route, which polls one small, polite batch and writes the
-- results back into Postgres. Cadence knobs live in stay_config, not here.
--
-- Before running, replace <CRON_SECRET> below with the same random value you
-- set as CRON_SECRET in Vercel. It's stored in Supabase Vault so it never
-- appears in the cron job text.

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Store (or rotate) the shared secret in Vault.
do $$
begin
  if exists (select 1 from vault.secrets where name = 'lookouts_cron_secret') then
    perform vault.update_secret(
      (select id from vault.secrets where name = 'lookouts_cron_secret'),
      '<CRON_SECRET>'
    );
  else
    perform vault.create_secret('<CRON_SECRET>', 'lookouts_cron_secret');
  end if;
end $$;

-- Replace any earlier schedule, then create it.
select cron.unschedule(jobid) from cron.job where jobname = 'lookouts-poll';

select cron.schedule(
  'lookouts-poll',
  '*/5 * * * *',
  $$
  select net.http_post(
    url := 'https://thezorafiles.com/api/cron/lookouts',
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
