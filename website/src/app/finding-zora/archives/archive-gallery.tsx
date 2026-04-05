"use client";

import { useState } from "react";

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

function eosColor(score: number): string {
  if (score >= 80) return "text-teal-light";
  if (score >= 70) return "text-zora-amber";
  if (score >= 60) return "text-sunrise-orange";
  return "text-mist-dim";
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function ArchiveGallery({ entries }: { entries: ArchiveEntry[] }) {
  const [selected, setSelected] = useState<ArchiveEntry | null>(null);

  return (
    <>
      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {entries.map((entry) => (
          <button
            key={entry.filename}
            onClick={() => setSelected(entry)}
            className="group relative overflow-hidden rounded-md border border-rule hover:border-zora-amber/40 transition-colors bg-pre-dawn-mid aspect-[4/3]"
          >
            <img
              src={`/archives/${entry.filename}`}
              alt={entry.vibe || "Sunrise"}
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
              loading="lazy"
            />
            {/* Score overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
              <div className="flex items-end justify-between">
                <div>
                  {entry.taken_at && (
                    <p className="font-mono text-[0.55rem] text-dawn-mist/70">
                      {formatDate(entry.taken_at)}
                    </p>
                  )}
                  {entry.location_name && (
                    <p className="font-mono text-[0.55rem] text-dawn-mist/50 truncate max-w-[140px]">
                      {entry.location_name}
                    </p>
                  )}
                </div>
                <span className={`font-mono text-lg font-bold ${eosColor(entry.scores.eos_total)}`}>
                  {entry.scores.eos_total}
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Detail modal */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-pre-dawn border border-rule rounded-lg max-w-[700px] w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={`/archives/${selected.filename}`}
              alt={selected.vibe || "Sunrise"}
              className="w-full rounded-t-lg"
            />
            <div className="p-6 space-y-4">
              {/* Vibe */}
              {selected.vibe && (
                <p className="text-dawn-mist italic">{selected.vibe}</p>
              )}

              {/* Meta */}
              <div className="flex flex-wrap gap-4 text-xs text-mist-dim">
                {selected.taken_at && (
                  <span>{formatDate(selected.taken_at)}</span>
                )}
                {selected.location_name && (
                  <span>{selected.location_name}</span>
                )}
                {selected.camera && <span>{selected.camera}</span>}
              </div>

              {/* Eos breakdown */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-pre-dawn-mid border border-rule rounded-md p-3 text-center">
                  <p className="font-mono text-[0.6rem] text-mist-dim uppercase tracking-wider mb-1">
                    sky
                  </p>
                  <p className="font-mono text-xl font-bold text-teal-light">
                    {selected.scores.sky_total}
                    <span className="text-mist-dim/40 text-sm">/50</span>
                  </p>
                  <div className="mt-2 space-y-0.5 text-left">
                    <ScoreRow label="color" score={selected.scores.sky.color_intensity} max={20} />
                    <ScoreRow label="clouds" score={selected.scores.sky.cloud_engagement} max={15} />
                    <ScoreRow label="horizon" score={selected.scores.sky.horizon_definition} max={15} />
                  </div>
                </div>
                <div className="bg-pre-dawn-mid border border-rule rounded-md p-3 text-center">
                  <p className="font-mono text-[0.6rem] text-mist-dim uppercase tracking-wider mb-1">
                    setting
                  </p>
                  <p className="font-mono text-xl font-bold text-teal-light">
                    {selected.scores.setting_total}
                    <span className="text-mist-dim/40 text-sm">/30</span>
                  </p>
                  <div className="mt-2 space-y-0.5 text-left">
                    <ScoreRow label="foreground" score={selected.scores.setting.foreground_composition} max={15} />
                    <ScoreRow label="uniqueness" score={selected.scores.setting.location_uniqueness} max={15} />
                  </div>
                </div>
                <div className="bg-pre-dawn-mid border border-rule rounded-md p-3 text-center">
                  <p className="font-mono text-[0.6rem] text-mist-dim uppercase tracking-wider mb-1">
                    conditions
                  </p>
                  <p className="font-mono text-xl font-bold text-teal-light">
                    {selected.scores.conditions_total}
                    <span className="text-mist-dim/40 text-sm">/20</span>
                  </p>
                  <div className="mt-2 space-y-0.5 text-left">
                    <ScoreRow label="access" score={selected.scores.conditions.access_difficulty} max={10} />
                    <ScoreRow label="weather" score={selected.scores.conditions.weather_challenge} max={10} />
                  </div>
                </div>
              </div>

              {/* Total */}
              <div className="text-center pt-2 border-t border-rule">
                <p className="font-mono text-[0.6rem] text-mist-dim uppercase tracking-wider mb-1">
                  eos index
                </p>
                <p className={`font-mono text-3xl font-bold ${eosColor(selected.scores.eos_total)}`}>
                  {selected.scores.eos_total}
                  <span className="text-mist-dim/40 text-lg">/100</span>
                </p>
              </div>

              <button
                onClick={() => setSelected(null)}
                className="w-full rounded-md border border-rule px-4 py-2 text-sm text-mist-dim hover:border-zora-amber/40 transition-colors"
              >
                close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ScoreRow({ label, score, max }: { label: string; score: number; max: number }) {
  const pct = (score / max) * 100;
  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-[0.5rem] text-mist-dim/60 w-16 text-right">{label}</span>
      <div className="flex-1 h-1 bg-pre-dawn-light rounded-full overflow-hidden">
        <div
          className="h-full bg-teal-light/60 rounded-full"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="font-mono text-[0.5rem] text-mist-dim/60 w-8">{score}/{max}</span>
    </div>
  );
}
