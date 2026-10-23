import "server-only";
import pool from "@/lib/db";
import { platformInfo, SEASON_CLOSED } from "./platforms";
import { firstOfMonthISO, latestReleasedNight, nightsBetween, addMonthsISO } from "./release";
import type {
  NightStatus,
  SiteAvailability,
  SiteSummary,
  StaySite,
  StayKind,
  StayWithAvailability,
} from "./types";

/** Longest range the map will evaluate, in nights. */
export const MAX_RANGE_NIGHTS = 14;

const SITE_COLUMNS = `id, kind, name, state, operator, managing_unit, lat, lng,
  coords_approximate, platform, provider_ref, booking_url, info_url,
  season_status, season_notes, provider_reservable, release_rule,
  rating::float8 as rating, rating_count, rating_source`;

export async function getActiveSites(kind: StayKind): Promise<StaySite[]> {
  const { rows } = await pool.query(
    `select ${SITE_COLUMNS} from stay_sites
     where kind = $1 and active and lat is not null and lng is not null
     order by state, name`,
    [kind]
  );
  return rows;
}

/** Best status across a facility's units for one night (any open unit wins). */
const BEST_STATUS_SQL = `case
  when bool_or(status = 'available') then 'available'
  when bool_or(status = 'walk_up') then 'walk_up'
  when bool_or(status = 'lottery') then 'lottery'
  when bool_or(status = 'not_released') then 'not_released'
  when bool_or(status = 'reserved') then 'reserved'
  else 'closed' end`;

function summarizeRange(nights: { status: NightStatus }[]): SiteSummary {
  if (nights.length === 0) return "unknown";
  const open = nights.filter((n) => n.status === "available").length;
  if (open === nights.length) return "available";
  if (open > 0) return "partial";
  if (nights.some((n) => n.status === "not_released")) return "not_released";
  if (nights.some((n) => n.status === "unknown")) return "unknown";
  if (nights.some((n) => ["reserved", "walk_up", "lottery"].includes(n.status))) return "booked";
  return "closed";
}

/**
 * Sites with availability summaries. With a range, each pin reflects those
 * nights; without one, it reflects "anything open in the release window".
 */
export async function getStaysWithAvailability(
  kind: StayKind,
  range: { start: string; end: string } | null,
  now: Date = new Date()
): Promise<StayWithAvailability[]> {
  const sites = await getActiveSites(kind);
  if (sites.length === 0) return [];
  const ids = sites.map((s) => s.id);

  const windowQ = pool.query(
    `select site_id,
            min(date) filter (where status = 'available')::text as next_open,
            count(distinct date) filter (where status = 'available')::int as open_nights,
            count(distinct date) filter (where status = 'reserved')::int as reserved_nights
     from stay_availability
     where site_id = any($1) and date >= current_date
     group by site_id`,
    [ids]
  );
  const fetchedQ = pool.query(
    `select site_id, max(fetched_at) as last_fetched, array_agg(month::text) filter (where fetched_at is not null) as months
     from stay_fetch_state where site_id = any($1) group by site_id`,
    [ids]
  );
  const nightsQ = range
    ? pool.query(
        `select site_id, date::text as date, ${BEST_STATUS_SQL} as status
         from stay_availability
         where site_id = any($1) and date >= $2::date and date < $3::date
         group by site_id, date`,
        [ids, range.start, range.end]
      )
    : Promise.resolve({ rows: [] as { site_id: string; date: string; status: NightStatus }[] });

  const [win, fetched, nightRows] = await Promise.all([windowQ, fetchedQ, nightsQ]);

  const winBy = new Map(win.rows.map((r) => [r.site_id as string, r]));
  const fetchedBy = new Map(
    fetched.rows.map((r) => [
      r.site_id as string,
      {
        last: r.last_fetched ? new Date(r.last_fetched).toISOString() : null,
        months: new Set<string>(r.months ?? []),
      },
    ])
  );
  const nightBy = new Map<string, Map<string, NightStatus>>();
  for (const r of nightRows.rows) {
    if (!nightBy.has(r.site_id)) nightBy.set(r.site_id, new Map());
    nightBy.get(r.site_id)!.set(r.date, r.status);
  }
  const requested = range ? nightsBetween(range.start, range.end) : [];

  return sites.map((site) => {
    const pollable = platformInfo(site.platform).pollable;
    const seasonClosed = SEASON_CLOSED.has(site.season_status);
    const w = winBy.get(site.id);
    const f = fetchedBy.get(site.id);
    const latest = latestReleasedNight(site.release_rule, now);

    const nights = requested.map((date) => {
      const known = nightBy.get(site.id)?.get(date);
      let status: NightStatus;
      if (known) status = known;
      else if (latest && date > latest) status = "not_released";
      else if (f?.months.has(firstOfMonthISO(date))) status = "closed"; // month fetched, night not offered
      else status = "unknown";
      return { date, status };
    });

    let summary: SiteSummary;
    if (!pollable) summary = "not_pollable";
    else if (seasonClosed) summary = "season_closed";
    else if (range) summary = summarizeRange(nights);
    else if (!f?.last) summary = "unknown";
    else if ((w?.open_nights ?? 0) > 0) summary = "available";
    else if ((w?.reserved_nights ?? 0) > 0) summary = "booked";
    else summary = "closed";

    const availability: SiteAvailability = {
      summary,
      nights: pollable ? nights : [],
      next_open: w?.next_open ?? null,
      open_nights: w?.open_nights ?? 0,
      last_fetched: f?.last ?? null,
    };
    return {
      ...site,
      lat: Number(site.lat),
      lng: Number(site.lng),
      rating: site.rating != null ? Number(site.rating) : null,
      availability,
    };
  });
}

/** Validate a ?start=&end= pair. Returns null when absent, throws on bad input. */
export function parseRange(start: string | null, end: string | null): { start: string; end: string } | null {
  if (!start && !end) return null;
  const re = /^\d{4}-\d{2}-\d{2}$/;
  if (!start || !end || !re.test(start) || !re.test(end)) throw new Error("start and end must be YYYY-MM-DD");
  if (end <= start) throw new Error("end must be after start");
  const n = nightsBetween(start, end).length;
  if (n > MAX_RANGE_NIGHTS) throw new Error(`range is limited to ${MAX_RANGE_NIGHTS} nights`);
  const horizon = addMonthsISO(new Date().toISOString().slice(0, 10), 13);
  if (start > horizon) throw new Error("start is too far out");
  return { start, end };
}
