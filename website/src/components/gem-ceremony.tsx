"use client";

import { useRef, useEffect, useState } from "react";
import { MedallionCanvas, type MedallionHandle } from "./medallion-canvas";
import { MedallionFanfare } from "./medallion-fanfare";
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

type Phase =
  | "waiting"
  | "gem"
  | "fanfare"
  | "complete"
  | "streak"
  | "next-reveal"
  | "done";

export function GemCeremony({
  level,
  gemsBeforeThisExpedition,
  totalExpeditionsAfter,
  episodeTitle,
  eosTotal,
  streakEarned,
  onClose,
}: GemCeremonyProps) {
  void totalExpeditionsAfter;
  const medallionRef = useRef<MedallionHandle>(null);
  const [phase, setPhase] = useState<Phase>("waiting");
  const fanfareDone = useRef(false);
  const currentLevel = LEVELS[Math.min(level, 10)];
  const gemsAfter = gemsBeforeThisExpedition + 1;
  const isLevelUp = gemsAfter >= 6;
  // Placing gem 6 *completes* the current medallion and *earns* the next one
  // (empty — its gems are filled one expedition at a time). The exception is
  // the very first expedition (Scout → Trailhead), which is handled by
  // FirstExpeditionCeremony and includes gem 1 placement.
  const hasNextMedal = isLevelUp && level < 10;
  const nextMedalLevel = hasNextMedal ? LEVELS[level + 1] : null;

  useEffect(() => {
    const timer = setTimeout(async () => {
      setPhase("gem");
      if (medallionRef.current) {
        await medallionRef.current.placeGem();
      }

      if (isLevelUp) {
        setPhase("fanfare");
        // Wait for fanfare to finish (signaled by onComplete callback)
        await new Promise<void>((resolve) => {
          const check = () => {
            if (fanfareDone.current) resolve();
            else setTimeout(check, 100);
          };
          check();
        });
        setPhase("complete");

        if (streakEarned && medallionRef.current) {
          setPhase("streak");
          await medallionRef.current.applyStreak();
          await new Promise((r) => setTimeout(r, 800));
        }

        // Brief beat to let the completed medallion sit before introducing the next
        await new Promise((r) => setTimeout(r, 1200));

        if (hasNextMedal) {
          setPhase("next-reveal");
          playNextMedalChord();
          // Hold long enough for the next medallion to rise in and the
          // viewer to read the title before the continue button appears
          await new Promise((r) => setTimeout(r, 3800));
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
      case "fanfare":
        return `${currentLevel.title} complete`;
      case "complete":
        return `${currentLevel.title} complete`;
      case "streak":
        return "streak crown earned";
      case "next-reveal":
        return nextMedalLevel
          ? `${nextMedalLevel.title} earned`
          : "next chapter";
      case "done":
        if (streakEarned && isLevelUp)
          return `${currentLevel.title} · streak crown`;
        if (isLevelUp && nextMedalLevel)
          return `${currentLevel.title} complete · ${nextMedalLevel.title} earned`;
        if (isLevelUp) return `${currentLevel.title} complete`;
        return `gem ${gemsAfter} of 6 placed`;
    }
  };

  const showNextMedal = phase === "next-reveal";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-pre-dawn/90 backdrop-blur-sm overflow-hidden">
      {/* Inline keyframes for the next-medal reveal */}
      <style>{`
        @keyframes zf-next-glow {
          0% { opacity: 0; transform: scale(0.4); }
          60% { opacity: 0.55; transform: scale(1.1); }
          100% { opacity: 0.35; transform: scale(1); }
        }
        @keyframes zf-next-medal-rise {
          0% { opacity: 0; transform: translateY(40px) scale(0.8); filter: blur(8px); }
          100% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
        }
        @keyframes zf-next-text-fade {
          0% { opacity: 0; transform: translateY(8px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Fanfare overlay during level-up */}
      {phase === "fanfare" && (
        <MedallionFanfare
          level={level}
          onComplete={() => {
            fanfareDone.current = true;
          }}
        />
      )}

      {/* Soft amber glow behind the next medallion during the reveal */}
      {showNextMedal && (
        <div
          className="absolute pointer-events-none"
          style={{
            width: 480,
            height: 480,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(240,165,0,0.45) 0%, rgba(232,82,10,0.18) 40%, transparent 70%)",
            animation: "zf-next-glow 2.4s cubic-bezier(0.2, 0.7, 0.3, 1) forwards",
            filter: "blur(4px)",
          }}
        />
      )}

      <div className="relative z-10 flex flex-col items-center gap-6 p-8 max-w-md text-center">
        {/* Status text */}
        <p
          className={`text-xs tracking-wider uppercase transition-colors duration-500 ${
            phase === "fanfare" || phase === "next-reveal"
              ? "text-zora-amber/90"
              : "text-dawn-mist/40"
          }`}
        >
          {statusText()}
        </p>

        {/* Medallion stack — current and next render together with crossfade */}
        <div className="relative" style={{ width: 280, height: 280 }}>
          {/* Just-completed medallion (visible during gem/fanfare/complete/streak) */}
          <div
            className={`absolute inset-0 transition-all duration-700 ease-out ${
              phase === "fanfare" ? "scale-110" : "scale-100"
            } ${showNextMedal ? "opacity-0 -translate-y-6 scale-90" : "opacity-100"}`}
          >
            <MedallionCanvas
              ref={medallionRef}
              level={level}
              gems={gemsBeforeThisExpedition}
              size={280}
              animated
            />
          </div>

          {/* Next-chapter medallion (visible during next-reveal phase) — empty,
              gems are earned one expedition at a time after this. */}
          {hasNextMedal && (
            <div
              className="absolute inset-0"
              style={{
                opacity: showNextMedal ? 1 : 0,
                animation: showNextMedal
                  ? "zf-next-medal-rise 1.2s cubic-bezier(0.2, 0.7, 0.3, 1) forwards"
                  : undefined,
                pointerEvents: showNextMedal ? "auto" : "none",
              }}
            >
              <MedallionCanvas
                level={nextMedalLevel!.level}
                gems={0}
                size={280}
                animated={false}
              />
            </div>
          )}
        </div>

        {/* Next-chapter title reveal */}
        {showNextMedal && nextMedalLevel && (
          <div
            className="flex flex-col items-center gap-1"
            style={{ animation: "zf-next-text-fade 0.9s ease-out 0.4s both" }}
          >
            <p className="font-display text-3xl font-bold text-zora-amber">
              {nextMedalLevel.title}
            </p>
            <p className="font-mono text-[0.65rem] text-dawn-mist/50 uppercase tracking-widest mt-1">
              level {nextMedalLevel.level} · 6 expeditions to fill
            </p>
          </div>
        )}

        {/* Episode info — hidden during fanfare and next-reveal to keep focus on the medallion */}
        <div
          className={`transition-opacity duration-500 ${
            phase === "fanfare" || showNextMedal ? "opacity-0" : "opacity-100"
          }`}
        >
          <p className="font-display text-lg text-zora-amber">
            &ldquo;{episodeTitle}&rdquo;
          </p>
          <p className="font-mono text-eos-teal text-sm mt-1">
            Eos Index: {eosTotal}
          </p>
        </div>

        {/* Level progress — hidden during fanfare and next-reveal */}
        <div
          className={`w-full max-w-xs transition-opacity duration-500 ${
            phase === "fanfare" || showNextMedal ? "opacity-0" : "opacity-100"
          }`}
        >
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

/* ── Soft chord swell for the next-medal reveal ─────────────────── */

function playNextMedalChord() {
  let ac: AudioContext | null = null;
  try {
    ac = new (window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext)();
  } catch {
    return;
  }
  const now = ac.currentTime;
  const dur = 3.2;

  // Master with slow attack so it feels like an opening, not a hit
  const master = ac.createGain();
  master.gain.setValueAtTime(0.0001, now);
  master.gain.exponentialRampToValueAtTime(0.6, now + 0.6);
  master.connect(ac.destination);

  // Open Csus2 chord (C, D, G, C) — feels like an unanswered question
  const chord = [261.63, 293.66, 392.0, 523.25];
  chord.forEach((freq, i) => {
    [-4, 0, 4].forEach((cents) => {
      const o = ac!.createOscillator();
      const g = ac!.createGain();
      o.type = i === 0 ? "triangle" : "sine";
      o.frequency.setValueAtTime(freq * Math.pow(2, cents / 1200), now);
      g.gain.setValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(0.04, now + 0.8);
      g.gain.setValueAtTime(0.04, now + dur - 0.8);
      g.gain.exponentialRampToValueAtTime(0.001, now + dur);
      const lp = ac!.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.setValueAtTime(1200 + i * 300, now);
      lp.Q.setValueAtTime(0.5, now);
      o.connect(lp);
      lp.connect(g);
      g.connect(master);
      o.start(now);
      o.stop(now + dur);
    });
  });

  // Single warm bell-tone on the top note
  const bellT = now + 0.3;
  const bell = ac.createOscillator();
  const bg = ac.createGain();
  bell.type = "sine";
  bell.frequency.setValueAtTime(1046.5, bellT);
  bg.gain.setValueAtTime(0, bellT);
  bg.gain.linearRampToValueAtTime(0.08, bellT + 0.05);
  bg.gain.exponentialRampToValueAtTime(0.001, bellT + 1.6);
  bell.connect(bg);
  bg.connect(master);
  bell.start(bellT);
  bell.stop(bellT + 1.6);

  // Auto-close audio context shortly after the chord finishes
  setTimeout(() => {
    try { ac?.close(); } catch { /* noop */ }
  }, (dur + 0.5) * 1000);
}
