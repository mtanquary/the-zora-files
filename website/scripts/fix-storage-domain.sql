-- Point stored Supabase links back at the project's own address.
--
-- The custom domain site.thezorafiles.com stopped working when the Supabase
-- custom-domain add-on ended (Cloudflare error 1014). Files and APIs are all
-- still there at the project URL; only the hostname in saved links is wrong.
--
-- Rewrites https://site.thezorafiles.com/... to
-- https://bdszbuchldnxlywxylbo.supabase.co/... in every text/json column of
-- the public schema (episodes, discoveries, episode_media, member_submissions,
-- and anything else), and reports each column it touched. Idempotent: a
-- second run changes nothing. Reversible by swapping the two hostnames.
--
-- Run in the Supabase SQL editor (or psql). Wrapped in one transaction.

begin;

do $$
declare
  old_host constant text := 'https://site.thezorafiles.com/';
  new_host constant text := 'https://bdszbuchldnxlywxylbo.supabase.co/';
  r record;
  n bigint;
  total bigint := 0;
begin
  for r in
    select table_name, column_name, data_type
    from information_schema.columns c
    join information_schema.tables t using (table_schema, table_name)
    where c.table_schema = 'public'
      and t.table_type = 'BASE TABLE'
      and c.data_type in ('text', 'character varying', 'jsonb', 'json')
  loop
    if r.data_type in ('jsonb', 'json') then
      execute format(
        'update public.%I set %I = replace(%I::text, %L, %L)::%s where %I::text like %L',
        r.table_name, r.column_name, r.column_name, old_host, new_host, r.data_type,
        r.column_name, '%' || old_host || '%');
    else
      execute format(
        'update public.%I set %I = replace(%I, %L, %L) where %I like %L',
        r.table_name, r.column_name, r.column_name, old_host, new_host,
        r.column_name, '%' || old_host || '%');
    end if;
    get diagnostics n = row_count;
    if n > 0 then
      raise notice '%.%: % rows', r.table_name, r.column_name, n;
      total := total + n;
    end if;
  end loop;
  raise notice 'total rows updated: %', total;
end $$;

commit;
