/**
 * Batch-process sunrise archive photos:
 * 1. Extract EXIF (GPS, date, camera)
 * 2. Score each via Claude (Eos Index)
 * 3. Reverse-geocode GPS to location name
 * 4. Write results to public/archives/archive-data.json
 * 5. Copy photos to public/archives/
 *
 * Usage: node scripts/score-archives.mjs
 * Requires ANTHROPIC_API_KEY in .env.local
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import exifr from "exifr";
import sharp from "sharp";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

// Load env manually (no dotenv dependency needed)
const envPath = path.join(ROOT, ".env.local");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq > 0) {
      process.env[trimmed.slice(0, eq)] = trimmed.slice(eq + 1);
    }
  }
}

const API_KEY = process.env.ANTHROPIC_API_KEY;
if (!API_KEY) {
  console.error("ANTHROPIC_API_KEY not found in .env.local");
  process.exit(1);
}

const PHOTOS_DIR = path.resolve(ROOT, "../photos/zora-archives");
const OUTPUT_DIR = path.join(ROOT, "public/archives");
const DATA_FILE = path.join(OUTPUT_DIR, "archive-data.json");

// Load existing data to allow resuming
let existingData = [];
if (fs.existsSync(DATA_FILE)) {
  existingData = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
  console.log(`Loaded ${existingData.length} existing entries`);
}
const processedFiles = new Set(existingData.map((d) => d.filename));

// Get all photos
const photos = fs
  .readdirSync(PHOTOS_DIR)
  .filter((f) => /\.(jpg|jpeg|png|webp)$/i.test(f))
  .sort();

console.log(`Found ${photos.length} photos, ${processedFiles.size} already processed`);

/** Extract EXIF data */
async function extractExif(filePath) {
  try {
    const data = await exifr.parse(filePath, {
      gps: true,
      pick: ["DateTimeOriginal", "CreateDate", "Make", "Model", "latitude", "longitude"],
    });
    if (!data) return null;
    return {
      lat: data.latitude || null,
      lng: data.longitude || null,
      taken_at: data.DateTimeOriginal || data.CreateDate || null,
      camera: [data.Make, data.Model].filter(Boolean).join(" ") || null,
    };
  } catch {
    return null;
  }
}

/** Reverse geocode lat/lng to a location name */
async function reverseGeocode(lat, lng) {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=14`;
    const res = await fetch(url, {
      headers: { "User-Agent": "TheZoraFiles/1.0" },
    });
    const data = await res.json();
    if (data?.address) {
      const a = data.address;
      // Build a nice location name from components
      const parts = [
        a.tourism || a.leisure || a.park || a.natural || a.amenity,
        a.hamlet || a.village || a.town || a.suburb || a.city,
        a.state,
      ].filter(Boolean);
      if (parts.length > 0) return parts.join(", ");
      return data.display_name?.split(",").slice(0, 3).join(",").trim() || null;
    }
  } catch {
    // fall through
  }
  return null;
}

/** Score a photo via Claude */
async function scorePhoto(base64, mediaType, locationHint) {
  const prompt = `You are scoring a sunrise photo using the Eos Index rubric. The Eos Index is a 0-100 sunrise quality score.

## Scoring rubric

### Sky: 50 points
| Component | Max | Description |
|-----------|-----|-------------|
| Color intensity | 20 | Saturation, vividness, range of hues |
| Cloud engagement | 15 | Dramatic lit clouds score high; clear sky moderate; flat overcast low |
| Horizon definition | 15 | Clean readable horizon = high; obstructed or flat = low |

### Setting: 30 points
| Component | Max | Description |
|-----------|-----|-------------|
| Foreground composition | 15 | Trail, cactus, water, flowers, person: compelling element in frame |
| Location uniqueness | 15 | Suburban roadside = low; remote wilderness = high |

### Conditions: 20 points
| Component | Max | Description |
|-----------|-----|-------------|
| Access difficulty | 10 | Drive-up viewpoint = 1-2; technical terrain or pre-dawn scramble = 8-10 |
| Weather/environmental challenge | 10 | Perfect calm = 3-4; dramatic or difficult conditions = 7-10 |

${locationHint ? `Location context: ${locationHint}` : ""}

Score this sunrise photo. Return ONLY JSON, no explanation:
{
  "sky": { "color_intensity": <0-20>, "cloud_engagement": <0-15>, "horizon_definition": <0-15> },
  "setting": { "foreground_composition": <0-15>, "location_uniqueness": <0-15> },
  "conditions": { "access_difficulty": <0-10>, "weather_challenge": <0-10> },
  "vibe": "<one sentence capturing the mood of this sunrise>"
}`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 512,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mediaType, data: base64 },
            },
            { type: "text", text: prompt },
          ],
        },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Claude API ${res.status}: ${err}`);
  }

  const data = await res.json();
  let text = data.content?.[0]?.text || "";
  text = text.trim();
  if (text.startsWith("```")) {
    text = text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }
  return JSON.parse(text);
}

/** Process a single photo */
async function processPhoto(filename, index, total) {
  const filePath = path.join(PHOTOS_DIR, filename);
  const ext = path.extname(filename).toLowerCase();
  const mediaType =
    ext === ".png" ? "image/png" : ext === ".webp" ? "image/webp" : "image/jpeg";

  console.log(`\n[${index + 1}/${total}] ${filename}`);

  // Extract EXIF
  const exif = await extractExif(filePath);
  console.log(
    `  EXIF: ${exif?.lat ? `${exif.lat.toFixed(4)}, ${exif.lng.toFixed(4)}` : "no GPS"} | ${exif?.taken_at || "no date"}`
  );

  // Reverse geocode
  let locationName = null;
  if (exif?.lat && exif?.lng) {
    locationName = await reverseGeocode(exif.lat, exif.lng);
    console.log(`  Location: ${locationName || "unknown"}`);
    // Rate limit for Nominatim (1 req/sec)
    await new Promise((r) => setTimeout(r, 1100));
  }

  // Read and encode photo — resize if over 4MB for Claude's 5MB limit
  let bytes = fs.readFileSync(filePath);
  if (bytes.length > 4 * 1024 * 1024) {
    console.log(`  Resizing (${(bytes.length / 1024 / 1024).toFixed(1)}MB)...`);
    bytes = await sharp(bytes)
      .resize(2048, 2048, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toBuffer();
    console.log(`  Resized to ${(bytes.length / 1024 / 1024).toFixed(1)}MB`);
  }
  const base64 = bytes.toString("base64");

  // Score with Claude
  console.log("  Scoring...");
  const scores = await scorePhoto(base64, mediaType, locationName);

  const skyTotal =
    scores.sky.color_intensity +
    scores.sky.cloud_engagement +
    scores.sky.horizon_definition;
  const settingTotal =
    scores.setting.foreground_composition +
    scores.setting.location_uniqueness;
  const conditionsTotal =
    scores.conditions.access_difficulty +
    scores.conditions.weather_challenge;
  const eosTotal = skyTotal + settingTotal + conditionsTotal;

  console.log(
    `  Eos: ${eosTotal}/100 (Sky ${skyTotal} + Setting ${settingTotal} + Conditions ${conditionsTotal})`
  );

  // Copy photo to public/archives
  const destPath = path.join(OUTPUT_DIR, filename);
  if (!fs.existsSync(destPath)) {
    fs.copyFileSync(filePath, destPath);
  }

  return {
    filename,
    taken_at: exif?.taken_at ? new Date(exif.taken_at).toISOString() : null,
    camera: exif?.camera || null,
    lat: exif?.lat || null,
    lng: exif?.lng || null,
    location_name: locationName,
    scores: {
      sky: scores.sky,
      setting: scores.setting,
      conditions: scores.conditions,
      sky_total: skyTotal,
      setting_total: settingTotal,
      conditions_total: conditionsTotal,
      eos_total: eosTotal,
    },
    vibe: scores.vibe || null,
  };
}

// Main
async function main() {
  const toProcess = photos.filter((f) => !processedFiles.has(f));
  console.log(`Processing ${toProcess.length} new photos...\n`);

  const results = [...existingData];

  for (let i = 0; i < toProcess.length; i++) {
    try {
      const entry = await processPhoto(toProcess[i], i, toProcess.length);
      results.push(entry);

      // Save after each photo (resume-safe)
      fs.writeFileSync(DATA_FILE, JSON.stringify(results, null, 2));
    } catch (err) {
      console.error(`  ERROR: ${err.message}`);
      console.log("  Skipping, will retry next run");
    }

    // Small delay between API calls
    if (i < toProcess.length - 1) {
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  // Sort by eos_total descending
  results.sort((a, b) => (b.scores?.eos_total || 0) - (a.scores?.eos_total || 0));
  fs.writeFileSync(DATA_FILE, JSON.stringify(results, null, 2));

  console.log(`\nDone! ${results.length} photos scored.`);
  console.log(`Data written to ${DATA_FILE}`);

  // Summary
  const withGps = results.filter((r) => r.lat);
  console.log(`${withGps.length}/${results.length} have GPS coordinates`);
  if (results.length > 0) {
    console.log(`Top score: ${results[0].scores.eos_total}/100 — ${results[0].filename}`);
  }
}

main().catch(console.error);
