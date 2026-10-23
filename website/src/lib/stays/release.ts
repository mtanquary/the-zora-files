/**
 * Release-calendar math for bookable stays. Pure functions, safe in the
 * browser and on the server. Dates are calendar strings ("YYYY-MM-DD") so a
 * night never shifts across time zones; release moments are real instants.
 */

export type ReleaseRule =
  /** Each night opens N months ahead, e.g. Recreation.gov: 6 months at 07:00 PT. */
  | { type: "rolling_months"; months: number; time?: string; tz?: string; note?: string }
  /** A whole month opens at once, N months ahead, on the 1st (Thorny Mountain). */
  | { type: "monthly_block"; months_ahead: number; time: string; tz: string; note?: string }
  /** One release day a year, e.g. the first Tuesday of February by phone (Werner Peak). */
  | {
      type: "annual_day";
      month: number; // 1-12
      weekday: number; // 0=Sun … 6=Sat
      nth: number; // 1 = first
      time: string;
      tz: string;
      channel?: "phone" | "online";
      contact?: string;
      estimated?: boolean;
      note?: string;
    }
  /** Owner-managed calendar (Airbnb). No predictable release. */
  | { type: "host_managed"; note?: string };

/* ───────────── calendar-date helpers ───────────── */

export function isoDate(y: number, m: number, d: number): string {
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function parts(iso: string): [number, number, number] {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return [y, m, d];
}

function daysInMonth(y: number, m: number): number {
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

export function addDaysISO(iso: string, n: number): string {
  const [y, m, d] = parts(iso);
  const t = new Date(Date.UTC(y, m - 1, d + n));
  return isoDate(t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate());
}

/** Add calendar months, clamping the day (Aug 31 - 6 months = Feb 28/29). */
export function addMonthsISO(iso: string, n: number): string {
  const [y, m, d] = parts(iso);
  const total = y * 12 + (m - 1) + n;
  const ny = Math.floor(total / 12);
  const nm = (total % 12) + 1;
  return isoDate(ny, nm, Math.min(d, daysInMonth(ny, nm)));
}

export function firstOfMonthISO(iso: string): string {
  const [y, m] = parts(iso);
  return isoDate(y, m, 1);
}

export function lastOfMonthISO(iso: string): string {
  const [y, m] = parts(iso);
  return isoDate(y, m, daysInMonth(y, m));
}

/** Nights in [start, end): the check-out day is not a night. */
export function nightsBetween(start: string, end: string): string[] {
  const out: string[] = [];
  for (let d = start; d < end && out.length < 400; d = addDaysISO(d, 1)) out.push(d);
  return out;
}

/* ───────────── time-zone helpers ───────────── */

function tzOffsetMs(at: Date, tz: string): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const p: Record<string, number> = {};
  for (const x of dtf.formatToParts(at)) if (x.type !== "literal") p[x.type] = Number(x.value);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return asUtc - Math.floor(at.getTime() / 1000) * 1000;
}

/** The instant when the wall clock in `tz` reads `date` at `time` ("HH:MM"). */
export function zonedTimeToUtc(date: string, time: string, tz: string): Date {
  const [y, m, d] = parts(date);
  const [hh, mm] = time.split(":").map(Number);
  const guess = Date.UTC(y, m - 1, d, hh, mm);
  const off1 = tzOffsetMs(new Date(guess), tz);
  let t = guess - off1;
  const off2 = tzOffsetMs(new Date(t), tz);
  if (off2 !== off1) t = guess - off2;
  return new Date(t);
}

/** Today's calendar date as seen in `tz`. */
export function todayIn(tz: string, now: Date = new Date()): string {
  const dtf = new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" });
  return dtf.format(now);
}

/* ───────────── rule evaluation ───────────── */

function nthWeekday(year: number, month: number, weekday: number, nth: number): string {
  const first = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  const day = 1 + ((weekday - first + 7) % 7) + (nth - 1) * 7;
  return isoDate(year, month, day);
}

export interface ReleaseMoment {
  /** Calendar date the release happens (in the rule's zone). */
  date: string;
  /** Exact instant when a time + zone are known. */
  at: Date | null;
  tz: string | null;
  estimated: boolean;
}

/** When does this specific night become bookable? null when unpredictable. */
export function releaseForNight(rule: ReleaseRule, night: string): ReleaseMoment | null {
  switch (rule.type) {
    case "rolling_months": {
      const date = addMonthsISO(night, -rule.months);
      const at = rule.time && rule.tz ? zonedTimeToUtc(date, rule.time, rule.tz) : null;
      return { date, at, tz: rule.tz ?? null, estimated: false };
    }
    case "monthly_block": {
      const date = addMonthsISO(firstOfMonthISO(night), -rule.months_ahead);
      return { date, at: zonedTimeToUtc(date, rule.time, rule.tz), tz: rule.tz, estimated: false };
    }
    case "annual_day": {
      const [y] = parts(night);
      const date = nthWeekday(y, rule.month, rule.weekday, rule.nth);
      return { date, at: zonedTimeToUtc(date, rule.time, rule.tz), tz: rule.tz, estimated: !!rule.estimated };
    }
    default:
      return null;
  }
}

/**
 * The furthest-out night that has already been released, or null when the
 * rule can't say (host-managed, annual phone days).
 */
export function latestReleasedNight(rule: ReleaseRule, now: Date = new Date()): string | null {
  switch (rule.type) {
    case "rolling_months": {
      const tz = rule.tz ?? "America/Los_Angeles";
      let today = todayIn(tz, now);
      if (rule.time && now < zonedTimeToUtc(today, rule.time, tz)) today = addDaysISO(today, -1);
      return addMonthsISO(today, rule.months);
    }
    case "monthly_block": {
      const today = todayIn(rule.tz, now);
      return lastOfMonthISO(addMonthsISO(firstOfMonthISO(today), rule.months_ahead));
    }
    default:
      return null;
  }
}

/** The next upcoming release event for a site, regardless of dates. */
export function nextReleaseEvent(
  rule: ReleaseRule,
  now: Date = new Date()
): (ReleaseMoment & { covers: string }) | null {
  switch (rule.type) {
    case "rolling_months": {
      const tz = rule.tz ?? "America/Los_Angeles";
      let date = todayIn(tz, now);
      if (rule.time && now >= zonedTimeToUtc(date, rule.time, tz)) date = addDaysISO(date, 1);
      else if (!rule.time) date = addDaysISO(date, 1);
      return {
        date,
        at: rule.time ? zonedTimeToUtc(date, rule.time, tz) : null,
        tz,
        estimated: false,
        covers: addMonthsISO(date, rule.months),
      };
    }
    case "monthly_block": {
      const today = todayIn(rule.tz, now);
      const date = addMonthsISO(firstOfMonthISO(today), 1);
      return {
        date,
        at: zonedTimeToUtc(date, rule.time, rule.tz),
        tz: rule.tz,
        estimated: false,
        covers: addMonthsISO(date, rule.months_ahead),
      };
    }
    case "annual_day": {
      const today = todayIn(rule.tz, now);
      const [y] = parts(today);
      let date = nthWeekday(y, rule.month, rule.weekday, rule.nth);
      if (date < today) date = nthWeekday(y + 1, rule.month, rule.weekday, rule.nth);
      return {
        date,
        at: zonedTimeToUtc(date, rule.time, rule.tz),
        tz: rule.tz,
        estimated: !!rule.estimated,
        covers: `${parts(date)[0]} season`,
      };
    }
    default:
      return null;
  }
}

/* ───────────── formatting ───────────── */

export function formatDay(iso: string, opts: { year?: boolean; weekday?: boolean } = {}): string {
  const [y, m, d] = parts(iso);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
    timeZone: "UTC",
    month: "short",
    day: "numeric",
    ...(opts.year ? { year: "numeric" } : {}),
    ...(opts.weekday ? { weekday: "short" } : {}),
  });
}

/** "7:00 a.m. PDT" in the rule's own zone. */
export function formatReleaseTime(at: Date, tz: string): string {
  const s = at.toLocaleTimeString("en-US", {
    timeZone: tz,
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
  return s.replace(" AM", " a.m.").replace(" PM", " p.m.");
}

export function formatMoment(m: ReleaseMoment, opts: { year?: boolean } = {}): string {
  const day = formatDay(m.date, { weekday: true, year: opts.year });
  const time = m.at && m.tz ? ` at ${formatReleaseTime(m.at, m.tz)}` : "";
  return `${m.estimated ? "about " : ""}${day}${time}`;
}

const ZONE_NAMES: Record<string, string> = {
  "America/Los_Angeles": "Pacific",
  "America/Denver": "Mountain",
  "America/Chicago": "Central",
  "America/New_York": "Eastern",
};

/** "07:00" + zone -> "7:00 a.m. Pacific"; "00:00" -> "midnight Eastern". */
export function formatClock(time: string, tz?: string): string {
  const [h, m] = time.split(":").map(Number);
  const zone = tz ? ` ${ZONE_NAMES[tz] ?? tz}` : "";
  if (h === 0 && m === 0) return `midnight${zone}`;
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${h < 12 ? "a.m." : "p.m."}${zone}`;
}

/** One-line plain-English summary of how a site releases dates. */
export function describeRule(rule: ReleaseRule): string {
  switch (rule.type) {
    case "rolling_months":
      return rule.time
        ? `Nights open ${rule.months} months ahead, daily at ${formatClock(rule.time, rule.tz)}.`
        : `Bookable up to ${rule.months} months ahead.`;
    case "monthly_block":
      return `Each month opens on the 1st at ${formatClock(rule.time, rule.tz)}, ${rule.months_ahead} months ahead.`;
    case "annual_day":
      return rule.note ?? "One release day a year.";
    case "host_managed":
      return rule.note ?? "Host-managed calendar.";
  }
}
