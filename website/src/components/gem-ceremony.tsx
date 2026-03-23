"use client";

import { useRef, useEffect, useState } from "react";
import { MedallionCanvas, type MedallionHandle } from "./medallion-canvas";
import { LEVELS } from "@/lib/types";

interface GemCeremonyProps {
  level: number;
  gemsBeforeThisExpedition: number;
  totalExpeditionsAfter: number;
  episodeTitle: string;
  eosTotal: number;
  streakEarned: boolean;
  onClose: () => void;
}

export function GemCeremony({
  level,
  gemsBeforeThisExpedition,
  totalExpeditionsAfter,
  episodeTitle,
  eosTotal,
  streakEarned,
  onClose,
}: GemCeremonyProps) {
  const medallionRef = useRef<MedallionHandle>(null);
  const [phase, setPhase] = useState<
    "waiting" | "gem" | "complete" | "streak" | "done"
  >("waiting");
  const currentLevel = LEVELS[Math.min(level, 10)];
  const gemsAfter = gemsBeforeThisExpedition + 1;
  const isLevelUp = gemsAfter >= 6;

  useEffect(() => {
    const timer = setTimeout(async () => {
      setPhase("gem");
      if (medallionRef.current) {
        await medallionRef.current.placeGem();
      }

      if (isLevelUp) {
        setPhase("complete");
        // Pause to let the completion sink in
        await new Promise((r) => setTimeout(r, 1500));

        if (streakEarned && medallionRef.current) {
          setPhase("streak");
          await medallionRef.current.applyStreak();
          await new Promise((r) => setTimeout(r, 800));
        }
      }

      setPhase("done");
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  const statusText = () => {
    switch (phase) {
      case "waiting":
        return "expedition logged";
      case "gem":
        return `gem ${gemsAfter} of 6`;
      case "complete":
        return `${currentLevel.title} medallion earned`;
      case "streak":
        return "streak crown earned";
      case "done":
        if (streakEarned && isLevelUp)
          return `${currentLevel.title} · streak crown`;
        if (isLevelUp) return `${currentLevel.title} medallion earned`;
        return `gem ${gemsAfter} of 6 placed`;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-pre-dawn/90 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-6 p-8 max-w-md text-center">
        {/* Status text */}
        <p className="text-xs text-dawn-mist/40 tracking-wider uppercase">
          {statusText()}
        </p>

        {/* Medallion */}
        <div className="relative">
          <MedallionCanvas
            ref={medallionRef}
            level={level}
            gems={gemsBeforeThisExpedition}
            size={280}
            animated
          />
        </div>

        {/* Episode info */}
        <div>
          <p className="font-display text-lg text-zora-amber">
            &ldquo;{episodeTitle}&rdquo;
          </p>
          <p className="font-mono text-eos-teal text-sm mt-1">
            Eos Index: {eosTotal}
          </p>
        </div>

        {/* Level progress */}
        <div className="w-full max-w-xs">
          <div className="flex justify-between text-xs text-dawn-mist/40 mb-1">
            <span>
              Level {level} · {currentLevel.title}
            </span>
            <span>{gemsAfter}/6</span>
          </div>
          <div className="h-2 rounded-full bg-dawn-mist/10">
            <div
              className="h-full rounded-full bg-zora-amber transition-all duration-1000"
              style={{ width: `${(gemsAfter / 6) * 100}%` }}
            />
          </div>
        </div>

        {/* Streak indicator */}
        {streakEarned && isLevelUp && phase === "done" && (
          <p className="text-xs text-zora-amber/70">
            All 6 expeditions within 6 weeks. Streak crown earned
          </p>
        )}

        {/* Close button */}
        {phase === "done" && (
          <button
            onClick={onClose}
            className="mt-2 rounded-full border border-dawn-mist/20 px-8 py-2.5 text-sm text-dawn-mist/60 hover:border-dawn-mist/40 transition-colors"
          >
            continue
          </button>
        )}
      </div>
    </div>
  );
}
