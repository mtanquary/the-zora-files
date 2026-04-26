// Render 60 transparent PNG frames of the Desert Fox medallion animation.
// Each frame is 1080x1080 and represents one frame at 24fps (60 frames = 2.5s).

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');

const HERE       = __dirname;
const HTML_PATH  = path.join(HERE, 'medallion_for_export.html');
const FRAMES_DIR = path.join(HERE, 'frames');
const TOTAL_FRAMES = 60;
const SIZE = 1080;

async function main() {
  if (!fs.existsSync(HTML_PATH)) {
    throw new Error(`HTML not found at ${HTML_PATH}`);
  }
  fs.mkdirSync(FRAMES_DIR, { recursive: true });

  // Wipe any stale frames so a re-run yields a clean set
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
    await page.setViewport({ width: SIZE, height: SIZE, deviceScaleFactor: 1 });

    // Transparent page background — required for omitBackground screenshots
    await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'dark' }]);

    const url = pathToFileURL(HTML_PATH).href;
    console.log(`Loading ${url}`);
    await page.goto(url, { waitUntil: 'load' });

    // Confirm the page exposed renderFrameAt()
    await page.waitForFunction(() => window.__medallionReady === true && typeof window.renderFrameAt === 'function', { timeout: 5000 });

    console.log(`Rendering ${TOTAL_FRAMES} frames → ${FRAMES_DIR}`);
    for (let n = 0; n < TOTAL_FRAMES; n++) {
      await page.evaluate((frame) => {
        window.renderFrameAt(frame);
      }, n);

      // Let the browser complete a paint tick so the canvas bitmap reflects
      // the new state before we screenshot.
      await page.evaluate(() => new Promise(requestAnimationFrame));

      const outPath = path.join(FRAMES_DIR, `frame_${String(n).padStart(4, '0')}.png`);
      await page.screenshot({
        path: outPath,
        type: 'png',
        omitBackground: true,
        clip: { x: 0, y: 0, width: SIZE, height: SIZE },
      });

      if (n % 10 === 0 || n === TOTAL_FRAMES - 1) {
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
