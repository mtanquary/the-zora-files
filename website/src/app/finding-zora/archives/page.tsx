import type { Metadata } from "next";
import fs from "fs";
import path from "path";
import { Ornament, Stars } from "@/components/atmosphere";
import { ArchiveGallery } from "./archive-gallery";

export const metadata: Metadata = { title: "sunrise archives" };

interface ArchiveEntry {
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
  vibe: string | null;
}

function getArchiveData(): ArchiveEntry[] {
  try {
    const dataPath = path.join(process.cwd(), "public/archives/archive-data.json");
    if (!fs.existsSync(dataPath)) return [];
    return JSON.parse(fs.readFileSync(dataPath, "utf-8"));
  } catch {
    return [];
  }
}

export default function ArchivesPage() {
  const entries = getArchiveData();
  const withGps = entries.filter((e) => e.lat && e.lng);

  // Stats
  const avgEos = entries.length > 0
    ? Math.round(entries.reduce((s, e) => s + e.scores.eos_total, 0) / entries.length)
    : 0;
  const topScore = entries.length > 0 ? entries[0].scores.eos_total : 0;
  const dateRange = entries.filter((e) => e.taken_at).map((e) => new Date(e.taken_at!));
  const earliest = dateRange.length > 0
    ? dateRange.reduce((a, b) => (a < b ? a : b))
    : null;
  const latest = dateRange.length > 0
    ? dateRange.reduce((a, b) => (a > b ? a : b))
    : null;

  return (
    <div>
      {/* Header */}
      <section className="relative overflow-hidden px-6 py-16 text-center border-b border-rule">
        <Stars />
        <div className="relative z-10">
          <p className="font-mono text-[0.65rem] tracking-[0.35em] text-zora-amber uppercase opacity-75 mb-4">
            finding zora
          </p>
          <h1
            className="font-display-ornate text-zora-amber font-bold mb-2"
            style={{ fontSize: "clamp(1.8rem, 5vw, 3rem)", textShadow: "0 0 50px rgba(240,165,0,0.25)" }}
          >
            Sunrise archives
          </h1>
          <p className="font-display text-dawn-mist text-sm tracking-[0.15em]">
            every sunrise scored, before the show began
          </p>
        </div>
      </section>

      <div className="max-w-[960px] mx-auto px-8 pb-16">
        {/* Stats bar */}
        <Ornament label="The collection" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <div className="bg-pre-dawn-mid border border-rule rounded-md p-4 text-center">
            <p className="font-mono text-2xl font-bold text-zora-amber">{entries.length}</p>
            <p className="font-mono text-[0.6rem] text-mist-dim uppercase tracking-wider">sunrises</p>
          </div>
          <div className="bg-pre-dawn-mid border border-rule rounded-md p-4 text-center">
            <p className="font-mono text-2xl font-bold text-teal-light">{topScore}</p>
            <p className="font-mono text-[0.6rem] text-mist-dim uppercase tracking-wider">top eos</p>
          </div>
          <div className="bg-pre-dawn-mid border border-rule rounded-md p-4 text-center">
            <p className="font-mono text-2xl font-bold text-dawn-mist">{avgEos}</p>
            <p className="font-mono text-[0.6rem] text-mist-dim uppercase tracking-wider">avg eos</p>
          </div>
          <div className="bg-pre-dawn-mid border border-rule rounded-md p-4 text-center">
            <p className="font-mono text-lg font-bold text-dawn-mist">
              {earliest ? `${earliest.getFullYear()}` : ""}
              {earliest && latest && earliest.getFullYear() !== latest.getFullYear()
                ? `–${latest.getFullYear()}`
                : ""}
            </p>
            <p className="font-mono text-[0.6rem] text-mist-dim uppercase tracking-wider">date range</p>
          </div>
        </div>

        {/* Map section (only if GPS data exists) */}
        {withGps.length > 0 && (
          <>
            <Ornament label="Map" />
            <div className="bg-pre-dawn-mid border border-rule rounded-md p-4 mb-8">
              <iframe
                width="100%"
                height="400"
                style={{ border: 0, borderRadius: 8 }}
                loading="lazy"
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${Math.min(...withGps.map((e) => e.lng!)) - 0.1},${Math.min(...withGps.map((e) => e.lat!)) - 0.1},${Math.max(...withGps.map((e) => e.lng!)) + 0.1},${Math.max(...withGps.map((e) => e.lat!)) + 0.1}&layer=mapnik`}
              />
              <p className="font-mono text-[0.6rem] text-mist-dim/40 mt-2">
                {withGps.length} sunrise{withGps.length !== 1 ? "s" : ""} with location data
              </p>
            </div>
          </>
        )}

        {/* Gallery */}
        <Ornament label="Gallery" />
        <p className="text-mist-dim text-sm mb-6">
          Sorted by Eos Index score. These are the sunrises that started it all,
          scored retroactively.
        </p>

        <ArchiveGallery entries={entries} />
      </div>
    </div>
  );
}
