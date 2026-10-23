/**
 * Add display width/height to public/archives/archive-data.json so pages can
 * reserve the right space for each photo (no layout jump while loading).
 *
 *   node scripts/archive-dimensions.mjs
 *
 * Reads each file's real pixel size with sharp and swaps width/height for
 * photos the camera stored rotated (EXIF orientation 5-8). Safe to re-run;
 * only adds or refreshes the two fields.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIR = path.join(ROOT, "public", "archives");
const DATA = path.join(DIR, "archive-data.json");

const entries = JSON.parse(fs.readFileSync(DATA, "utf-8"));
let updated = 0;
for (const e of entries) {
  const file = path.join(DIR, e.filename);
  if (!fs.existsSync(file)) {
    console.warn(`missing file: ${e.filename}`);
    continue;
  }
  const meta = await sharp(file).metadata();
  const rotated = (meta.orientation ?? 1) >= 5;
  const width = rotated ? meta.height : meta.width;
  const height = rotated ? meta.width : meta.height;
  if (e.width !== width || e.height !== height) {
    e.width = width;
    e.height = height;
    updated++;
  }
}
fs.writeFileSync(DATA, JSON.stringify(entries, null, 2) + "\n");
console.log(`${entries.length} entries, ${updated} updated`);
