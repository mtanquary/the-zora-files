/**
 * Organize photos and videos from a flat folder into YYYY/MM/DD/ subfolders.
 *
 * Date source priority:
 *   1. Filename pattern (YYYY-MM-DD-*, YYYYMMDD_*, image_crop_<ms>, tiktok-eos..-YYYYMMDD_*)
 *   2. EXIF DateTimeOriginal (photos only)
 *   3. File mtime (fallback)
 *
 * Usage:
 *   node scripts/organize-photos.mjs <folder> [--dry-run] [--apply]
 *     --dry-run  print planned moves, make no changes (default)
 *     --apply    actually perform the moves
 */

import fs from "fs";
import path from "path";
import exifr from "exifr";

const args = process.argv.slice(2);
const target = args.find((a) => !a.startsWith("--"));
const dryRun = !args.includes("--apply");

if (!target) {
  console.error("Usage: node organize-photos.mjs <folder> [--apply]");
  process.exit(1);
}

const ROOT = path.resolve(target);
if (!fs.existsSync(ROOT) || !fs.statSync(ROOT).isDirectory()) {
  console.error(`Not a directory: ${ROOT}`);
  process.exit(1);
}

console.log(`Target: ${ROOT}`);
console.log(`Mode:   ${dryRun ? "DRY RUN (no changes)" : "APPLY"}`);
console.log("");

const EXTS = new Set([".jpg", ".jpeg", ".png", ".mp4", ".mov", ".heic", ".webp"]);

/** Try to extract a Date from the filename using known patterns. Local time. */
function dateFromName(name) {
  // 1) 2026-04-15-22-53-10-189.jpg
  let m = name.match(/^(\d{4})-(\d{2})-(\d{2})[-_.]/);
  if (m) return new Date(+m[1], +m[2] - 1, +m[3]);

  // 2) YYYYMMDD_HHMMSS (possibly with prefix like IMG_, VID_, HOVER_, Screenshot_, tiktok-eosNN-)
  m = name.match(/(?:^|[_\-])(\d{4})(\d{2})(\d{2})[_\-]\d{6}/);
  if (m) return new Date(+m[1], +m[2] - 1, +m[3]);

  // 3) YYYYMMDD_ (no seconds portion, rare)
  m = name.match(/(?:^|[_\-])(\d{4})(\d{2})(\d{2})_/);
  if (m) return new Date(+m[1], +m[2] - 1, +m[3]);

  // 4) image_crop_<13-digit-ms>.ext
  m = name.match(/_(\d{13})\./);
  if (m) return new Date(+m[1]);

  return null;
}

/** Extract DateTimeOriginal via EXIF (photos only). */
async function dateFromExif(filePath) {
  try {
    const data = await exifr.parse(filePath, {
      pick: ["DateTimeOriginal", "CreateDate"],
    });
    const d = data?.DateTimeOriginal || data?.CreateDate;
    if (d instanceof Date && !isNaN(d)) return d;
  } catch {
    // ignore — fall through
  }
  return null;
}

/** Build YYYY/MM/DD path component. */
function ymdPath(d) {
  const y = String(d.getFullYear());
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return path.join(y, m, day);
}

/** Resolve name collision by appending -1, -2, ... */
function resolveDest(destDir, baseName) {
  let dest = path.join(destDir, baseName);
  if (!fs.existsSync(dest)) return dest;
  const ext = path.extname(baseName);
  const stem = baseName.slice(0, -ext.length);
  let i = 1;
  while (fs.existsSync(path.join(destDir, `${stem}-${i}${ext}`))) i++;
  return path.join(destDir, `${stem}-${i}${ext}`);
}

const entries = fs
  .readdirSync(ROOT, { withFileTypes: true })
  .filter((d) => d.isFile())
  .filter((d) => EXTS.has(path.extname(d.name).toLowerCase()))
  .map((d) => d.name);

console.log(`Found ${entries.length} media files.\n`);

const stats = { fromName: 0, fromExif: 0, fromMtime: 0, moved: 0, skipped: 0, collisions: 0 };
const byDay = new Map();
const fallbacks = [];

for (const name of entries) {
  const src = path.join(ROOT, name);
  const ext = path.extname(name).toLowerCase();

  let d = dateFromName(name);
  let source = "name";

  if (!d && (ext === ".jpg" || ext === ".jpeg" || ext === ".heic" || ext === ".png")) {
    const exifDate = await dateFromExif(src);
    // Reject obviously-unset camera clocks (e.g. DSC default Jan 1, 2001–2003).
    if (exifDate && exifDate.getFullYear() >= 2010) {
      d = exifDate;
      source = "exif";
    }
  }

  if (!d) {
    d = fs.statSync(src).mtime;
    source = "mtime";
  }

  if (source === "name") stats.fromName++;
  else if (source === "exif") stats.fromExif++;
  else stats.fromMtime++;

  if (source !== "name") fallbacks.push({ name, source, date: d.toISOString().slice(0, 10) });

  const destDir = path.join(ROOT, ymdPath(d));
  const destPath = resolveDest(destDir, name);

  if (destPath !== path.join(destDir, name)) stats.collisions++;

  const dayKey = destDir.slice(ROOT.length + 1);
  byDay.set(dayKey, (byDay.get(dayKey) || 0) + 1);

  if (!dryRun) {
    fs.mkdirSync(destDir, { recursive: true });
    try {
      fs.renameSync(src, destPath);
      stats.moved++;
    } catch (err) {
      console.error(`  ERROR moving ${name}: ${err.message}`);
      stats.skipped++;
    }
  }
}

// Summary
console.log("Distribution by day:");
for (const [day, count] of [...byDay.entries()].sort()) {
  console.log(`  ${day.replace(/\\/g, "/")}  ${count}`);
}

console.log("");
console.log("Date source:");
console.log(`  filename: ${stats.fromName}`);
console.log(`  EXIF:     ${stats.fromExif}`);
console.log(`  mtime:    ${stats.fromMtime}`);
console.log(`  name collisions resolved: ${stats.collisions}`);

if (fallbacks.length) {
  console.log("\nFiles that fell through filename pattern:");
  for (const f of fallbacks) {
    console.log(`  [${f.source}] ${f.date}  ${f.name}`);
  }
}

if (dryRun) {
  console.log("\nDRY RUN — no files were moved. Re-run with --apply to execute.");
} else {
  console.log(`\nMoved ${stats.moved} files. Skipped ${stats.skipped}.`);
}
