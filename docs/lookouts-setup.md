# Lookout, cabin & guard station finder: setup and operations

The `/lookouts` page maps every rentable US fire lookout (89), plus every federal standalone cabin and guard station on Recreation.gov (572: 446 cabins, 126 guard/ranger stations, as of the October 2026 seeds). It colors pins by availability for the dates a visitor picks and shows each site's release calendar. A type toggle filters lookouts / cabins / guard stations; `/cabins` and `/guard-stations` redirect to the map pre-filtered (`?type=cabin`). Background research: `fire-lookout-research.md` (lookouts) and `cabins-research.md` (cabins and guard stations).

## How it fits together

| Piece | Where | What it does |
|---|---|---|
| Lookout seed | `website/data/stays/lookouts.v1.json` | Versioned lookout list. Built by `scripts/stays/seed-lookouts.mjs` from FFLA's rental page, Recreation.gov search (ratings, coordinates), optional RIDB, plus the hand-curated files next to it. |
| Cabin seed | `website/data/stays/cabins.v1.json` | Cabins and guard stations. Built by `scripts/stays/seed-cabins.mjs` from Recreation.gov search (by cabin unit type and by keyword), Recreation.gov campsite search (unit types), and the USDA Forest Service EDW "Cabin Rentals" layer (seasons, FS pages, cross-check). Corrections in `cabins-supplement.json`. Review lists for later layers (yurts, campground cabins, FS rentals not on Recreation.gov) are under `candidates`. |
| Tables | `website/scripts/setup-stays.sql` | `stay_sites` (kind `lookout` / `cabin` / `guard_station`), `stay_availability`, `stay_availability_changes`, `stay_fetch_state`, `stay_poll_runs`, `stay_config`. RLS on, no policies: only the server's direct Postgres connection can touch them. Safe to re-run; it adds the cabin columns to an existing install. |
| Loader | `scripts/stays/load-stays.mjs` | Upserts both seeds (`load-lookouts.mjs` is an alias). Sites that drop out of their seed are deactivated, not deleted. |
| Poller | `src/lib/stays/poller.ts` via `POST /api/cron/lookouts` | Fetches a small batch of site-months from Recreation.gov per call (15 by default), 2.5 s apart, oldest first, across all kinds. Facilities that mix cabins with tent sites only store their cabin units (`stay_sites.unit_types`). Backs off per site-month on errors; pauses everything for 2 hours on a 403/429. |
| Schedule | `website/scripts/setup-stays-cron.sql` | Supabase pg_cron calls the worker every 5 minutes, about 3 requests a minute (4,300 a day). Tiered refresh: lookouts every 24 hours, cabins and guard stations every 48 (`refresh_hours_by_kind`). That needs about 2,600 site-month fetches a day, so there's headroom; the very first cabin sweep takes about a day. |
| Map | `src/app/lookouts/` | Reads only our own tables through `/api/lookouts?kind=...`. The browser never contacts Recreation.gov (listing photos load from Recreation.gov's CDN). |

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
      node scripts/stays/load-stays.mjs --supabase
      ```
   It should print `Target: Supabase (...)`, then `lookouts.v1.json: upserted 89 sites` and `cabins.v1.json: upserted 572 sites`. If it says the table doesn't exist or is missing the cabin columns, run step 3 first.
5. **Deploy**, then **schedule the poller.** Push to `main` so `/api/cron/lookouts` exists in production. Then in the Supabase SQL Editor, open `website/scripts/setup-stays-cron.sql`, replace `<CRON_SECRET>` on the one marked line with your secret (in the editor, not in the repo file), and run it. If it complains about an extension, enable `pg_cron` and `pg_net` under Database → Extensions and run it again.
6. **Check it's working** after 10 minutes:
   ```sql
   select * from stay_poll_runs order by started_at desc limit 5;
   select * from cron.job_run_details order by start_time desc limit 5;
   ```
   Runs should show `ok` equal to `requests`. The map fills in over the first few hours.

## Adding cabins + guard stations to an existing install (October 2026)

Already running the lookout-only version? Three steps, no new secrets:

1. Supabase SQL Editor: paste and run `website/scripts/setup-stays.sql` again. It adds the cabin columns, allows the new kinds, and adds the per-kind refresh tiers to `stay_config` (keeping any knobs you've changed).
2. From `website`: `node scripts/stays/load-stays.mjs --supabase`.
3. Deploy (push to `main`). The existing cron job keeps working; cabins start filling in on the next runs.

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

Load the seeds into the local database with `node scripts/stays/load-stays.mjs` (after running `setup-stays.sql` against it).

## Every winter (before the summer booking rush)

1. Optional: get a free RIDB key at ridb.recreation.gov and add `RIDB_API_KEY=...` to `.env.local`. The seeder then prefers RIDB's official coordinates and reservable flag.
2. Run `node scripts/stays/seed-lookouts.mjs`. It re-reads FFLA's closures and refreshes ratings.
3. Review the `candidates` list at the bottom of `lookouts.v1.json`: Recreation.gov facilities named like lookouts that FFLA doesn't list (currently Bolan Mountain, Flag Point, Onion Mountain, Quail Prairie, Blackhall). To include one, add it under `extra` in `recgov-supplement.json`.
4. Update season notes in `recgov-supplement.json` and the non-Recreation.gov entries in `manual-lookouts.json`. Werner Peak's phone day is estimated; confirm it with DNRC in January.
5. Run `node scripts/stays/seed-cabins.mjs` (about 100 requests, roughly ten minutes; no key needed). It caches the raw responses in `data/stays/raw/` (git-ignored), so `--from-raw` rebuilds without the network.
6. Review the `candidates` lists at the bottom of `cabins.v1.json`:
   - `usfs_not_on_recgov`: Forest Service cabin rentals with no Recreation.gov match (phone or first-come cabins, or a name/coordinate mismatch). Add a match or a non-Recreation.gov entry under `extra` in `cabins-supplement.json`.
   - `unclear`: name says cabin but no unit is typed as one. Keep one with `overrides.<id>.force: true`.
   - `campground_cabins`, `yurts`: left out on purpose (future layers).
   - `lookouts`: Recreation.gov facilities named like lookouts that aren't in the lookout seed. Add them through `recgov-supplement.json`.
7. Commit the new seeds, then load them into Supabase (step 4 above).

## Tuning the cadence (no deploy needed)

```sql
-- Refresh lookouts every 12 hours instead of 24
update stay_config set value = jsonb_set(value, '{refresh_hours_by_kind,lookout}', '12') where key = 'poll.recgov';
-- Refresh cabins daily instead of every two days
update stay_config set value = jsonb_set(value, '{refresh_hours_by_kind,cabin}', '24') where key = 'poll.recgov';
-- refresh_hours is the fallback for any kind not listed in refresh_hours_by_kind
-- Pause polling
update stay_config set value = jsonb_set(value, '{enabled}', 'false') where key = 'poll.recgov';
-- Clear a cool-down after a block
delete from stay_config where key = 'poll.recgov.cooldown';
```

**Observed limit (2026-10-07):** Recreation.gov returned HTTP 429 after about 370 requests in 16 minutes (roughly 23 per minute, back-to-back batches from a local test). The default schedule runs about 3 requests per minute (15 per 5-minute run), around an eighth of that. Don't raise `batch_size` or lower `request_delay_ms` enough to approach it. If you need faster sweeps, run the cron more often (`*/3`) before touching the batch size.

Keep request volume low. Recreation.gov's terms prohibit bots that book; this is read-only, slow, and identifies itself, but if it ever starts seeing 403s, back off rather than work around it.

## Still to come

- **Alerts** (next phase): watches tied to member accounts, email via Resend for cancellations and the day-before / morning-of release reminders. `stay_availability_changes` already records every status flip.
- **GoingToCamp provider** for Quartz Mountain (phase 1b).
- **Per-cabin pins for multi-cabin listings** (Kenai and Kodiak refuge cabins, White Mountains NRA, Kenai Fjords): one pin per unit using the campsite coordinates already fetched by the cabin seed.
- **More layers**: yurts and campground cabins (already listed under `candidates`), then state park cabins (GoingToCamp, ReserveAmerica, UseDirect) with the same tables and provider interface.
