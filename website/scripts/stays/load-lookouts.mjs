/**
 * Upsert data/stays/lookouts.v1.json into stay_sites.
 *
 *   node scripts/stays/load-lookouts.mjs             # local DB (DATABASE_URL)
 *   node scripts/stays/load-lookouts.mjs --supabase  # production (SUPABASE_DB_URL)
 *   node scripts/stays/load-lookouts.mjs --dry-run   # validate only
 *
 * Works the same in PowerShell, Command Prompt, or Git Bash. Run it from the
 * website folder. Both URLs are read from .env.local.
 *
 * The seed is the source of truth for site metadata and season status.
 * Lookouts that drop out of the seed are marked inactive, never deleted, so
 * their availability history survives.
 */
import fs from "fs";
import path from "path";
import pg from "pg";
import { loadEnv, DATA_DIR } from "./_shared.mjs";

loadEnv();
const dryRun = process.argv.includes("--dry-run");
const toSupabase = process.argv.includes("--supabase");

const seed = JSON.parse(fs.readFileSync(path.join(DATA_DIR, "lookouts.v1.json"), "utf-8"));

const COLS = [
  "id", "kind", "name", "state", "operator", "managing_unit", "lat", "lng",
  "coords_approximate", "platform", "provider_ref", "booking_url", "info_url",
  "season_status", "season_notes", "season_checked_at", "provider_reservable",
  "release_rule", "rating", "rating_count", "rating_source", "sources",
];

const problems = [];
for (const s of seed.sites) {
  if (!s.id || !s.name || !s.state || !s.platform) problems.push(`${s.id || s.name}: missing id/name/state/platform`);
  if (s.lat == null || s.lng == null) problems.push(`${s.id}: missing coordinates`);
  if (!s.release_rule?.type) problems.push(`${s.id}: missing release_rule`);
}
if (problems.length) {
  console.error("Seed problems:\n  " + problems.join("\n  "));
  process.exit(1);
}
console.log(`Seed v${seed.version}: ${seed.sites.length} sites OK`);
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
const { rows: has } = await client.query("select to_regclass('public.stay_sites') as t");
if (!has[0].t) {
  console.error("The stay_sites table does not exist yet. Run scripts/setup-stays.sql in the Supabase SQL editor first.");
  await client.end();
  process.exit(1);
}
try {
  await client.query("begin");
  const placeholders = COLS.map((_, i) => `$${i + 1}`).join(", ");
  const updates = COLS.filter((c) => c !== "id").map((c) => `${c} = excluded.${c}`).join(", ");
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
       values (${placeholders}, ${seed.version}, true, now())
       on conflict (id) do update set ${updates},
         seed_version = excluded.seed_version, active = true, updated_at = now()`,
      values
    );
  }
  const ids = seed.sites.map((s) => s.id);
  const { rowCount } = await client.query(
    `update stay_sites set active = false, updated_at = now()
     where kind = 'lookout' and active and not (id = any($1))`,
    [ids]
  );
  await client.query("commit");
  console.log(`Upserted ${ids.length} sites. Deactivated ${rowCount}.`);
} catch (err) {
  await client.query("rollback");
  throw err;
} finally {
  await client.end();
}
