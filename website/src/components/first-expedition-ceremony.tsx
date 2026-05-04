"use client";

import { useEffect, useRef, useState } from "react";
import { MedallionCanvas, type MedallionHandle } from "./medallion-canvas";
import { LEVELS } from "@/lib/types";

interface Props {
  episodeTitle: string;
  eosTotal: number;
  onClose: () => void;
}

type Phase =
  | "scout-display"
  | "scout-fade"
  | "trailhead-rise"
  | "place-gem"
  | "settled"
  | "done";

/**
 * First-expedition ceremony: the Scout-to-Trailhead training graduation.
 *
 * This fires for the very first expedition only. Scout has no medallion of its
 * own to fill; the player graduates from training, the Trailhead medallion is
 * unveiled, and the transition gem (gem 1 of Trailhead) is placed as part of
 * the ceremony.
 */
export function FirstExpeditionCeremony({ episodeTitle, eosTotal, onClose }: Props) {
  const [phase, setPhase] = useState<Phase>("scout-display");
  const trailheadRef = useRef<MedallionHandle>(null);

  const scout = LEVELS[0];
  const trailhead = LEVELS[1];

  useEffect(() => {
    let cancelled = false;
    const audio = playOpeningChord();

    const run = async () => {
      // 1. Hold on Scout for a beat
      await wait(1800);
      if (cancelled) return;

      // 2. Scout fades up and out
      setPhase("scout-fade");
      playGraduationSwell();
      await wait(1100);
      if (cancelled) return;

      // 3. Trailhead rises in
      setPhase("trailhead-rise");
      await wait(1400);
      if (cancelled) return;

      // 4. Place gem 1 of Trailhead — the transition gem
      setPhase("place-gem");
      if (trailheadRef.current) {
        await trailheadRef.current.placeGem();
      }
      if (cancelled) return;

      // 5. Settle and reveal subtitle
      setPhase("settled");
      playFirstGemSwell();
      await wait(2400);
      if (cancelled) return;

      setPhase("done");
    };

    run();

    return () => {
      cancelled = true;
      try { audio?.close(); } catch { /* noop */ }
    };
  }, []);

  const showScout = phase === "scout-display" || phase === "scout-fade";
  const showTrailhead =
    phase === "trailhead-rise" || phase === "place-gem" || phase === "settled" || phase === "done";

  const eyebrow = (() => {
    switch (phase) {
      case "scout-display":
        return "scout · the path begins";
      case "scout-fade":
        return "training complete";
      case "trailhead-rise":
        return "welcome to trailhead";
      case "place-gem":
        return "transition gem";
      case "settled":
      case "done":
        return "first gem placed · 5 to go";
    }
  })();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-pre-dawn/95 backdrop-blur-sm overflow-hidden">
      <style>{`
        @keyframes zf-scout-rise {
          0% { opacity: 0; transform: translateY(20px) scale(0.85); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes zf-scout-graduate {
          0% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
          100% { opacity: 0; transform: translateY(-80px) scale(0.7); filter: blur(8px); }
        }
        @keyframes zf-trailhead-rise {
          0% { opacity: 0; transform: translateY(60px) scale(0.7); filter: blur(10px); }
          100% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
        }
        @keyframes zf-th-glow {
          0% { opacity: 0; transform: scale(0.4); }
          50% { opacity: 0.7; transform: scale(1.15); }
          100% { opacity: 0.45; transform: scale(1); }
        }
        @keyframes zf-eyebrow-fade {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes zf-title-fade {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Soft amber glow when Trailhead is on stage */}
      {showTrailhead && (
        <div
          className="absolute pointer-events-none"
          style={{
            width: 540,
            height: 540,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(240,165,0,0.5) 0%, rgba(232,82,10,0.22) 38%, transparent 72%)",
            animation: "zf-th-glow 2.4s cubic-bezier(0.2, 0.7, 0.3, 1) forwards",
            filter: "blur(4px)",
          }}
        />
      )}

      <div className="relative z-10 flex flex-col items-center gap-6 p-8 max-w-md text-center">
        {/* Eyebrow text */}
        <p
          key={`eyebrow-${phase}`}
          className="text-xs tracking-widest uppercase text-zora-amber/85"
          style={{ animation: "zf-eyebrow-fade 0.6s ease-out forwards" }}
        >
          {eyebrow}
        </p>

        {/* Medallion stage — Scout and Trailhead crossfade */}
        <div className="relative" style={{ width: 280, height: 280 }}>
          {showScout && (
            <div
              className="absolute inset-0"
              style={{
                animation:
                  phase === "scout-display"
                    ? "zf-scout-rise 1s cubic-bezier(0.2, 0.7, 0.3, 1) forwards"
                    : "zf-scout-graduate 1.1s cubic-bezier(0.4, 0, 0.6, 1) forwards",
              }}
            >
              <MedallionCanvas level={scout.level} gems={0} size={280} animated={false} />
            </div>
          )}

          {showTrailhead && (
            <div
              className="absolute inset-0"
              style={{
                animation: "zf-trailhead-rise 1.3s cubic-bezier(0.2, 0.7, 0.3, 1) forwards",
              }}
            >
              <MedallionCanvas
                ref={trailheadRef}
                level={trailhead.level}
                gems={0}
                size={280}
                animated
              />
            </div>
          )}
        </div>

        {/* Title reveal — appears once Trailhead has risen */}
        {showTrailhead && (
          <div
            className="flex flex-col items-center gap-1"
            style={{ animation: "zf-title-fade 0.9s ease-out 0.4s both" }}
          >
            <p className="font-display text-3xl font-bold text-zora-amber">
              {trailhead.title}
            </p>
            <p className="font-mono text-[0.65rem] text-dawn-mist/50 uppercase tracking-widest mt-1">
              level {trailhead.level} · your first medallion
            </p>
          </div>
        )}

        {/* Episode info — only visible after settling */}
        {(phase === "settled" || phase === "done") && (
          <div style={{ animation: "zf-title-fade 0.6s ease-out forwards" }}>
            <p className="font-display text-lg text-zora-amber">
              &ldquo;{episodeTitle}&rdquo;
            </p>
            <p className="font-mono text-eos-teal text-sm mt-1">Eos Index: {eosTotal}</p>
          </div>
        )}

        {/* Continue button */}
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

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/* ── Audio ──────────────────────────────────────────────────────── */

function getAC(): AudioContext | null {
  try {
    return new (window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext)();
  } catch {
    return null;
  }
}

let sharedAC: AudioContext | null = null;

function ensureAC(): AudioContext | null {
  if (!sharedAC) sharedAC = getAC();
  return sharedAC;
}

/** Returns the shared AC so the parent can close it on unmount. */
function playOpeningChord(): AudioContext | null {
  const ac = ensureAC();
  if (!ac) return null;
  const now = ac.currentTime;

  // Quiet sustained C drone — low, calm, "the path begins"
  const drone = ac.createOscillator();
  const dg = ac.createGain();
  drone.type = "sine";
  drone.frequency.setValueAtTime(130.81, now); // C3
  dg.gain.setValueAtTime(0, now);
  dg.gain.linearRampToValueAtTime(0.08, now + 1.5);
  dg.gain.setValueAtTime(0.08, now + 2.5);
  dg.gain.exponentialRampToValueAtTime(0.001, now + 4);
  drone.connect(dg);
  dg.connect(ac.destination);
  drone.start(now);
  drone.stop(now + 4);

  return ac;
}

/** Played when Scout fades and Trailhead rises — a graduating swell. */
function playGraduationSwell() {
  const ac = ensureAC();
  if (!ac) return;
  const now = ac.currentTime;
  const dur = 2.4;

  const master = ac.createGain();
  master.gain.setValueAtTime(0.0001, now);
  master.gain.exponentialRampToValueAtTime(0.55, now + 0.5);
  master.connect(ac.destination);

  // C major chord rising into the listener (open voicing C-E-G-C)
  const chord = [261.63, 329.63, 392.0, 523.25];
  chord.forEach((freq, i) => {
    [-3, 3].forEach((cents) => {
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.type = "triangle";
      o.frequency.setValueAtTime(freq * Math.pow(2, cents / 1200), now);
      g.gain.setValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(0.05, now + 0.7);
      g.gain.setValueAtTime(0.05, now + dur - 0.6);
      g.gain.exponentialRampToValueAtTime(0.001, now + dur);
      const lp = ac.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.setValueAtTime(900 + i * 200, now);
      lp.frequency.linearRampToValueAtTime(2200, now + 1.0);
      lp.Q.setValueAtTime(0.5, now);
      o.connect(lp);
      lp.connect(g);
      g.connect(master);
      o.start(now);
      o.stop(now + dur);
    });
  });

  // Ascending arpeggio C-E-G-C (gentle)
  [261.63, 329.63, 392.0, 523.25].forEach((freq, i) => {
    const t = now + 0.2 + i * 0.14;
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(freq * 2, t); // octave up
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.07, t + 0.04);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
    o.connect(g);
    g.connect(master);
    o.start(t);
    o.stop(t + 0.6);
  });
}

/** Played after gem 1 is placed — small celebratory chord. */
function playFirstGemSwell() {
  const ac = ensureAC();
  if (!ac) return;
  const now = ac.currentTime;
  const dur = 1.8;

  const master = ac.createGain();
  master.gain.setValueAtTime(0.0001, now);
  master.gain.exponentialRampToValueAtTime(0.5, now + 0.2);
  master.connect(ac.destination);

  // F major add9 — bright, hopeful "more to come"
  const chord = [349.23, 440.0, 523.25, 659.25];
  chord.forEach((freq) => {
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(freq, now);
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(0.06, now + 0.2);
    g.gain.exponentialRampToValueAtTime(0.001, now + dur);
    o.connect(g);
    g.connect(master);
    o.start(now);
    o.stop(now + dur);
  });
}
