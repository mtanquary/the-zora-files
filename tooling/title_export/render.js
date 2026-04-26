// Render 96 transparent PNG frames of the Finding Zora title card animation.
// Each frame is 1920×1080 — one frame at 24fps for 4.0s total.

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');

const HERE         = __dirname;
const HTML_PATH    = path.join(HERE, 'finding_zora_title.html');
const FRAMES_DIR   = path.join(HERE, 'frames');
const TOTAL_FRAMES = 96;
const W = 1920, H = 1080;

async function main() {
  if (!fs.existsSync(HTML_PATH)) {
    throw new Error(`HTML not found at ${HTML_PATH}`);
  }
  fs.mkdirSync(FRAMES_DIR, { recursive: true });

  // Wipe stale frames so a re-run yields a clean set.
  for (const f of fs.readdirSync(FRAMES_DIR)) {
    if (f.startsWith('frame_') && f.endsWith('.png')) {
      fs.unlinkSync(path.join(FRAMES_DIR, f));
    }
  }

  console.log('Launching headless Chrome…');
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--allow-file-access-from-files',
      '--disable-web-security',
      '--no-sandbox',
    ],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });

    const url = pathToFileURL(HTML_PATH).href;
    console.log(`Loading ${url}`);
    await page.goto(url, { waitUntil: 'networkidle0' });

    // Wait for fonts to actually load before rendering any frame —
    // otherwise the first frames render with fallback fonts.
    await page.waitForFunction(
      () => window.__titleReady === true && typeof window.renderFrameAt === 'function',
      { timeout: 15000 }
    );

    // Sanity check: confirm all expected display fonts loaded (vs silent fallback).
    const REQUIRED = ['Cinzel Decorative', 'Cinzel', 'Crimson Text', 'Space Mono'];
    const fontsLoaded = await page.evaluate(() => {
      return [...document.fonts].map(f => f.family);
    });
    const missing = REQUIRED.filter(req => !fontsLoaded.some(f => f.includes(req)));
    console.log('Fonts loaded:', [...new Set(fontsLoaded)]);
    if (missing.length > 0) {
      console.warn(`WARN: missing fonts — output will use fallbacks: ${missing.join(', ')}`);
    }

    console.log(`Rendering ${TOTAL_FRAMES} frames → ${FRAMES_DIR}`);
    for (let n = 0; n < TOTAL_FRAMES; n++) {
      await page.evaluate((frame) => window.renderFrameAt(frame), n);
      // Let the browser flush a paint tick.
      await page.evaluate(() => new Promise(requestAnimationFrame));

      const outPath = path.join(FRAMES_DIR, `frame_${String(n).padStart(4, '0')}.png`);
      await page.screenshot({
        path: outPath,
        type: 'png',
        omitBackground: true,
        clip: { x: 0, y: 0, width: W, height: H },
      });

      if (n % 12 === 0 || n === TOTAL_FRAMES - 1) {
        console.log(`  frame ${String(n).padStart(2)} / ${TOTAL_FRAMES - 1}`);
      }
    }

    console.log('Done. Frames written to', FRAMES_DIR);
  } finally {
    await browser.close();
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
