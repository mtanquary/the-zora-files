/**
 * Export top archive photos resized/cropped for each social platform
 * with Eos score overlay.
 *
 * Usage: node scripts/export-social-images.mjs
 * Outputs to social/<platform>/images/
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const ARCHIVES_DIR = path.join(ROOT, "public/archives");
const SOCIAL_DIR = path.resolve(ROOT, "../social");
const DATA_FILE = path.join(ARCHIVES_DIR, "archive-data.json");

const data = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
const top5 = data.slice(0, 5); // Already sorted by eos_total desc

const PLATFORMS = [
  { name: "youtube", dir: "youtube/images", width: 1200, height: 675 },
  { name: "instagram-square", dir: "instagram/images", width: 1080, height: 1080 },
  { name: "instagram-portrait", dir: "instagram/images-portrait", width: 1080, height: 1350 },
  { name: "tiktok", dir: "tiktok/images", width: 1080, height: 1920 },
  { name: "x-twitter", dir: "x-twitter/images", width: 1200, height: 675 },
];

/**
 * Create an SVG overlay with the Eos score badge.
 * Rendered as white text with dark shadow for legibility on any photo.
 */
function scoreOverlay(score, width, height) {
  // Badge positioned bottom-right
  const badgeW = Math.round(width * 0.18);
  const badgeH = Math.round(badgeW * 0.55);
  const badgeX = width - badgeW - Math.round(width * 0.04);
  const badgeY = height - badgeH - Math.round(height * 0.04);
  const fontSize = Math.round(badgeW * 0.42);
  const labelSize = Math.round(badgeW * 0.15);
  const r = Math.round(badgeH * 0.15);

  return Buffer.from(`<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <rect x="${badgeX}" y="${badgeY}" width="${badgeW}" height="${badgeH}" rx="${r}" fill="rgba(13,15,20,0.75)" />
  <text x="${badgeX + badgeW / 2}" y="${badgeY + badgeH * 0.42}" font-family="monospace" font-size="${labelSize}" font-weight="bold" fill="rgba(200,212,224,0.7)" text-anchor="middle" letter-spacing="2">EOS INDEX</text>
  <text x="${badgeX + badgeW / 2}" y="${badgeY + badgeH * 0.82}" font-family="monospace" font-size="${fontSize}" font-weight="bold" fill="#F0A500" text-anchor="middle">${score}</text>
</svg>`);
}

/**
 * Also create a "thezorafiles.com" watermark at the bottom-left
 */
function brandOverlay(width, height) {
  const fontSize = Math.round(width * 0.018);
  const x = Math.round(width * 0.04);
  const y = height - Math.round(height * 0.04);

  return Buffer.from(`<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <text x="${x}" y="${y}" font-family="monospace" font-size="${fontSize}" fill="rgba(240,165,0,0.6)" letter-spacing="1.5">thezorafiles.com/finding-zora/archives</text>
</svg>`);
}

async function exportPhoto(entry, index) {
  const srcPath = path.join(ARCHIVES_DIR, entry.filename);
  if (!fs.existsSync(srcPath)) {
    console.log(`  SKIP: ${entry.filename} not found in archives`);
    return;
  }

  const score = entry.scores.eos_total;
  const rank = index + 1;

  for (const platform of PLATFORMS) {
    const outDir = path.join(SOCIAL_DIR, platform.dir);
    fs.mkdirSync(outDir, { recursive: true });

    const outName = `${rank}-eos${score}-${platform.name}.jpg`;
    const outPath = path.join(outDir, outName);

    try {
      const base = sharp(srcPath)
        .resize(platform.width, platform.height, {
          fit: "cover",
          position: "attention", // smart crop focusing on interesting area
        });

      // Composite score badge and brand watermark
      const scoreSvg = scoreOverlay(score, platform.width, platform.height);
      const brandSvg = brandOverlay(platform.width, platform.height);

      await base
        .composite([
          { input: scoreSvg, top: 0, left: 0 },
          { input: brandSvg, top: 0, left: 0 },
        ])
        .jpeg({ quality: 92 })
        .toFile(outPath);

      console.log(`  ${platform.name}: ${outName}`);
    } catch (err) {
      console.log(`  ERROR ${platform.name}: ${err.message}`);
    }
  }
}

async function main() {
  console.log(`Exporting top ${top5.length} photos for ${PLATFORMS.length} platforms...\n`);

  for (let i = 0; i < top5.length; i++) {
    const entry = top5[i];
    console.log(`[${i + 1}/${top5.length}] ${entry.filename} — Eos ${entry.scores.eos_total}`);
    await exportPhoto(entry, i);
    console.log();
  }

  console.log("Done! Files saved to:");
  for (const p of PLATFORMS) {
    console.log(`  social/${p.dir}/`);
  }

  console.log("\nDimensions:");
  for (const p of PLATFORMS) {
    console.log(`  ${p.name}: ${p.width}x${p.height}`);
  }
}

main().catch(console.error);
