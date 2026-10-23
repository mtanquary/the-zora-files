import fs from "fs";
import path from "path";

/** One retroactively scored sunrise photo from public/archives. */
export interface ArchiveEntry {
  filename: string;
  taken_at: string | null;
  camera: string | null;
  lat: number | null;
  lng: number | null;
  location_name: string | null;
  scores: {
    sky: { color_intensity: number; cloud_engagement: number; horizon_definition: number };
    setting: { foreground_composition: number; location_uniqueness: number };
    conditions: { access_difficulty: number; weather_challenge: number };
    sky_total: number;
    setting_total: number;
    conditions_total: number;
    eos_total: number;
  };
  /** AI mood line from scoring. Used only as alt text, never shown on the page. */
  vibe: string | null;
  /** Your caption: place, month and year, one true thing. Shown on the site. */
  caption?: string | null;
  /** Display size in pixels, written by scripts/archive-dimensions.mjs. */
  width?: number;
  height?: number;
}

/** Reads public/archives/archive-data.json (sorted best Eos first). Server-only. */
export function getArchiveEntries(): ArchiveEntry[] {
  try {
    const dataPath = path.join(process.cwd(), "public/archives/archive-data.json");
    if (!fs.existsSync(dataPath)) return [];
    return JSON.parse(fs.readFileSync(dataPath, "utf-8"));
  } catch {
    return [];
  }
}

export function archiveImageUrl(entry: Pick<ArchiveEntry, "filename">): string {
  return `/archives/${entry.filename}`;
}
