import "server-only";
import pool from "@/lib/db";
import { getProvider } from "./providers";
import { addMonthsISO, firstOfMonthISO, latestReleasedNight, todayIn, type ReleaseRule } from "./release";

/**
 * One polite polling batch. Called by the cron route every few minutes; each
 * call fetches at most `batch_size` site-months, oldest first, with a delay
 * between requests. Cadence lives in stay_config so it can change without a
 * deploy:
 *
 *   batch_size          site-months per call
 *   request_delay_ms    pause between requests
 *   refresh_hours       how stale a site-month may get before it's re-fetched
 *   refresh_hours_by_kind   per-kind override, e.g. {"lookout": 24, "cabin": 48}
 *   base_backoff_minutes / max_backoff_hours   per site-month error back-off
 *   cooldown_minutes_on_block   provider-wide pause after a 403/429
 *
 * Read-only against providers. Nothing here books anything.
 */

export interface PollConfig {
  enabled: boolean;
  batch_size: number;
  request_delay_ms: number;
  refresh_hours: number;
  refresh_hours_by_kind: Record<string, number>;
  base_backoff_minutes: number;
  max_backoff_hours: number;
  cooldown_minutes_on_block: number;
}

const DEFAULTS: PollConfig = {
  enabled: true,
  batch_size: 15,
  request_delay_ms: 2500,
  refresh_hours: 24,
  refresh_hours_by_kind: { lookout: 24, cabin: 48, guard_station: 48 },
  base_backoff_minutes: 30,
  max_backoff_hours: 24,
  cooldown_minutes_on_block: 120,
};

const RECGOV_RULE: ReleaseRule = { type: "rolling_months", months: 6, time: "07:00", tz: "America/Los_Angeles" };

export interface BatchResult {
  platform: string;
  skipped?: string;
  requests: number;
  ok: number;
  errors: number;
  changes: number;
  blocked: boolean;
  elapsed_ms: number;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function readConfig(platform: string): Promise<{ cfg: PollConfig; cooldownUntil: Date | null }> {
  const { rows } = await pool.query(
    `select key, value from stay_config where key = any($1)`,
    [[`poll.${platform}`, `poll.${platform}.cooldown`]]
  );
  const byKey = new Map(rows.map((r) => [r.key as string, r.value]));
  const cfg = { ...DEFAULTS, ...(byKey.get(`poll.${platform}`) ?? {}) } as PollConfig;
  const cd = byKey.get(`poll.${platform}.cooldown`) as { until?: string } | undefined;
  return { cfg, cooldownUntil: cd?.until ? new Date(cd.until) : null };
}

/** Months from this one through the month holding the last released night. */
export function pollMonths(rule: ReleaseRule, now: Date = new Date()): string[] {
  const tz = rule.type === "rolling_months" ? (rule.tz ?? "America/Los_Angeles") : "UTC";
  const first = firstOfMonthISO(todayIn(tz, now));
  const last = firstOfMonthISO(latestReleasedNight(rule, now) ?? first);
  const months: string[] = [];
  for (let m = first; m <= last && months.length < 14; m = addMonthsISO(m, 1)) months.push(m);
  return months;
}

/**
 * One batch at a time per platform. A second call that arrives while a batch
 * is still running (a slow run overlapping the next cron tick, or a manual
 * trigger) skips immediately instead of doubling the request rate.
 *
 * Uses a transaction-scoped advisory lock on a dedicated connection: it works
 * through Supabase's transaction pooler (the open transaction pins one server
 * connection) and releases itself if the run crashes or the connection drops.
 */
export async function runPollBatch(platform = "recgov", opts: { limit?: number } = {}): Promise<BatchResult> {
  const lockClient = await pool.connect();
  let released = false;
  try {
    await lockClient.query("begin");
    const { rows } = await lockClient.query("select pg_try_advisory_xact_lock(hashtext($1)) as ok", [
      `stays-poll:${platform}`,
    ]);
    if (!rows[0]?.ok) {
      await lockClient.query("rollback");
      return {
        platform,
        requests: 0,
        ok: 0,
        errors: 0,
        changes: 0,
        blocked: false,
        elapsed_ms: 0,
        skipped: "another batch is running",
      };
    }
    try {
      return await runPollBatchUnlocked(platform, opts);
    } finally {
      // Ends the transaction, which releases the lock.
      await lockClient.query("commit").catch(() => {});
    }
  } catch (err) {
    // Connection trouble: discard this client instead of returning it to the pool.
    lockClient.release(err as Error);
    released = true;
    throw err;
  } finally {
    if (!released) lockClient.release();
  }
}

async function runPollBatchUnlocked(platform: string, opts: { limit?: number }): Promise<BatchResult> {
  const started = Date.now();
  const result: BatchResult = { platform, requests: 0, ok: 0, errors: 0, changes: 0, blocked: false, elapsed_ms: 0 };
  const provider = getProvider(platform);
  if (!provider) return { ...result, skipped: "no provider" };

  const { cfg, cooldownUntil } = await readConfig(platform);
  if (!cfg.enabled) return { ...result, skipped: "disabled in stay_config" };
  if (cooldownUntil && cooldownUntil > new Date()) {
    return { ...result, skipped: `cooling down until ${cooldownUntil.toISOString()}` };
  }

  const months = pollMonths(RECGOV_RULE);
  const limit = Math.max(1, Math.min(opts.limit ?? cfg.batch_size, cfg.batch_size));
  const { rows: due } = await pool.query(
    `select s.id, s.provider_ref, s.unit_types, m.month::text as month, coalesce(f.error_count, 0) as error_count
     from stay_sites s
     cross join unnest($1::date[]) as m(month)
     left join stay_fetch_state f on f.site_id = s.id and f.month = m.month
     where s.active and s.platform = $2 and s.provider_ref is not null
       and s.season_status not in ('maintenance_closure', 'administrative_closure', 'unavailable')
       and (f.fetched_at is null
            or f.fetched_at < now() - make_interval(hours => coalesce(($5::jsonb ->> s.kind)::int, $3::int)))
       and (f.next_attempt_at is null or f.next_attempt_at <= now())
     order by f.fetched_at asc nulls first, m.month asc, s.id
     limit $4`,
    [months, platform, cfg.refresh_hours, limit, JSON.stringify(cfg.refresh_hours_by_kind ?? {})]
  );
  if (due.length === 0) return { ...result, skipped: "nothing due", elapsed_ms: Date.now() - started };

  const { rows: runRows } = await pool.query(
    `insert into stay_poll_runs (provider) values ($1) returning id`,
    [platform]
  );
  const runId = runRows[0].id;
  const notes: string[] = [];

  for (let i = 0; i < due.length; i++) {
    const job = due[i];
    if (i > 0) await sleep(cfg.request_delay_ms);
    result.requests++;
    const out = await provider.fetchMonth(job.provider_ref, job.month);

    if (out.ok) {
      result.ok++;
      const unitIds: string[] = [];
      const dates: string[] = [];
      const statuses: string[] = [];
      const raws: string[] = [];
      // Mixed facilities (a few cabins among tent sites) only track their cabins.
      const allowed: string[] | null = job.unit_types?.length ? job.unit_types : null;
      const units = allowed ? out.data.units.filter((u) => u.type && allowed.includes(u.type)) : out.data.units;
      for (const u of units) {
        for (const d of u.days) {
          unitIds.push(u.unitId);
          dates.push(d.date);
          statuses.push(d.status);
          raws.push(d.raw);
        }
      }
      if (dates.length > 0) {
        // Data-modifying CTEs share one snapshot, so "changed" compares
        // against the values from before this upsert.
        const { rows } = await pool.query(
          `with incoming as (
             select * from unnest($2::text[], $3::date[], $4::text[], $5::text[]) as t(unit_id, date, status, raw_status)
           ),
           changed as (
             insert into stay_availability_changes (site_id, unit_id, date, old_status, new_status)
             select $1, i.unit_id, i.date, a.status, i.status
             from incoming i
             join stay_availability a on a.site_id = $1 and a.unit_id = i.unit_id and a.date = i.date
             where a.status <> i.status
             returning 1
           ),
           up as (
             insert into stay_availability (site_id, unit_id, date, status, raw_status, fetched_at)
             select $1, unit_id, date, status, raw_status, now() from incoming
             on conflict (site_id, unit_id, date) do update
               set status = excluded.status, raw_status = excluded.raw_status, fetched_at = excluded.fetched_at
             returning 1
           )
           select (select count(*) from changed)::int as changes`,
          [job.id, unitIds, dates, statuses, raws]
        );
        result.changes += rows[0].changes;
      }
      await pool.query(
        `insert into stay_fetch_state (site_id, month, fetched_at, last_http_status, error_count, next_attempt_at)
         values ($1, $2, now(), $3, 0, null)
         on conflict (site_id, month) do update
           set fetched_at = now(), last_http_status = $3, error_count = 0, next_attempt_at = null`,
        [job.id, job.month, out.httpStatus]
      );
      continue;
    }

    result.errors++;
    const errCount = Number(job.error_count) + 1;
    const backoffMin = Math.min(cfg.base_backoff_minutes * 2 ** (errCount - 1), cfg.max_backoff_hours * 60);
    await pool.query(
      `insert into stay_fetch_state (site_id, month, last_http_status, error_count, next_attempt_at)
       values ($1, $2, $3, $4, now() + make_interval(mins => $5::int))
       on conflict (site_id, month) do update
         set last_http_status = $3, error_count = $4, next_attempt_at = now() + make_interval(mins => $5::int)`,
      [job.id, job.month, out.httpStatus, errCount, Math.round(backoffMin)]
    );
    notes.push(`${job.id} ${job.month}: ${out.error}`);

    if (out.blocked) {
      // Provider is pushing back. Stop the batch and pause everything.
      result.blocked = true;
      await pool.query(
        `insert into stay_config (key, value, updated_at)
         values ($1, jsonb_build_object('until', now() + make_interval(mins => $2::int), 'reason', $3::text), now())
         on conflict (key) do update set value = excluded.value, updated_at = now()`,
        [`poll.${platform}.cooldown`, cfg.cooldown_minutes_on_block, out.error]
      );
      notes.push(`blocked: cooling down ${cfg.cooldown_minutes_on_block} min`);
      break;
    }
  }

  // Keep the snapshot table small: past nights aren't useful.
  await pool.query(`delete from stay_availability where date < current_date - 14`);

  result.elapsed_ms = Date.now() - started;
  await pool.query(
    `update stay_poll_runs set finished_at = now(), requests = $2, ok = $3, errors = $4, changes = $5, notes = $6
     where id = $1`,
    [runId, result.requests, result.ok, result.errors, result.changes, notes.join("\n") || null]
  );
  return result;
}
