# Fire lookout finder: setup and operations

The `/lookouts` page maps every rentable US fire lookout (89 as of the October 2026 seed), colors pins by availability for the dates a visitor picks, and shows each lookout's release calendar. Background research: `fire-lookout-research.md`.

## How it fits together

| Piece | Where | What it does |
|---|---|---|
| Seed | `website/data/stays/lookouts.v1.json` | Versioned lookout list. Built by `scripts/stays/seed-lookouts.mjs` from FFLA's rental page, Recreation.gov search (ratings, coordinates), optional RIDB, plus the hand-curated files next to it. |
| Tables | `website/scripts/setup-stays.sql` | `stay_sites`, `stay_availability`, `stay_availability_changes`, `stay_fetch_state`, `stay_poll_runs`, `stay_config`. RLS on, no policies: only the server's direct Postgres connection can touch them. |
| Poller | `src/lib/stays/poller.ts` via `POST /api/cron/lookouts` | Fetches a small batch of site-months from Recreation.gov per call, 2.5 s apart, oldest first. Backs off per site-month on errors; pauses everything for 2 hours on a 403/429. |
| Schedule | `website/scripts/setup-stays-cron.sql` | Supabase pg_cron calls the worker every 5 minutes. A full sweep (~490 site-months) takes about 3.5 hours of batches; each site-month refreshes every 24 hours. |
| Map | `src/app/lookouts/` | Reads only our own tables through `/api/lookouts`. The browser never contacts Recreation.gov. |

Nothing in this feature books, holds, or logs in anywhere. It links out.

## One-time production setup

1. **Pick a secret.** In Git Bash: `openssl rand -hex 32`. Keep it handy for steps 2 and 5.
2. **Vercel.** Project → Settings → Environment Variables → add `CRON_SECRET` with that value (Production). Optionally add `RIDB_API_KEY` later; the site itself doesn't need it.
3. **Create the tables in Supabase.** SQL Editor → paste and run `website/scripts/setup-stays.sql`.
4. **Load the lookouts into Supabase.**
   1. In Supabase, open the project and click **Connect** (top of the dashboard). Copy the **Session pooler** connection string. It starts with `postgresql://postgres.` and contains `[YOUR-PASSWORD]`.
   2. Replace `[YOUR-PASSWORD]` with your database password (Project Settings → Database lets you reset it if you don't have it).
   3. Add it to `website/.env.local` as a new line: `SUPABASE_DB_URL=postgresql://...` (no quotes, no spaces around `=`).
   4. In any terminal (PowerShell, Command Prompt, or Git Bash), from the `website` folder, run:
      ```
      node scripts/stays/load-lookouts.mjs --supabase
      ```
   It should print `Target: Supabase (...)` and `Upserted 89 sites.` If it says the table doesn't exist, run step 3 first.
5. **Deploy**, then **schedule the poller.** Push to `main` so `/api/cron/lookouts` exists in production. Then in the Supabase SQL Editor, open `website/scripts/setup-stays-cron.sql`, replace both `<CRON_SECRET>` placeholders with your secret, and run it. If it complains about an extension, enable `pg_cron` and `pg_net` under Database → Extensions and run it again.
6. **Check it's working** after 10 minutes:
   ```sql
   select * from stay_poll_runs order by started_at desc limit 5;
   select * from cron.job_run_details order by start_time desc limit 5;
   ```
   Runs should show `ok` equal to `requests`. The map fills in over the first few hours.

## Local development

The local database is a dedicated Postgres cluster in `~/.pgsql-zora` on port 5433 (separate from deem_api's). `.env.local` points `DATABASE_URL` at it.

```bash
bash scripts/db/local-db.sh start      # after a reboot
bash scripts/db/local-db.sh status
bash scripts/db/copy-prod-to-local.sh  # refresh from production (read-only against prod)
```

The copy needs `SUPABASE_DB_URL` in `.env.local`: Supabase dashboard → **Connect** → **Session pooler** URI with the password filled in. It skips the member tables (`profiles`, `member_submissions`) because they depend on Supabase Auth.

In development the worker runs without a secret, so you can trigger a batch by hand:

```bash
curl -X POST "http://localhost:3000/api/cron/lookouts?limit=4"
```

## Every winter (before the summer booking rush)

1. Optional: get a free RIDB key at ridb.recreation.gov and add `RIDB_API_KEY=...` to `.env.local`. The seeder then prefers RIDB's official coordinates and reservable flag.
2. Run `node scripts/stays/seed-lookouts.mjs`. It re-reads FFLA's closures and refreshes ratings.
3. Review the `candidates` list at the bottom of `lookouts.v1.json`: Recreation.gov facilities named like lookouts that FFLA doesn't list (currently Bolan Mountain, Flag Point, Onion Mountain, Quail Prairie, Blackhall). To include one, add it under `extra` in `recgov-supplement.json`.
4. Update season notes in `recgov-supplement.json` and the non-Recreation.gov entries in `manual-lookouts.json`. Werner Peak's phone day is estimated; confirm it with DNRC in January.
5. Commit the new seed, then load it into Supabase (step 4 above).

## Tuning the cadence (no deploy needed)

```sql
-- Refresh every 12 hours instead of 24
update stay_config set value = jsonb_set(value, '{refresh_hours}', '12') where key = 'poll.recgov';
-- Pause polling
update stay_config set value = jsonb_set(value, '{enabled}', 'false') where key = 'poll.recgov';
-- Clear a cool-down after a block
delete from stay_config where key = 'poll.recgov.cooldown';
```

**Observed limit (2026-10-07):** Recreation.gov returned HTTP 429 after about 370 requests in 16 minutes (roughly 23 per minute, back-to-back batches from a local test). The default schedule runs about 2.4 requests per minute, around a tenth of that. Don't raise `batch_size` or lower `request_delay_ms` enough to approach it.

Keep request volume low. Recreation.gov's terms prohibit bots that book; this is read-only, slow, and identifies itself, but if it ever starts seeing 403s, back off rather than work around it.

## Still to come

- **Alerts** (next phase): watches tied to member accounts, email via Resend for cancellations and the day-before / morning-of release reminders. `stay_availability_changes` already records every status flip.
- **GoingToCamp provider** for Quartz Mountain (phase 1b).
- **Cabins and campsites**: same tables (`kind`, `unit_id`) and the same provider interface.
