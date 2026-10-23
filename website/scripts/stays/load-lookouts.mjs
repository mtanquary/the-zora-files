/**
 * Upsert data/stays/lookouts.v1.json into stay_sites.
 *
 *   node scripts/stays/load-lookouts.mjs            # uses DATABASE_URL
 *   node scripts/stays/load-lookouts.mjs --dry-run  # validate only
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

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
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
