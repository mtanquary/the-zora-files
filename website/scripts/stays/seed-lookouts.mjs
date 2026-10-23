/**
 * Build the versioned fire-lookout seed: data/stays/lookouts.v1.json
 *
 *   node scripts/stays/seed-lookouts.mjs
 *
 * Pipeline (see docs/fire-lookout-research.md):
 *   1. FFLA rentals page -> Recreation.gov facility ids, names, states, closure notes
 *   2. Recreation.gov search API (one broad query) -> coordinates, rating,
 *      rating count, reservable flag, managing unit. No key needed.
 *   3. RIDB (optional, RIDB_API_KEY in .env.local) -> official coordinates and
 *      Reservable flag, preferred over search when present.
 *   4. data/stays/recgov-supplement.json -> extra Rec.gov lookouts + season notes
 *   5. data/stays/manual-lookouts.json -> the non-Rec.gov lookouts
 *
 * Also writes a "candidates" list: Rec.gov facilities named like lookouts that
 * aren't in FFLA or the supplement. Review them by hand; nothing is auto-added.
 *
 * About 3 requests without RIDB, about 85 with it (1.3s apart, under RIDB's
 * 50/min limit). Run it each winter when seasons are re-validated.
 */
import fs from "fs";
import path from "path";
import { loadEnv, DATA_DIR, politeFetch, sleep } from "./_shared.mjs";

loadEnv();

const FFLA_URL = "https://firelookout.org/resources/rentals/";
const SEARCH_URL =
  "https://www.recreation.gov/api/search?q=lookout&size=200&fq=entity_type%3Acampground";
const RIDB_KEY = process.env.RIDB_API_KEY || "";

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
  Wisconsin: "WI", Wyoming: "WY",
};

const RECGOV_RELEASE = {
  type: "rolling_months",
  months: 6,
  time: "07:00",
  tz: "America/Los_Angeles",
  note: "Recreation.gov opens each night six months ahead at 7:00 a.m. Pacific. Popular lookouts sell out within minutes.",
};

const decode = (s) =>
  s
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#8217;|&rsquo;/g, "’")
    .replace(/&#8211;|&ndash;/g, "–")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/[​\s]+/g, " ")
    .trim();

function parseSeason(note) {
  if (/maintenance closure/i.test(note)) return "maintenance_closure";
  if (/administrative closure/i.test(note)) return "administrative_closure";
  if (/currently unavailable/i.test(note)) return "unavailable";
  return "open";
}

/** Parse FFLA's rentals page: <p><strong>State</strong><br><a href=rec.gov/...>Name</a> (note)<br>... */
function parseFfla(html) {
  const out = [];
  for (const block of html.split(/<p[\s>]/i)) {
    const stateMatch = block.match(/<strong>([^<]+)<\/strong>/i);
    if (!stateMatch) continue;
    const state = STATE_CODES[decode(stateMatch[1])];
    if (!state) continue;
    const re =
      /<a href="https?:\/\/(?:www\.)?recreation\.gov\/camping\/campgrounds\/(\d+)"[^>]*>([\s\S]*?)<\/a>([^<]*(?:<(?!br|\/p|a )[^>]*>[^<]*)*)/gi;
    let m;
    while ((m = re.exec(block))) {
      const note = decode(m[3] || "")
        .replace(/^[(\s]+|[)\s]+$/g, "")
        .replace(/Closure(\d)/i, "Closure $1");
      out.push({ facilityId: m[1], name: decode(m[2]), state, note });
    }
  }
  return out;
}

async function main() {
  console.log("1/4  FFLA rentals page");
  const fflaRes = await politeFetch(FFLA_URL);
  if (!fflaRes.ok) throw new Error(`FFLA ${fflaRes.status}`);
  const ffla = parseFfla(await fflaRes.text());
  const fflaIds = new Set(ffla.map((f) => f.facilityId));
  console.log(`     ${ffla.length} Recreation.gov links (${fflaIds.size} unique)`);
  if (fflaIds.size < 50) throw new Error("FFLA parse looks wrong (too few links). Page layout may have changed.");

  await sleep(2500);
  console.log("2/4  Recreation.gov search");
  const searchRes = await politeFetch(SEARCH_URL);
  if (!searchRes.ok) throw new Error(`search ${searchRes.status}`);
  const search = await searchRes.json();
  const byId = new Map((search.results || []).map((r) => [String(r.entity_id), r]));

  const supplement = JSON.parse(fs.readFileSync(path.join(DATA_DIR, "recgov-supplement.json"), "utf-8"));
  const wanted = [
    ...ffla,
    ...Object.entries(supplement.extra || {})
      .filter(([id]) => !fflaIds.has(id))
      .map(([facilityId, x]) => ({ facilityId, name: x.name, state: x.state, note: "" })),
  ];

  // Facilities the broad search missed: look them up one by one by name.
  for (const w of wanted) {
    if (byId.has(w.facilityId)) continue;
    await sleep(2500);
    const res = await politeFetch(
      `https://www.recreation.gov/api/search?q=${encodeURIComponent(w.name)}&size=10&fq=entity_type%3Acampground`
    );
    if (!res.ok) continue;
    const hit = ((await res.json()).results || []).find((r) => String(r.entity_id) === w.facilityId);
    if (hit) byId.set(w.facilityId, hit);
    else console.warn(`     not found in search: ${w.name} (${w.facilityId})`);
  }

  const ridb = new Map();
  if (RIDB_KEY) {
    console.log(`3/4  RIDB facility data for ${wanted.length} facilities`);
    for (const w of wanted) {
      await sleep(1300);
      const res = await politeFetch(`https://ridb.recreation.gov/api/v1/facilities/${w.facilityId}`, {
        headers: { apikey: RIDB_KEY },
      });
      if (res.ok) ridb.set(w.facilityId, await res.json());
      else console.warn(`     RIDB ${res.status} for ${w.facilityId}`);
    }
  } else {
    console.log("3/4  RIDB skipped (no RIDB_API_KEY). Using search coordinates and reservable flag.");
  }

  console.log("4/4  Building seed");
  const now = new Date().toISOString();
  const today = now.slice(0, 10);
  const sites = [];
  const seen = new Set();
  for (const w of wanted) {
    if (seen.has(w.facilityId)) continue;
    seen.add(w.facilityId);
    const s = byId.get(w.facilityId);
    const r = ridb.get(w.facilityId);
    const extra = supplement.extra?.[w.facilityId];
    const nameKey = Object.keys(supplement.notes_by_name || {}).find((k) =>
      w.name.toLowerCase().includes(k.toLowerCase())
    );
    const lat = Number(r?.FacilityLatitude) || Number(s?.latitude) || null;
    const lng = Number(r?.FacilityLongitude) || Number(s?.longitude) || null;
    const parsedStatus = parseSeason(w.note);
    const sources = ["ffla"];
    if (!fflaIds.has(w.facilityId)) sources[0] = "supplement";
    if (s) sources.push("recgov_search");
    if (r) sources.push("ridb");

    sites.push({
      id: `recgov-${w.facilityId}`,
      kind: "lookout",
      name: w.name,
      state: w.state,
      operator: s?.org_name || "USDA Forest Service",
      managing_unit: s?.parent_name || null,
      lat,
      lng,
      platform: "recgov",
      provider_ref: w.facilityId,
      booking_url: `https://www.recreation.gov/camping/campgrounds/${w.facilityId}`,
      info_url: null,
      season_status: extra?.season_status || parsedStatus,
      season_notes:
        [w.note && parsedStatus !== "open" ? w.note : null, extra?.season_notes, nameKey ? supplement.notes_by_name[nameKey] : null]
          .filter(Boolean)
          .join(" ") || null,
      season_checked_at: today,
      provider_reservable: r ? Boolean(r.Reservable) : s ? Boolean(s.reservable) : null,
      release_rule: RECGOV_RELEASE,
      rating: s?.average_rating != null ? Math.round(Number(s.average_rating) * 100) / 100 : null,
      rating_count: s?.number_of_ratings != null ? Number(s.number_of_ratings) : null,
      rating_source: s?.average_rating != null ? "recreation.gov" : null,
      coords_approximate: false,
      sources,
    });
  }

  const manual = JSON.parse(fs.readFileSync(path.join(DATA_DIR, "manual-lookouts.json"), "utf-8"));
  for (const m of manual.lookouts) {
    sites.push({
      kind: "lookout",
      info_url: null,
      coords_approximate: false,
      provider_reservable: null,
      rating: null,
      rating_count: null,
      rating_source: null,
      season_checked_at: today,
      sources: ["manual"],
      ...m,
    });
  }

  const candidates = (search.results || [])
    .filter((r) => /lookout|fire tower/i.test(r.name) && !/campground|boat|camp\b/i.test(r.name))
    .filter((r) => !seen.has(String(r.entity_id)))
    .map((r) => ({
      facility_id: String(r.entity_id),
      name: r.name,
      state: r.addresses?.[0]?.state_code || null,
      managing_unit: r.parent_name || null,
      reservable: r.reservable ?? null,
      url: `https://www.recreation.gov/camping/campgrounds/${r.entity_id}`,
    }));

  sites.sort((a, b) => a.state.localeCompare(b.state) || a.name.localeCompare(b.name));
  const missingCoords = sites.filter((s) => s.lat == null || s.lng == null).map((s) => s.name);

  const seed = {
    version: 1,
    generated_at: now,
    attribution: [
      "Rental list: Forest Fire Lookout Association (firelookout.org/resources/rentals)",
      "Facility data and ratings: Recreation.gov / RIDB",
    ],
    counts: {
      total: sites.length,
      recgov: sites.filter((s) => s.platform === "recgov").length,
      other: sites.filter((s) => s.platform !== "recgov").length,
    },
    sites,
    candidates,
  };

  const outPath = path.join(DATA_DIR, "lookouts.v1.json");
  fs.writeFileSync(outPath, JSON.stringify(seed, null, 2) + "\n");
  console.log(`\nWrote ${path.relative(process.cwd(), outPath)}`);
  console.log(`  ${seed.counts.total} lookouts (${seed.counts.recgov} Recreation.gov, ${seed.counts.other} other)`);
  console.log(`  ${candidates.length} candidates to review by hand`);
  if (missingCoords.length) console.warn(`  missing coordinates: ${missingCoords.join(", ")}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
