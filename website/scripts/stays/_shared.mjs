/**
 * Shared helpers for the stays scripts (seed + load).
 * Loads website/.env.local without a dotenv dependency. Variables already
 * set in the real environment win, so you can point a run at another DB:
 *   DATABASE_URL=postgresql://... node scripts/stays/load-lookouts.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.join(__dirname, "..", "..");
export const DATA_DIR = path.join(ROOT, "data", "stays");

export function loadEnv() {
  const envPath = path.join(ROOT, ".env.local");
  if (!fs.existsSync(envPath)) return;
  for (const raw of fs.readFileSync(envPath, "utf-8").split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq < 0) continue;
    const key = line.slice(0, eq).trim();
    if (process.env[key] === undefined) process.env[key] = line.slice(eq + 1).trim();
  }
}

/** Identifiable user agent for every outbound request. */
export const USER_AGENT =
  "TheZoraFiles-LookoutFinder/1.0 (+https://thezorafiles.com/lookouts)";

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** GET with UA, timeout, and simple exponential back-off on 429/5xx. */
export async function politeFetch(url, { headers = {}, tries = 3, timeoutMs = 20000 } = {}) {
  let delay = 4000;
  for (let attempt = 1; attempt <= tries; attempt++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": USER_AGENT, Accept: "application/json, text/html", ...headers },
        signal: ctrl.signal,
      });
      if (res.status === 429 || res.status >= 500) {
        if (attempt === tries) return res;
        console.warn(`  ${res.status} from ${new URL(url).host}, backing off ${delay / 1000}s`);
        await sleep(delay);
        delay *= 2;
        continue;
      }
      return res;
    } catch (err) {
      if (attempt === tries) throw err;
      console.warn(`  network error (${err.message}), backing off ${delay / 1000}s`);
      await sleep(delay);
      delay *= 2;
    } finally {
      clearTimeout(timer);
    }
  }
  throw new Error("unreachable");
}
