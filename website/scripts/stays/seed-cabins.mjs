/**
 * Build the cabin + guard station seed: data/stays/cabins.v1.json
 *
 *   node scripts/stays/seed-cabins.mjs              # fetch everything, then build
 *   node scripts/stays/seed-cabins.mjs --from-raw   # rebuild from the last fetch
 *
 * Scope: federal standalone rentals on Recreation.gov (USFS, BLM, NPS, Corps,
 * FWS): cabins, guard stations, ranger stations, bunkhouses, historic houses.
 * Lookouts live in lookouts.v1.json and are skipped here. Cabins that are a
 * few units inside a big campground, and yurts, are listed under
 * `candidates` for a later layer, not added.
 *
 * Fetching is in ./cabins-collect.mjs (about 100 requests, 2.5 s apart,
 * roughly five minutes). The raw responses are cached in
 * data/stays/raw/cabins-raw.json (git-ignored) so the build step can be
 * re-run and tuned without touching the network.
 *
 * Run it each winter alongside seed-lookouts.mjs.
 */
import fs from "fs";
import path from "path";
import { loadEnv, DATA_DIR, politeFetch, USER_AGENT } from "./_shared.mjs";
import { collectEdw, collectRecgov, CABIN_UNIT_TYPES, NOT_A_CABIN } from "./cabins-collect.mjs";

loadEnv();

const RAW_DIR = path.join(DATA_DIR, "raw");
const RAW_PATH = path.join(RAW_DIR, "cabins-raw.json");
const OUT_PATH = path.join(DATA_DIR, "cabins.v1.json");
const SUPPLEMENT_PATH = path.join(DATA_DIR, "cabins-supplement.json");

/** Facilities with more units than this are campgrounds, not cabin rentals. */
const MAX_UNITS = 30;

const STATE_CODES = {
  Alabama: "AL", Alaska: "AK", Arizona: "AZ", Arkansas: "AR", California: "CA",
  Colorado: "CO", Connecticut: "CT", Delaware: "DE", Florida: "FL", Georgia: "GA",
  Hawaii: "HI", Idaho: "ID", Illinois: "IL", Indiana: "IN", Iowa: "IA", Kansas: "KS",
  Kentucky: "KY", Louisiana: "LA", Maine: "ME", Maryland: "MD", Massachusetts: "MA",
  Michigan: "MI", Minnesota: "MN", Mississippi: "MS", Missouri: "MO", Montana: "MT",
  Nebraska: "NE", Nevada: "NV", "New Hampshire": "NH", "New Jersey": "NJ",
  "New Mexico": "NM", "New York": "NY", "North Carolina": "NC", "North Dakota": "ND",
  Ohio: "OH", Oklahoma: "OK", Oregon: "OR", Pennsylvania: "PA", "Rhode Island": "RI",
  "South Carolina": "SC", "South Dakota": "SD", Tennessee: "TN", Texas: "TX", Utah: "UT",
  Vermont: "VT", Virginia: "VA", Washington: "WA", "West Virginia": "WV",
  Wisconsin: "WI", Wyoming: "WY", "District of Columbia": "DC", "Puerto Rico": "PR",
  "Virgin Islands": "VI", Guam: "GU",
};

const RECGOV_RELEASE = {
  type: "rolling_months",
  months: 6,
  time: "07:00",
  tz: "America/Los_Angeles",
  note: "Recreation.gov opens each night six months ahead at 7:00 a.m. Pacific.",
};

/** Old administrative sites: guard stations, ranger stations and residences, "X Station". */
const GUARD_STATION =
  /\b(guard (station|sta\.?|cabin)|ranger'?s? (station|cabin|residence|house|office|rental)|\w+ station|remount depot|work center|crew quarters|admin(istrative)? site|patrol cabin)\b/i;
const LOOKOUT = /\blookout\b|fire tower|\bL\.?O\.?$/i;
const YURT = /\byurts?\b/i;
const CAMPGROUND = /\b(campground|camp ground|rv park|resort|tent village)\b/i;
/** USFS "Cabin Rentals" records that aren't cabin rentals we track. */
const NOT_TRACKED = /\b(shelters?|shelter site|resort|lodge|inn|koa|campground|buoy|chalet|rec res)\b/i;
/** Keyword-only hits must end like a building, or have a cabin-typed unit. */
const BUILDING_END =
  /\b(cabins?|guard station|ranger station|guard cabin|ranger cabin|bunkhouse|cottage|hut|house|farmhouse|lodge|quarters|homestead)\b(\s*\([^)]*\))?\s*$/i;

/* ───────────── name cleanup ───────────── */

const KEEP_UPPER = new Set(["CCC", "USFS", "BLM", "NPS", "NF", "NWR", "NRA", "II", "III", "IV", "USA", "RV", "WWII", "KOA", "ATV", "OHV"]);
const SMALL = new Set(["of", "the", "and", "at", "on", "in", "by", "to", "a", "an", "for"]);
const STATE_SUFFIX = new RegExp(`\\s*\\((${Object.values(STATE_CODES).join("|")})\\)\\s*$`);

/** Trailing "(Chugach National Forest, AK)" or " - Ochoco NF": the map already shows the forest. */
const UNIT_SUFFIX = /\s*(\((?=[^)]*\b(national|forest|nf|park|grassland)\b)[^)]*\)|\s-\s[^-]*\b(NF|National Forest)\s*)$/i;

export function cleanName(raw) {
  let s = raw.replace(/\s+/g, " ").trim().replace(STATE_SUFFIX, "").replace(UNIT_SUFFIX, "").replace(STATE_SUFFIX, "");
  if (/[a-z]/.test(s)) return s; // already mixed case: trust it
  let first = true;
  s = s.replace(/[A-Z0-9'’.&-]+/g, (w) => {
    const bare = w.replace(/[.'’]/g, "");
    let out;
    if (KEEP_UPPER.has(bare)) out = w;
    else if (!first && SMALL.has(w.toLowerCase())) out = w.toLowerCase();
    else if (/^(MT|ST|FT)\.?$/.test(w)) out = w[0] + w.slice(1).toLowerCase();
    else if (/^MC[A-Z]{2,}/.test(w)) out = "Mc" + w[2] + w.slice(3).toLowerCase();
    else out = w.split("-").map((p) => (p ? p[0] + p.slice(1).toLowerCase() : p)).join("-");
    first = false;
    return out;
  });
  return s.replace(/\(([a-z])/g, (_, c) => `(${c.toUpperCase()}`);
}

/* ───────────── matching helpers ───────────── */

function km(a, b) {
  if (a.lat == null || b.lat == null) return Infinity;
  const r = Math.PI / 180;
  const dLat = (b.lat - a.lat) * r;
  const dLng = (b.lng - a.lng) * r;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLng / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(h));
}

const STOP = new Set(["cabin", "cabins", "guard", "station", "rental", "recreation", "recreational", "the", "ranger", "lookout", "house", "and", "of", "mountain", "mtn", "creek", "lake"]);
function tokens(name) {
  return new Set(
    name
      .toLowerCase()
      .replace(/[’']/g, "")
      .replace(/[^a-z0-9 ]/g, " ")
      .split(/\s+/)
      .map((t) => (t === "mt" ? "mount" : t))
      .filter((t) => t.length > 1 && !STOP.has(t))
  );
}
function nameOverlap(a, b) {
  const A = tokens(a);
  const B = tokens(b);
  if ([...A].join("") === [...B].join("") && A.size) return 1; // "La Barge" vs "LaBarge"
  if (!A.size || !B.size) return 0;
  let n = 0;
  for (const t of A) if (B.has(t)) n++;
  return n / Math.min(A.size, B.size);
}

const YEAR_ROUND = /year[- ]?(a)?round|all year/i;

/** Forest Service season fields are free text ("06/15", "End of May", "Year Around"). */
function seasonInfo(e) {
  const [a, b] = e.season.map((x) => (x ? String(x).trim().replace(/\.$/, "") : null));
  if (!a && !b) return null;
  if (YEAR_ROUND.test(`${a} ${b}`)) return { yearRound: true, text: "Open year-round, per the Forest Service." };
  if (a && b) return { yearRound: false, text: `Forest Service season: ${a} to ${b}.` };
  if (a && /^(0?1\/0?1|jan(uary)?( 1)?)$/i.test(a)) return null; // "starts January 1" says nothing
  return { yearRound: false, text: a ? `Forest Service season starts ${a}.` : `Forest Service season ends ${b}.` };
}

/* ───────────── build ───────────── */

export function build(raw, { lookoutIds, lookoutSites = [], supplement }) {
  const today = new Date().toISOString().slice(0, 10);
  const edwById = new Map();
  for (const e of raw.edw) if (e.recgov_id && !edwById.has(e.recgov_id)) edwById.set(e.recgov_id, e);
  const edwUsed = new Set();
  const byRecgovId = new Set(raw.recgov.map((r) => r.id));

  /** USFS record for a Recreation.gov facility: by id, then by name + distance. */
  function edwFor(r, name) {
    const direct = edwById.get(r.id);
    if (direct) return direct;
    if (r.org !== "USDA Forest Service") return null;
    let best = null;
    for (const e of raw.edw) {
      if (e.recgov_id && byRecgovId.has(e.recgov_id) && e.recgov_id !== r.id) continue; // belongs to another facility
      const d = km(r, e);
      const o = nameOverlap(name, e.name);
      const sameForest = r.parent && e.forest && r.parent === e.forest;
      if (!(d <= 5 && o >= 0.5) && !(d <= 15 && o >= 0.8) && !(sameForest && o >= 0.99)) continue;
      if (!best || o > best.o || (o === best.o && d < best.d)) best = { e, o, d };
    }
    return best?.e ?? null;
  }

  const sites = [];
  const candidates = { lookouts: [], yurts: [], campground_cabins: [], unclear: [], usfs_not_on_recgov: [] };
  const overrides = supplement.overrides ?? {};
  const exclude = new Set(Object.keys(supplement.exclude ?? {}));

  for (const r of raw.recgov) {
    const ov = overrides[r.id] ?? {};
    const name = ov.name ?? cleanName(r.name);
    const state = STATE_CODES[r.state] ?? (r.state && r.state.length === 2 ? r.state : null);
    const ref = { facility_id: r.id, name, state, url: `https://www.recreation.gov/camping/campgrounds/${r.id}` };
    if (lookoutIds.has(r.id)) continue;
    if (exclude.has(r.id)) continue;
    if (!ov.force) {
      if (LOOKOUT.test(name)) { candidates.lookouts.push(ref); continue; }
      if (YURT.test(name)) { candidates.yurts.push(ref); continue; }
      if (NOT_A_CABIN.test(name)) { candidates.unclear.push({ ...ref, why: "name reads like a campground or day-use site" }); continue; }
    }

    // Units: which ones are cabins?
    const typedCabin = r.via.some((v) => v.startsWith("type:"));
    let total = r.count ?? r.units?.length ?? null;
    let cabinUnits;
    let unitTypes = null;
    if (r.units?.length) {
      total = r.units.length;
      const cab = r.units.filter((u) => CABIN_UNIT_TYPES.includes(u[1]));
      cabinUnits = cab.length;
      if (cabinUnits > 0 && cabinUnits < total) unitTypes = [...new Set(cab.map((u) => u[1]))].sort();
    } else {
      cabinUnits = typedCabin ? total ?? 1 : 0;
    }

    if (!ov.force) {
      if ((total ?? 0) > MAX_UNITS || (CAMPGROUND.test(name) && unitTypes)) {
        candidates.campground_cabins.push({ ...ref, units: total, cabin_units: cabinUnits });
        continue;
      }
      if (cabinUnits === 0) {
        // Mistyped units (e.g. Tongass cabins entered as STANDARD): trust a building name on a tiny facility.
        // The Forest Service's own cabin-rental list vouches for a few more.
        const fsListed = r.via.includes("usfs") || edwById.has(r.id);
        if ((fsListed && (total ?? 1) <= 4) || ((total ?? 1) <= 2 && BUILDING_END.test(name))) cabinUnits = total ?? 1;
        else {
          candidates.unclear.push({ ...ref, units: total, why: "no cabin-type units" });
          continue;
        }
      }
    }

    const edw = edwFor(r, name);
    if (edw) edwUsed.add(edw);

    const kind = ov.kind ?? (GUARD_STATION.test(name) ? "guard_station" : "cabin");
    const season = edw ? seasonInfo(edw) : null;
    const notes = [
      season?.text ?? null,
      edw?.status === "temporarily closed" ? "The Forest Service lists it as temporarily closed; check before planning." : null,
      ov.season_notes ?? null,
    ].filter(Boolean);

    let lat = ov.lat ?? r.lat;
    let lng = ov.lng ?? r.lng;
    let approx = Boolean(ov.coords_approximate);
    if ((lat == null || lng == null || (lat === 0 && lng === 0)) && edw?.lat != null) {
      lat = edw.lat;
      lng = edw.lng;
    }
    if ((lat == null || lng == null) && r.units?.some((u) => u[3] != null)) {
      const u = r.units.find((x) => x[3] != null);
      lat = u[3];
      lng = u[4];
      approx = true;
    }

    const sources = ["recgov_search"];
    if (r.units) sources.push("recgov_units");
    if (edw) sources.push("usfs_edw");
    if (Object.keys(ov).length) sources.push("supplement");

    sites.push({
      id: `recgov-${r.id}`,
      kind,
      name,
      state: ov.state ?? state,
      operator: r.org || null,
      managing_unit: r.parent || edw?.forest || null,
      lat,
      lng,
      coords_approximate: approx,
      platform: "recgov",
      provider_ref: r.id,
      booking_url: ref.url,
      info_url: edw?.url ?? null,
      season_status:
        ov.season_status ?? (r.reservable === false ? "unavailable" : season && !season.yearRound ? "seasonal" : "open"),
      season_notes: notes.join(" ") || null,
      season_checked_at: today,
      provider_reservable: r.reservable,
      release_rule: RECGOV_RELEASE,
      rating: r.rating != null && r.nratings ? Math.round(r.rating * 100) / 100 : null,
      rating_count: r.nratings || null,
      rating_source: r.rating != null && r.nratings ? "recreation.gov" : null,
      unit_types: unitTypes,
      unit_count: cabinUnits,
      // A mixed facility's price range includes its tent sites, so it says nothing about the cabins.
      price_min: unitTypes ? null : r.price?.[0] ?? null,
      price_max: unitTypes ? null : r.price?.[1] ?? null,
      image_url: r.image,
      sources,
    });
  }

  // Forest Service cabin rentals with no Recreation.gov match. Anything that
  // matches a facility we saw (even one we left out), a lookout, or a
  // shelter / resort / campground record is not news.
  const nearNamed = (list, e) => list.some((x) => km(x, e) < 15 && nameOverlap(cleanName(x.name), e.name) >= 0.5);
  let ignored = 0;
  for (const e of raw.edw) {
    if (edwUsed.has(e) || LOOKOUT.test(e.name)) continue;
    if (e.recgov_id && (lookoutIds.has(e.recgov_id) || byRecgovId.has(e.recgov_id))) continue;
    if (nearNamed(raw.recgov, e) || nearNamed(lookoutSites, e)) continue;
    if (NOT_TRACKED.test(e.name)) {
      ignored++;
      continue;
    }
    candidates.usfs_not_on_recgov.push({
      name: e.name,
      forest: e.forest,
      lat: e.lat,
      lng: e.lng,
      url: e.url,
      recgov_id: e.recgov_id,
      status: e.status,
      phone_only: e.phone_only,
    });
  }

  for (const [id, x] of Object.entries(supplement.extra ?? {})) {
    sites.push({
      kind: "cabin",
      coords_approximate: false,
      provider_reservable: null,
      rating: null,
      rating_count: null,
      rating_source: null,
      unit_types: null,
      unit_count: 1,
      price_min: null,
      price_max: null,
      image_url: null,
      info_url: null,
      season_checked_at: today,
      sources: ["supplement"],
      id,
      ...x,
    });
  }

  sites.sort((a, b) => (a.state ?? "").localeCompare(b.state ?? "") || a.name.localeCompare(b.name));
  const tally = (key) => sites.reduce((m, s) => ((m[s[key] ?? "?"] = (m[s[key] ?? "?"] ?? 0) + 1), m), {});
  for (const list of Object.values(candidates)) list.sort((a, b) => (a.state ?? a.forest ?? "").localeCompare(b.state ?? b.forest ?? "") || a.name.localeCompare(b.name));

  return {
    version: 1,
    generated_at: new Date().toISOString(),
    collected_at: raw.collected_at,
    attribution: [
      "Facility data, ratings, and photos: Recreation.gov",
      "Seasons and Forest Service pages: USDA Forest Service EDW Recreation Opportunities",
    ],
    counts: {
      total: sites.length,
      by_kind: tally("kind"),
      by_operator: tally("operator"),
      by_state: tally("state"),
      candidates: Object.fromEntries(Object.entries(candidates).map(([k, v]) => [k, v.length])),
      usfs_records_ignored: ignored,
    },
    sites,
    candidates,
  };
}

/* ───────────── main ───────────── */

async function getJson(url) {
  const res = await politeFetch(url, { headers: { Accept: "application/json", "User-Agent": USER_AGENT } });
  let json = null;
  try {
    json = await res.json();
  } catch {
    /* non-JSON error page */
  }
  return { status: res.status, json };
}

async function main() {
  let raw;
  if (process.argv.includes("--from-raw")) {
    raw = JSON.parse(fs.readFileSync(RAW_PATH, "utf-8"));
    console.log(`Using cached fetch from ${raw.collected_at}`);
  } else {
    console.log("1/3  USDA Forest Service cabin rentals (EDW)");
    const edw = await collectEdw(getJson);
    console.log("2/3  Recreation.gov cabins and guard stations");
    const supplement = fs.existsSync(SUPPLEMENT_PATH) ? JSON.parse(fs.readFileSync(SUPPLEMENT_PATH, "utf-8")) : {};
    const extra = [
      ...Object.entries(supplement.include ?? {}).map(([id, name]) => ({ id, name })),
      ...new Map(edw.filter((e) => e.recgov_id).map((e) => [e.recgov_id, { id: e.recgov_id, name: e.name }])).values(),
    ];
    const recgov = await collectRecgov(getJson, { extra });
    raw = { collected_at: new Date().toISOString(), edw, recgov };
    fs.mkdirSync(RAW_DIR, { recursive: true });
    fs.writeFileSync(RAW_PATH, JSON.stringify(raw));
  }

  console.log("3/3  Building seed");
  const lookouts = JSON.parse(fs.readFileSync(path.join(DATA_DIR, "lookouts.v1.json"), "utf-8"));
  const lookoutIds = new Set(lookouts.sites.map((s) => s.provider_ref).filter(Boolean));
  for (const c of lookouts.candidates ?? []) lookoutIds.add(c.facility_id);
  const supplement = fs.existsSync(SUPPLEMENT_PATH) ? JSON.parse(fs.readFileSync(SUPPLEMENT_PATH, "utf-8")) : {};
  const seed = build(raw, { lookoutIds, lookoutSites: lookouts.sites, supplement });

  fs.writeFileSync(OUT_PATH, JSON.stringify(seed, null, 2) + "\n");
  console.log(`\nWrote ${path.relative(process.cwd(), OUT_PATH)}`);
  console.log(`  ${seed.counts.total} sites: ${JSON.stringify(seed.counts.by_kind)}`);
  console.log(`  by operator: ${JSON.stringify(seed.counts.by_operator)}`);
  console.log(`  candidates to review: ${JSON.stringify(seed.counts.candidates)}`);
  const missing = seed.sites.filter((s) => s.lat == null || s.lng == null || !s.state).map((s) => s.name);
  if (missing.length) console.warn(`  missing coordinates or state: ${missing.join(", ")}`);
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith("seed-cabins.mjs")) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
