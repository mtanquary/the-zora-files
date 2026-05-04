"use client";

import { useRef, useState } from "react";
import { GemCeremony } from "@/components/gem-ceremony";
import { FirstExpeditionCeremony } from "@/components/first-expedition-ceremony";
import { LEVELS } from "@/lib/types";

type Mode = "gem-ceremony" | "first-expedition";

export default function FanfareTestPage() {
  const [running, setRunning] = useState<{
    key: number;
    mode: Mode;
    level: number;
    streak: boolean;
  } | null>(null);
  const counterRef = useRef(0);

  const launch = (level: number, streak: boolean) => {
    counterRef.current += 1;
    setRunning({ key: counterRef.current, mode: "gem-ceremony", level, streak });
  };

  const launchFirstExpedition = () => {
    counterRef.current += 1;
    setRunning({ key: counterRef.current, mode: "first-expedition", level: 1, streak: false });
  };

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-display text-3xl font-bold text-zora-amber mb-2">fanfare test</h1>
      <p className="text-dawn-mist/60 mb-8">
        Triggers <code>GemCeremony</code> with simulated gem 6 of 6 so the level-up fanfare plays.
        Pick a target level — that determines the medallion shown after the fanfare. This page is dev-only.
      </p>

      {/* First-expedition (Scout → Trailhead training graduation) — the very first
          episode the player ever logs. Scout fades out, Trailhead rises in,
          gem 1 of Trailhead is placed. */}
      <button
        onClick={launchFirstExpedition}
        className="block w-full mb-8 rounded-xl border-2 border-zora-amber/40 bg-zora-amber/5 p-5 text-left hover:border-zora-amber hover:bg-zora-amber/10 transition-colors"
      >
        <p className="font-mono text-xs text-zora-amber uppercase tracking-wider">
          first episode · scout → trailhead
        </p>
        <p className="font-display text-base text-zora-amber mt-1">
          training graduation
        </p>
        <p className="text-xs text-dawn-mist/60 mt-1">
          Scout fades out, Trailhead rises in, gem 1 placed. The very first ceremony.
        </p>
      </button>

      <div className="flex items-baseline justify-between mb-3">
        <p className="text-xs text-dawn-mist/40 uppercase tracking-wider">
          medallion awakenings (gem 6 placement)
        </p>
        <p className="text-[0.6rem] text-dawn-mist/40 uppercase tracking-wider">
          regular click · awakening only · shift+click · with streak crown
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 mb-8">
        {LEVELS.slice(1).map((l) => (
          <button
            key={l.level}
            onClick={(e) => launch(l.level, e.shiftKey)}
            className="rounded-xl border border-dawn-mist/15 bg-dawn-mist/5 p-4 text-left hover:border-zora-amber/40 hover:bg-zora-amber/5 transition-colors"
          >
            <p className="font-mono text-xs text-zora-amber/60">level {l.level}</p>
            <p className="font-display text-sm text-dawn-mist mt-1">{l.title}</p>
            <p className="font-mono text-[0.55rem] text-dawn-mist/40 mt-2">
              hold shift to add streak crown
            </p>
          </button>
        ))}
      </div>

      {running?.mode === "gem-ceremony" && (
        <GemCeremony
          key={running.key}
          level={running.level}
          gemsBeforeThisExpedition={5}
          totalExpeditionsAfter={LEVELS[running.level].expeditions}
          episodeTitle="Test expedition"
          eosTotal={87}
          streakEarned={running.streak}
          onClose={() => setRunning(null)}
        />
      )}

      {running?.mode === "first-expedition" && (
        <FirstExpeditionCeremony
          key={running.key}
          episodeTitle="Test expedition"
          eosTotal={87}
          onClose={() => setRunning(null)}
        />
      )}
    </div>
  );
}
