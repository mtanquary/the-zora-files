/**
 * Upsert the stay seeds into stay_sites:
 *   data/stays/lookouts.v1.json  (fire lookouts)
 *   data/stays/cabins.v1.json    (cabins + guard stations)
 *
 *   node scripts/stays/load-stays.mjs             # local DB (DATABASE_URL)
 *   node scripts/stays/load-stays.mjs --supabase  # production (SUPABASE_DB_URL)
 *   node scripts/stays/load-stays.mjs --dry-run   # validate only
 *   node scripts/stays/load-stays.mjs --only cabins   # just one seed
 *
 * Works the same in PowerShell, Command Prompt, or Git Bash. Run it from the
 * website folder. Both URLs are read from .env.local. (load-lookouts.mjs
 * still works and does the same thing.)
 *
 * The seeds are the source of truth for site metadata and season status.
 * Sites that drop out of their seed are marked inactive, never deleted, so
 * their availability history survives.
 */
import fs from "fs";
import path from "path";
import pg from "pg";
import { loadEnv, DATA_DIR } from "./_shared.mjs";

loadEnv();
const argv = process.argv.slice(2);
const dryRun = argv.includes("--dry-run");
const toSupabase = argv.includes("--supabase");
const only = argv.includes("--only") ? argv[argv.indexOf("--only") + 1] : null;

/** Each seed owns these kinds: sites of those kinds missing from it get deactivated. */
const SEEDS = [
  { name: "lookouts", file: "lookouts.v1.json", kinds: ["lookout"] },
  { name: "cabins", file: "cabins.v1.json", kinds: ["cabin", "guard_station"] },
].filter((s) => !only || s.name === only);

const KINDS = new Set(["lookout", "cabin", "guard_station", "campsite"]);
const COLS = [
  "id", "kind", "name", "state", "operator", "managing_unit", "lat", "lng",
  "coords_approximate", "platform", "provider_ref", "booking_url", "info_url",
  "season_status", "season_notes", "season_checked_at", "provider_reservable",
  "release_rule", "rating", "rating_count", "rating_source", "sources",
  "unit_types", "unit_count", "price_min", "price_max", "image_url",
];

const loaded = [];
const problems = [];
const seenIds = new Map();
for (const s of SEEDS) {
  const p = path.join(DATA_DIR, s.file);
  if (!fs.existsSync(p)) {
    if (only) problems.push(`${s.file} not found`);
    else console.warn(`Skipping ${s.file} (not built yet)`);
    continue;
  }
  const seed = JSON.parse(fs.readFileSync(p, "utf-8"));
  for (const site of seed.sites) {
    const label = site.id || site.name;
    if (!site.id || !site.name || !site.state || !site.platform) problems.push(`${s.file} ${label}: missing id/name/state/platform`);
    if (site.lat == null || site.lng == null) problems.push(`${s.file} ${label}: missing coordinates`);
    if (!site.release_rule?.type) problems.push(`${s.file} ${label}: missing release_rule`);
    const kind = site.kind ?? "lookout";
    if (!KINDS.has(kind) || !s.kinds.includes(kind)) problems.push(`${s.file} ${label}: kind "${kind}" doesn't belong in this seed`);
    if (seenIds.has(site.id)) problems.push(`${label} is in both ${seenIds.get(site.id)} and ${s.file}`);
    seenIds.set(site.id, s.file);
  }
  loaded.push({ ...s, seed });
  console.log(`${s.file} v${seed.version}: ${seed.sites.length} sites`);
}
if (problems.length) {
  console.error("Seed problems:\n  " + problems.join("\n  "));
  process.exit(1);
}
if (!loaded.length) {
  console.error("Nothing to load.");
  process.exit(1);
}
console.log("Seeds OK");
if (dryRun) process.exit(0);

const envName = toSupabase ? "SUPABASE_DB_URL" : "DATABASE_URL";
const connectionString = process.env[envName];
if (!connectionString) {
  console.error(
    toSupabase
      ? [
          "SUPABASE_DB_URL is missing from website/.env.local.",
          "  In Supabase: open the project, click Connect, copy the Session pooler URI,",
          "  put your database password in place of [YOUR-PASSWORD], and add a line:",
          "  SUPABASE_DB_URL=postgresql://...",
        ].join("\n")
      : "DATABASE_URL is not set in website/.env.local"
  );
  process.exit(1);
}
if (toSupabase && connectionString.toUpperCase().includes("[YOUR-PASSWORD]")) {
  console.error("SUPABASE_DB_URL still contains [YOUR-PASSWORD]. Replace it with your database password.");
  process.exit(1);
}

const target = (() => {
  try {
    return new URL(connectionString).host;
  } catch {
    return "(unparseable URL)";
  }
})();
console.log(`Target: ${toSupabase ? "Supabase" : "local"} (${target})`);

const client = new pg.Client({
  connectionString,
  // Supabase requires TLS; its pooler certificate chain isn't in Node's default store.
  ...(toSupabase ? { ssl: { rejectUnauthorized: false } } : {}),
});
try {
  await client.connect();
} catch (err) {
  console.error(`Could not connect: ${err.message}`);
  if (/password authentication/i.test(err.message)) console.error("  Check the database password in the URL.");
  process.exit(1);
}
const { rows: has } = await client.query(
  `select to_regclass('public.stay_sites') as t,
          exists (select 1 from information_schema.columns
                  where table_name = 'stay_sites' and column_name = 'unit_types') as has_units`
);
if (!has[0].t || !has[0].has_units) {
  console.error(
    !has[0].t
      ? "The stay_sites table does not exist yet. Run scripts/setup-stays.sql in the Supabase SQL editor first."
      : "stay_sites is missing the cabin columns. Re-run scripts/setup-stays.sql (it's safe to run again)."
  );
  await client.end();
  process.exit(1);
}
try {
  await client.query("begin");
  const placeholders = COLS.map((_, i) => `$${i + 1}`).join(", ");
  const updates = COLS.filter((c) => c !== "id").map((c) => `${c} = excluded.${c}`).join(", ");
  for (const { file, kinds, seed } of loaded) {
    for (const s of seed.sites) {
      const values = COLS.map((c) => {
        if (c === "release_rule") return JSON.stringify(s.release_rule);
        if (c === "sources") return s.sources ?? [];
        if (c === "kind") return s.kind ?? "lookout";
        if (c === "coords_approximate") return Boolean(s.coords_approximate);
        return s[c] ?? null;
      });
      await client.query(
        `insert into stay_sites (${COLS.join(", ")}, seed_version, active, updated_at)
         values (${placeholders}, ${Number(seed.version) || 1}, true, now())
         on conflict (id) do update set ${updates},
           seed_version = excluded.seed_version, active = true, updated_at = now()`,
        values
      );
    }
    const ids = seed.sites.map((s) => s.id);
    const { rowCount } = await client.query(
      `update stay_sites set active = false, updated_at = now()
       where kind = any($1) and active and not (id = any($2))`,
      [kinds, ids]
    );
    console.log(`${file}: upserted ${ids.length} sites. Deactivated ${rowCount}.`);
  }
  await client.query("commit");
} catch (err) {
  await client.query("rollback");
  throw err;
} finally {
  await client.end();
}
