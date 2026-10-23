"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { StaysResponse, StayWithAvailability, SiteSummary } from "@/lib/stays/types";
import { platformInfo, SEASON_LABELS, SEASON_CLOSED } from "@/lib/stays/platforms";
import {
  addDaysISO,
  describeRule,
  formatDay,
  formatMoment,
  nextReleaseEvent,
  releaseForNight,
  todayIn,
} from "@/lib/stays/release";
import {
  NIGHT_STYLE,
  STATE_NAMES,
  SUMMARY_LABEL_NO_RANGE,
  SUMMARY_ORDER,
  SUMMARY_STYLE,
  shortName,
} from "./display";

const LookoutMap = dynamic(() => import("./lookout-map").then((m) => m.LookoutMap), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-park-paper-3" />,
});

const NIGHT_OPTIONS = [1, 2, 3, 4, 5, 7, 10, 14];


function summaryLabel(s: SiteSummary, hasRange: boolean): string {
  return (!hasRange && SUMMARY_LABEL_NO_RANGE[s]) || SUMMARY_STYLE[s].label;
}

function timeAgo(iso: string | null): string {
  if (!iso) return "not yet";
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 2) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const h = Math.round(mins / 60);
  if (h < 48) return `${h} hr ago`;
  return `${Math.round(h / 24)} days ago`;
}

function Chip({ summary, hasRange }: { summary: SiteSummary; hasRange: boolean }) {
  const st = SUMMARY_STYLE[summary];
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-sm border border-park-rule bg-bone px-2.5 py-0.5 font-park-sans text-xs font-semibold text-park-ink-soft">
      <span className="h-2.5 w-2.5 rounded-full" style={{ background: st.color }} />
      {summaryLabel(summary, hasRange)}
    </span>
  );
}

/* ───────────────────────── detail panel ───────────────────────── */

function DetailPanel({
  site,
  range,
  onClose,
}: {
  site: StayWithAvailability;
  range: { start: string; end: string } | null;
  onClose: () => void;
}) {
  const platform = platformInfo(site.platform);
  const a = site.availability;
  const rule = site.release_rule;
  const next = nextReleaseEvent(rule);
  const firstUnreleased = a.nights.find((n) => n.status === "not_released")?.date;
  const rangeRelease = range
    ? releaseForNight(rule, firstUnreleased ?? range.start)
    : null;
  const rangeReleaseFuture = rangeRelease && (rangeRelease.at ? rangeRelease.at > new Date() : rangeRelease.date > todayIn(Intl.DateTimeFormat().resolvedOptions().timeZone));
  const seasonClosed = SEASON_CLOSED.has(site.season_status);

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <div className="flex items-start justify-between gap-3 border-b border-park-rule bg-park-paper-2 px-5 py-4">
        <div>
          <p className="font-park-sans text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-park-moss">
            {[site.managing_unit, STATE_NAMES[site.state] ?? site.state].filter(Boolean).join(" · ")}
          </p>
          <h3 className="mt-1 font-park-display text-2xl font-bold leading-tight text-park-ink">{site.name}</h3>
          {site.operator && <p className="font-park-sans text-sm text-park-ink-faint">{site.operator}</p>}
        </div>
        <button
          onClick={onClose}
          aria-label="Close details"
          className="rounded-sm px-2 py-1 font-park-sans text-lg leading-none text-park-ink-faint hover:bg-park-paper-3 hover:text-park-ink"
        >
          ✕
        </button>
      </div>

      <div className="space-y-5 px-5 py-5 font-park-sans text-sm text-park-ink">
        <div className="flex flex-wrap items-center gap-2">
          <Chip summary={a.summary} hasRange={!!range} />
          {site.season_status !== "open" && (
            <span
              className={`rounded-sm px-2.5 py-0.5 text-xs font-semibold ${
                seasonClosed ? "bg-rhyolite text-bone" : "border border-park-rule text-park-ink-soft"
              }`}
            >
              {SEASON_LABELS[site.season_status]}
            </span>
          )}
        </div>

        {site.rating != null && (
          <p className="text-park-ink-soft">
            <span className="font-bold text-park-ink">★ {site.rating.toFixed(1)}</span>
            {site.rating_count ? ` · ${site.rating_count} rating${site.rating_count === 1 ? "" : "s"}` : ""} on
            Recreation.gov
          </p>
        )}

        {/* Availability */}
        <section>
          <h4 className="mb-2 text-[0.7rem] font-bold uppercase tracking-[0.14em] text-park-ink-faint">Availability</h4>
          {!platform.pollable ? (
            <p className="text-park-ink-soft">{platform.whyNot}</p>
          ) : seasonClosed ? (
            <p className="text-park-ink-soft">
              Closed this season, so dates aren&apos;t being checked. {site.season_notes}
            </p>
          ) : range ? (
            <>
              <div className="flex flex-wrap gap-1.5">
                {a.nights.map((n) => (
                  <div
                    key={n.date}
                    title={`${formatDay(n.date, { weekday: true })}: ${NIGHT_STYLE[n.status].label}`}
                    className="flex w-[52px] flex-col items-center rounded-sm border border-park-rule bg-park-paper py-1"
                  >
                    <span className="text-[0.65rem] text-park-ink-faint">{formatDay(n.date, { weekday: true }).split(",")[0]}</span>
                    <span className="text-xs font-semibold">{formatDay(n.date).replace(/^\w+ /, "")}</span>
                    <span className="mt-1 h-2 w-8 rounded-full" style={{ background: NIGHT_STYLE[n.status].color }} />
                  </div>
                ))}
              </div>
              <p className="mt-2 text-xs text-park-ink-faint">
                {formatDay(range.start, { weekday: true })} to {formatDay(range.end, { weekday: true })} · checked{" "}
                {timeAgo(a.last_fetched)}
              </p>
            </>
          ) : a.next_open ? (
            <p>
              Next open night: <strong>{formatDay(a.next_open, { weekday: true, year: true })}</strong>.{" "}
              <span className="text-park-ink-soft">
                {a.open_nights} open night{a.open_nights === 1 ? "" : "s"} in the booking window. Checked{" "}
                {timeAgo(a.last_fetched)}.
              </span>
            </p>
          ) : (
            <p className="text-park-ink-soft">
              {a.last_fetched
                ? `Nothing open in the current booking window. Checked ${timeAgo(a.last_fetched)}.`
                : "Not checked yet. The first sweep is still working through the list."}
            </p>
          )}
        </section>

        {/* Release calendar */}
        <section>
          <h4 className="mb-2 text-[0.7rem] font-bold uppercase tracking-[0.14em] text-park-ink-faint">
            Release calendar
          </h4>
          <p>{describeRule(rule)}</p>
          {range && rangeRelease && rangeReleaseFuture && (
            <p className="mt-2 border-l-[3px] border-night-slab bg-blue-hour/8 px-3 py-2 text-ink">
              {rule.type === "annual_day"
                ? `The ${range.start.slice(0, 4)} season's ${rule.channel === "phone" ? "phone" : "release"} day is `
                : "Your dates open "}
              <strong className="text-ink">{formatMoment(rangeRelease, { year: true })}</strong>.
              {rule.type === "rolling_months" && " Set an alarm. Popular lookouts go in minutes."}
            </p>
          )}
          {next && !(range && rangeReleaseFuture) && (
            <p className="mt-2 text-park-ink-soft">
              Next release: {formatMoment(next, { year: rule.type === "annual_day" })}
              {rule.type !== "annual_day" && <> (opens nights through {formatDay(next.covers, { year: true })})</>}.
            </p>
          )}
          {rule.type === "annual_day" && rule.contact && (
            <p className="mt-1 text-park-ink-soft">Call {rule.contact}. No voicemail or email requests.</p>
          )}
        </section>

        {site.season_notes && !seasonClosed && (
          <section>
            <h4 className="mb-2 text-[0.7rem] font-bold uppercase tracking-[0.14em] text-park-ink-faint">Season notes</h4>
            <p className="text-park-ink-soft">{site.season_notes}</p>
          </section>
        )}

        {site.coords_approximate && (
          <p className="text-xs text-park-ink-faint">Map pin is approximate.</p>
        )}

        <div className="flex flex-wrap gap-2 pt-1">
          {site.booking_url && (
            <a
              href={site.booking_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-sm border-2 border-first-light bg-first-light px-4 py-2 text-sm font-bold uppercase tracking-[0.06em] text-blue-hour hover:bg-[#F6BC5F]"
            >
              {platform.bookLabel} ↗
            </a>
          )}
          {site.info_url && (
            <a
              href={site.info_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-sm border-2 border-park-ink/25 px-4 py-2 text-sm font-semibold text-park-ink-soft hover:border-park-forest hover:text-park-forest"
            >
              Park info ↗
            </a>
          )}
          <a
            href={`https://www.google.com/search?q=${encodeURIComponent(`${site.name} ${site.state} reviews`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center rounded-sm border-2 border-park-ink/25 px-4 py-2 text-sm font-semibold text-park-ink-soft hover:border-park-forest hover:text-park-forest"
          >
            More reviews ↗
          </a>
        </div>
        <p className="text-xs text-park-ink-faint">
          This site never books for you. You reserve on the operator&apos;s own site.
        </p>
      </div>
    </div>
  );
}

/* ───────────────────────── finder ───────────────────────── */

export function LookoutFinder({
  initial,
  initialStart,
  initialNights,
  today,
}: {
  initial: StaysResponse;
  initialStart: string;
  initialNights: number;
  today: string;
}) {
  const [data, setData] = useState<StaysResponse>(initial);
  const [start, setStart] = useState<string>(initialStart);
  const [nights, setNights] = useState<number>(NIGHT_OPTIONS.includes(initialNights) ? initialNights : 2);
  const [stateFilter, setStateFilter] = useState<string>("");
  const [onlyOpen, setOnlyOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const range = useMemo(() => (start ? { start, end: addDaysISO(start, nights) } : null), [start, nights]);
  const rangeKey = range ? `${range.start}/${range.end}` : "";
  // The server already rendered data for the initial range.
  const loadedKey = useRef(initial.range ? `${initial.range.start}/${initial.range.end}` : "");

  // Fetch whenever the range changes; keep the URL shareable.
  useEffect(() => {
    if (rangeKey === loadedKey.current) return;
    loadedKey.current = rangeKey;
    const url = new URL(window.location.href);
    if (range) {
      url.searchParams.set("start", range.start);
      url.searchParams.set("nights", String(nights));
    } else {
      url.searchParams.delete("start");
      url.searchParams.delete("nights");
    }
    window.history.replaceState(null, "", url.toString());

    const ctrl = new AbortController();
    const qs = range ? `?start=${range.start}&end=${range.end}` : "";
    Promise.resolve().then(() => {
      setLoading(true);
      setError(null);
    });
    fetch(`/api/lookouts${qs}`, { signal: ctrl.signal })
      .then(async (r) => {
        const body = await r.json();
        if (!r.ok) throw new Error(body.error || `HTTP ${r.status}`);
        setData(body as StaysResponse);
      })
      .catch((e) => {
        if ((e as Error).name !== "AbortError") setError((e as Error).message);
      })
      .finally(() => setLoading(false));
    return () => {
      ctrl.abort();
      loadedKey.current = "";
    };
  }, [rangeKey, range, nights]);

  const hasRange = !!data.range;
  const states = useMemo(
    () => [...new Set(data.sites.map((s) => s.state))].sort(),
    [data.sites]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.sites.filter((s) => {
      if (stateFilter && s.state !== stateFilter) return false;
      if (onlyOpen && !["available", "partial"].includes(s.availability.summary)) return false;
      if (q && !`${s.name} ${s.managing_unit ?? ""}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [data.sites, stateFilter, onlyOpen, query]);

  const counts = useMemo(() => {
    const c: Partial<Record<SiteSummary, number>> = {};
    for (const s of filtered) c[s.availability.summary] = (c[s.availability.summary] ?? 0) + 1;
    return c;
  }, [filtered]);

  const sorted = useMemo(
    () =>
      [...filtered].sort(
        (a, b) =>
          SUMMARY_ORDER.indexOf(a.availability.summary) - SUMMARY_ORDER.indexOf(b.availability.summary) ||
          a.state.localeCompare(b.state) ||
          a.name.localeCompare(b.name)
      ),
    [filtered]
  );

  const selected = data.sites.find((s) => s.id === selectedId) ?? null;

  const select = (id: string | null) => {
    setSelectedId(id);
    if (id && window.innerWidth < 1024) {
      requestAnimationFrame(() => panelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    }
  };

  const inputCls =
    "rounded-sm border-2 border-park-ink/20 bg-park-paper px-3 py-2 font-park-sans text-sm text-park-ink focus:border-park-forest focus:outline-none";

  return (
    <div>
      {/* Controls */}
      <div className="flex flex-wrap items-end gap-3 rounded-sm border border-park-rule bg-park-paper-2 p-4">
        <label className="flex flex-col gap-1">
          <span className="font-park-sans text-xs font-semibold text-park-ink-soft">Check in</span>
          <input
            type="date"
            value={start}
            min={today}
            onChange={(e) => setStart(e.target.value)}
            className={inputCls}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="font-park-sans text-xs font-semibold text-park-ink-soft">Nights</span>
          <select value={nights} onChange={(e) => setNights(Number(e.target.value))} className={inputCls}>
            {NIGHT_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n} night{n === 1 ? "" : "s"}
              </option>
            ))}
          </select>
        </label>
        {start && (
          <button
            onClick={() => setStart("")}
            className="mb-0.5 rounded-sm px-3 py-2 font-park-sans text-sm font-semibold text-park-ink-soft hover:text-park-forest"
          >
            Clear dates
          </button>
        )}
        <div className="mx-1 hidden h-10 w-px bg-park-rule md:block" />
        <label className="flex flex-col gap-1">
          <span className="font-park-sans text-xs font-semibold text-park-ink-soft">State</span>
          <select value={stateFilter} onChange={(e) => setStateFilter(e.target.value)} className={inputCls}>
            <option value="">All states</option>
            {states.map((s) => (
              <option key={s} value={s}>
                {STATE_NAMES[s] ?? s}
              </option>
            ))}
          </select>
        </label>
        <label className="flex min-w-[160px] flex-1 flex-col gap-1">
          <span className="font-park-sans text-xs font-semibold text-park-ink-soft">Search</span>
          <input
            type="search"
            value={query}
            placeholder="Lookout or forest"
            onChange={(e) => setQuery(e.target.value)}
            className={inputCls}
          />
        </label>
        <label className="mb-2 flex items-center gap-2 font-park-sans text-sm font-semibold text-park-ink-soft">
          <input
            type="checkbox"
            checked={onlyOpen}
            onChange={(e) => setOnlyOpen(e.target.checked)}
            className="h-4 w-4 accent-[#2E7D4F]"
          />
          Only open
        </label>
      </div>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 font-park-sans text-xs text-park-ink-soft">
        {SUMMARY_ORDER.filter((s) => counts[s]).map((s) => (
          <span key={s} className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: SUMMARY_STYLE[s].color }} />
            {summaryLabel(s, hasRange)} <span className="text-park-ink-faint">{counts[s]}</span>
          </span>
        ))}
        <span className="ml-auto text-park-ink-faint">
          {loading ? "Updating…" : error ? `Couldn't update: ${error}` : `${filtered.length} lookouts`}
        </span>
      </div>

      {/* Map + panel */}
      <div className="mt-3 grid gap-0 overflow-hidden rounded-sm border-2 border-park-ink/80 lg:grid-cols-[1fr_380px]">
        <div className="relative h-[58vh] min-h-[420px] lg:h-[640px]">
          <LookoutMap sites={filtered} selectedId={selectedId} onSelect={select} />
        </div>
        <div ref={panelRef} className="scroll-mt-20 border-t-2 border-park-ink/80 bg-park-paper lg:h-[640px] lg:border-l-2 lg:border-t-0">
          {selected ? (
            <DetailPanel site={selected} range={data.range} onClose={() => setSelectedId(null)} />
          ) : (
            <div className="flex h-full flex-col justify-center gap-3 px-6 py-8 font-park-sans text-sm text-park-ink-soft">
              <p className="font-park-display text-xl font-bold text-park-ink">Pick a lookout</p>
              <p>
                Tap a pin for details, ratings, season status, and when its dates open. Choose check-in dates to
                color every pin by availability for those nights.
              </p>
              <p className="text-park-ink-faint">
                Availability is refreshed on a schedule from Recreation.gov. It can lag a cancellation by a few hours,
                so confirm on the booking site.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* List */}
      <div className="mt-8">
        <h3 className="mb-3 font-park-display text-2xl font-bold text-park-ink">
          {hasRange ? `For ${formatDay(data.range!.start)} to ${formatDay(data.range!.end, { year: true })}` : "Every lookout"}
        </h3>
        <ul className="grid grid-cols-1 gap-x-6 sm:grid-cols-2">
          {sorted.map((s) => {
            const p = platformInfo(s.platform);
            const sub = !p.pollable
              ? describeRule(s.release_rule)
              : SEASON_CLOSED.has(s.season_status)
                ? SEASON_LABELS[s.season_status]
                : s.availability.next_open && !hasRange
                  ? `Next open ${formatDay(s.availability.next_open, { year: true })}`
                  : summaryLabel(s.availability.summary, hasRange);
            return (
              <li key={s.id}>
                <button
                  onClick={() => {
                    select(s.id);
                    if (window.innerWidth >= 1024) window.scrollTo({ top: (panelRef.current?.getBoundingClientRect().top ?? 0) + window.scrollY - 160, behavior: "smooth" });
                  }}
                  className={`flex w-full items-center gap-3 border-b border-park-rule py-2.5 text-left transition-colors hover:bg-park-paper-2 ${
                    selectedId === s.id ? "bg-park-paper-2" : ""
                  }`}
                >
                  <span
                    className="h-3 w-3 shrink-0 rounded-full"
                    style={{ background: SUMMARY_STYLE[s.availability.summary].color }}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-park-display font-semibold text-park-ink">
                      {shortName(s.name)}
                    </span>
                    <span className="block truncate font-park-sans text-xs text-park-ink-faint">
                      {s.state} · {sub}
                    </span>
                  </span>
                  {s.rating != null && (
                    <span className="shrink-0 font-park-sans text-xs font-semibold text-park-ink-soft">
                      ★ {s.rating.toFixed(1)}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
        {sorted.length === 0 && (
          <p className="py-6 font-park-sans text-park-ink-soft">No lookouts match those filters.</p>
        )}
      </div>
    </div>
  );
}
