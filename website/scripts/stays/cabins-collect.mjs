/**
 * Network side of the cabin / guard station seed. Pure functions with an
 * injected `getJson(url) -> Promise<{ status, json }>` so the same code runs
 * from Node (seed-cabins.mjs) or a browser console on recreation.gov.
 *
 * Sources (all read-only, public, no key):
 *   1. Recreation.gov search, faceted by unit type CABIN NONELECTRIC /
 *      CABIN ELECTRIC. Catches every facility that has a cabin unit.
 *   2. Recreation.gov keyword search ("cabin", "guard station", ...). Catches
 *      facilities whose units were entered with the wrong type (most of the
 *      Sitka-area Tongass cabins are typed STANDARD NONELECTRIC).
 *   3. Recreation.gov campsite search for multi-unit or unclear facilities:
 *      how many units are actually cabins, and their types.
 *   4. USFS EDW "Recreation Opportunities" layer, activity "Cabin Rentals":
 *      season text, open status, the Forest Service info page, and a
 *      cross-check that surfaces FS rentals Recreation.gov search missed.
 *
 * The raw result is compact; seed-cabins.mjs turns it into cabins.v1.json.
 */

export const RECGOV = "https://www.recreation.gov";
export const EDW_LAYER =
  "https://apps.fs.usda.gov/arcx/rest/services/EDW/EDW_RecreationOpportunities_01/MapServer/0/query";

export const CABIN_UNIT_TYPES = ["CABIN NONELECTRIC", "CABIN ELECTRIC"];

export const KEYWORDS = [
  "cabin", "guard station", "ranger station", "guard cabin", "bunkhouse", "cottage",
  "hut", "homestead", "farmhouse", "lodge", "house", "remount", "crew quarters", "work center",
];

/** Names that sound like a place you sleep in (vs "Cabin Creek Campground"). */
export const DWELLING_NAME =
  /\b(cabins?|guard station|guard sta\.?|ranger station|ranger cabin|guard cabin|bunkhouse|cottage|hut|homestead|farm ?house|house|lodge|remount depot|crew quarters|work center|quarters|admin(istrative)? site|ranch|camp)\b/i;
export const NOT_A_CABIN =
  /campground|group (site|camp)|picnic|day use|trailhead|\bRV\b|horse camp|boat|ramp|marina|pavilion|amphitheat|parking/i;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const GENERIC = new Set(["cabin", "cabins", "rental", "recreation", "recreational", "the", "and", "of", "site", "station"]);
function nameTokens(name) {
  return (name || "").toLowerCase().replace(/[’']/g, "").replace(/[^a-z0-9]+/g, " ").split(" ").filter((t) => t && !GENERIC.has(t));
}
export function nameKey(name) {
  return nameTokens(name).sort().join(" ");
}
export function tokenOverlap(a, b) {
  const A = new Set(nameTokens(a));
  const B = new Set(nameTokens(b));
  if (!A.size || !B.size) return 0;
  let n = 0;
  for (const t of A) if (B.has(t)) n++;
  return n / Math.max(A.size, B.size);
}

function compact(x) {
  const pr = x.price_range;
  return {
    id: String(x.entity_id),
    name: x.name,
    state: x.state_code || x.addresses?.[0]?.state_code || null,
    lat: x.latitude != null ? Number(x.latitude) : null,
    lng: x.longitude != null ? Number(x.longitude) : null,
    org: x.org_name || null,
    parent: x.parent_name || null,
    count: x.campsites_count != null ? Number(x.campsites_count) : null,
    rating: x.average_rating != null ? Number(x.average_rating) : null,
    nratings: x.number_of_ratings != null ? Number(x.number_of_ratings) : null,
    reservable: x.reservable ?? null,
    price: pr && pr.amount_min != null ? [pr.amount_min, pr.amount_max ?? pr.amount_min] : null,
    image: x.preview_image_url || null,
    via: [],
  };
}

/**
 * Recreation.gov side. `extra` is [{ id, name }] for facility ids found
 * elsewhere (the USFS layer) to look up by name if the sweeps missed them.
 */
export async function collectRecgov(getJson, { delayMs = 2500, log = console.log, extra = [] } = {}) {
  const byId = new Map();
  const add = (x, via) => {
    if (x.entity_type && x.entity_type !== "campground") return;
    const id = String(x.entity_id);
    const e = byId.get(id) ?? compact(x);
    if (!e.via.includes(via)) e.via.push(via);
    byId.set(id, e);
  };
  const page = async (params, via, filter = () => true) => {
    for (let start = 0; start < 1000; start += 200) {
      await sleep(delayMs);
      const url = `${RECGOV}/api/search?size=200&start=${start}&${params}`;
      const { status, json } = await getJson(url);
      if (status !== 200 || !json?.results) {
        log(`  ${via} start=${start}: HTTP ${status}`);
        break;
      }
      for (const x of json.results) if (filter(x)) add(x, via);
      if (json.results.length < 200) break;
    }
  };

  const camp = `fq=${encodeURIComponent("entity_type:campground")}`;
  for (const t of CABIN_UNIT_TYPES) {
    log(`  facet ${t}`);
    await page(`${camp}&fq=${encodeURIComponent(`campsite_type:${t}`)}`, `type:${t}`);
  }
  for (const q of KEYWORDS) {
    log(`  keyword "${q}"`);
    const word = new RegExp(`\\b${q.replace(/ /g, "\\s+")}`, "i");
    await page(`q=${encodeURIComponent(q)}&${camp}`, `q:${q}`, (x) => word.test(x.name) && !NOT_A_CABIN.test(x.name));
  }

  // Forest Service pages often carry legacy Recreation.gov ids (parkId=71857),
  // so fall back to a close name match when the id isn't found.
  const names = new Set([...byId.values()].map((e) => nameKey(e.name)));
  for (const { id, name } of extra) {
    if (byId.has(id) || names.has(nameKey(name))) continue;
    await sleep(delayMs);
    const q = name.replace(/recreation(al)? rental:?|rental cabins?|- rental/gi, " ").trim();
    const { status, json } = await getJson(`${RECGOV}/api/search?q=${encodeURIComponent(q)}&size=10&${camp}`);
    const results = status === 200 ? json.results ?? [] : [];
    const hit =
      results.find((r) => String(r.entity_id) === id) ??
      results.find((r) => tokenOverlap(r.name, name) >= 0.75 && !NOT_A_CABIN.test(r.name));
    if (hit) add(hit, "usfs");
    else log(`  USFS-linked facility not in search: ${name} (${id})`);
  }

  // Unit detail where the facility-level record can't tell us enough: how
  // many units of a multi-unit cabin facility are cabins, and unit counts the
  // search left blank. Keyword-only hits never have cabin-typed units (they'd
  // be in the facet), and anything over 30 units is a campground, so skip those.
  const needUnits = [...byId.values()].filter(
    (e) =>
      e.count == null ||
      e.lat == null || // unit records often carry the coordinates the facility lacks
      (e.count > 1 && e.count <= 30 && e.via.some((v) => v.startsWith("type:")))
  );
  log(`  unit detail for ${needUnits.length} facilities`);
  for (const e of needUnits) {
    await sleep(delayMs);
    const { status, json } = await getJson(
      `${RECGOV}/api/search/campsites?fq=${encodeURIComponent(`asset_id:${e.id}`)}&size=200`
    );
    if (status !== 200) {
      log(`  units ${e.id}: HTTP ${status}`);
      continue;
    }
    e.units = (json.campsites ?? []).map((c) => [
      String(c.campsite_id),
      c.type || c.campsite_type || "",
      c.name || "",
      c.latitude != null ? Number(c.latitude) : null,
      c.longitude != null ? Number(c.longitude) : null,
    ]);
    if (e.count == null) e.count = e.units.length;
  }
  return [...byId.values()];
}

const RECGOV_ID_PATTERNS = [
  /recreation\.gov\/camping\/campgrounds\/(\d{5,})/i,
  /[?&](?:amp;)?parkId=(\d{5,})/i,
  /[?&](?:amp;)?facilityId=(\d{5,})/i,
];

export function recgovIdFrom(text) {
  for (const re of RECGOV_ID_PATTERNS) {
    const m = (text || "").match(re);
    if (m) return m[1];
  }
  return null;
}

/** USFS EDW layer: every recreation site whose marker activity is Cabin Rentals. */
export async function collectEdw(getJson, { log = console.log } = {}) {
  const fields = [
    "recareaname", "latitude", "longitude", "recareaurl", "open_season_start", "open_season_end",
    "forestname", "recareaid", "openstatus", "reservation_info", "feedescription",
  ].join(",");
  const out = [];
  for (let offset = 0; offset < 10000; offset += 1000) {
    const url =
      `${EDW_LAYER}?where=${encodeURIComponent("markeractivity = 'Cabin Rentals'")}` +
      `&outFields=${fields}&returnGeometry=false&resultOffset=${offset}&resultRecordCount=1000&orderByFields=objectid&f=json`;
    const { status, json } = await getJson(url);
    if (status !== 200 || !json?.features) {
      log(`  EDW offset=${offset}: HTTP ${status}`);
      break;
    }
    for (const { attributes: a } of json.features) {
      const text = `${a.reservation_info || ""} ${a.feedescription || ""}`;
      out.push({
        name: a.recareaname,
        lat: a.latitude != null ? Number(a.latitude) : null,
        lng: a.longitude != null ? Number(a.longitude) : null,
        url: a.recareaurl || null,
        season: [a.open_season_start || null, a.open_season_end || null],
        status: a.openstatus || null,
        forest: a.forestname || null,
        recgov_id: recgovIdFrom(text),
        phone_only: !/recreation\.gov/i.test(text) && /\(\d{3}\)\s?\d{3}-\d{4}|\d{3}-\d{3}-\d{4}/.test(text),
      });
    }
    if (json.features.length < 1000 && !json.exceededTransferLimit) break;
  }
  log(`  ${out.length} USFS cabin-rental records`);
  return out;
}
