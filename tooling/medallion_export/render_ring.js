// Render the 10 progression medallions in their EARNED state and composite
// them into a 1920×1080 transparent PNG ring centered on (960, 540).

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const { pathToFileURL } = require('url');

const HERE       = __dirname;
const ARTIFACTS  = path.resolve(HERE, '..', '..', 'website', 'public', 'artifacts');
const FRAMES_DIR = path.join(HERE, 'frames');
const OUTPUT     = path.resolve(HERE, '..', '..', 'brand', 'video', 'intros', 'ten_medallion_ring.png');

// Position 0 starts at 12 o'clock and walks clockwise through the level order.
const RING = [
  { level: 0, file: 'scout_medallion.html',          name: 'scout'          },
  { level: 1, file: 'trailhead_medallion.html',      name: 'trailhead'      },
  { level: 2, file: 'desert_fox_medallion.html',     name: 'desert_fox'     },
  { level: 3, file: 'dawnchaser_medallion.html',     name: 'dawnchaser'     },
  { level: 4, file: 'first_light_medallion.html',    name: 'first_light'    },
  { level: 5, file: 'horizon_hunter_medallion.html', name: 'horizon_hunter' },
  { level: 6, file: 'zora_seeker_medallion.html',    name: 'zora_seeker'    },
  { level: 7, file: 'dawn_keeper_medallion.html',    name: 'dawn_keeper'    },
  { level: 8, file: 'eos_adept_medallion.html',      name: 'eos_adept'      },
  { level: 9, file: 'zora_master_medallion.html',    name: 'zora_master'    },
];

const FRAME_W      = 1920;
const FRAME_H      = 1080;
const CENTER_X     = FRAME_W / 2;   // 960
const CENTER_Y     = FRAME_H / 2;   // 540
const RING_RADIUS  = 410;           // distance from frame center to medallion center
const TILE_PX      = 150;           // resized medallion size (post-trim)

// Drives a medallion to its EARNED state, then returns its canvas as a PNG buffer.
//   - All 6 gems set
//   - Etch and emblem fully revealed (any "*A" alpha field set to 1)
//   - No streak crown
// For Scout (Level 0) there's no `st` object — its render() always draws the
// full token, so we just capture whatever was painted on load.
async function captureMedallion(page, htmlPath) {
  const url = pathToFileURL(htmlPath).href;
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForSelector('canvas#coin');

  const dataUrl = await page.evaluate(() => {
    if (typeof st !== 'undefined' && st && typeof st === 'object') {
      st.g = 6;
      st.done = true;
      st.etch = 1;
      st.streak = false;
      st.sg = 0;
      st.gl = 0;
      st.fg = -1;
      st.ft = 0;
      st.singIdx = -1;
      st.singT = 0;
      // Any emblem-alpha key (foxA, sunA, crownA, eyeA, cairnA, …)
      for (const k of Object.keys(st)) {
        if (/[a-z]+A$/.test(k) && typeof st[k] === 'number') st[k] = 1;
      }
      if (typeof render === 'function') render();
    }
    const canvas = document.getElementById('coin');
    return canvas.toDataURL('image/png');
  });

  return Buffer.from(dataUrl.split(',')[1], 'base64');
}

async function main() {
  fs.mkdirSync(FRAMES_DIR, { recursive: true });
  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });

  console.log('Launching headless Chrome…');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--allow-file-access-from-files', '--no-sandbox'],
  });

  const rawBuffers = [];
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 600, height: 600, deviceScaleFactor: 1 });

    for (const m of RING) {
      const htmlPath = path.join(ARTIFACTS, m.file);
      if (!fs.existsSync(htmlPath)) {
        throw new Error(`Missing medallion HTML: ${htmlPath}`);
      }
      console.log(`  L${m.level} ${m.name}…`);
      const buf = await captureMedallion(page, htmlPath);
      const outPath = path.join(FRAMES_DIR, `ring_L${String(m.level).padStart(2, '0')}_${m.name}.png`);
      fs.writeFileSync(outPath, buf);
      rawBuffers.push(buf);
    }
  } finally {
    await browser.close();
  }

  // Trim each capture to the medallion's bounding box (the 520² canvas has
  // empty corners), then resize to TILE_PX. fit:'contain' preserves aspect
  // ratio, padding to square with transparent pixels.
  console.log(`Trimming + resizing each to ${TILE_PX}px…`);
  const tiles = await Promise.all(rawBuffers.map(b =>
    sharp(b)
      .trim()
      .resize(TILE_PX, TILE_PX, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toBuffer()
  ));

  const composites = tiles.map((buf, i) => {
    // Walk clockwise from 12 o'clock.
    const angle = -Math.PI / 2 + i * (2 * Math.PI / RING.length);
    const cx    = CENTER_X + RING_RADIUS * Math.cos(angle);
    const cy    = CENTER_Y + RING_RADIUS * Math.sin(angle);
    return {
      input: buf,
      left:  Math.round(cx - TILE_PX / 2),
      top:   Math.round(cy - TILE_PX / 2),
    };
  });

  console.log(`Compositing ${RING.length} medallions onto ${FRAME_W}×${FRAME_H} transparent canvas…`);
  await sharp({
    create: {
      width: FRAME_W,
      height: FRAME_H,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite(composites)
    .png()
    .toFile(OUTPUT);

  console.log(`Wrote ${OUTPUT}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
