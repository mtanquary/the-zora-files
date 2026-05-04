"use client";

import { useEffect, useRef, useState } from "react";
import { LEVELS } from "@/lib/types";

interface Props {
  level: number;
  onComplete?: () => void;
  durationMs?: number;
}

const RAY_COUNT = 36;
const PARTICLE_COUNT = 80;

type Particle = {
  id: number;
  startX: number;
  startY: number;
  driftX: number;
  driftY: number;
  size: number;
  delay: number;
  duration: number;
  hue: "amber" | "orange" | "ember";
};

export function MedallionFanfare({ level, onComplete, durationMs = 4500 }: Props) {
  const audioRef = useRef<AudioContext | null>(null);
  const [phase, setPhase] = useState<"burst" | "hold" | "fade">("burst");
  const currentLevel = LEVELS[Math.min(level, 10)];

  // Lazy useState init: random values computed once per mount (not each render).
  const [particles] = useState<Particle[]>(() => generateParticles());

  useEffect(() => {
    let ac: AudioContext | null = null;
    try {
      ac = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      audioRef.current = ac;
      playFanfare(ac);
    } catch {
      // audio unavailable; fanfare proceeds visual-only
    }

    const holdTimer = setTimeout(() => setPhase("hold"), 1500);
    const fadeTimer = setTimeout(() => setPhase("fade"), durationMs - 600);
    const completeTimer = setTimeout(() => onComplete?.(), durationMs);

    return () => {
      clearTimeout(holdTimer);
      clearTimeout(fadeTimer);
      clearTimeout(completeTimer);
      try { ac?.close(); } catch { /* noop */ }
    };
  }, [durationMs, onComplete]);

  return (
    <div
      className={`pointer-events-none absolute inset-0 flex items-center justify-center transition-opacity duration-500 ${
        phase === "fade" ? "opacity-0" : "opacity-100"
      }`}
      aria-hidden
    >
      <style>{`
        @keyframes zf-ray-grow {
          0% { transform: scaleY(0); opacity: 0; }
          15% { opacity: 1; }
          100% { transform: scaleY(1); opacity: 0.85; }
        }
        @keyframes zf-ray-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes zf-bloom {
          0% { transform: scale(0.4); opacity: 0; }
          30% { transform: scale(1.05); opacity: 0.95; }
          60% { transform: scale(1.15); opacity: 0.7; }
          100% { transform: scale(1.4); opacity: 0; }
        }
        @keyframes zf-bloom-secondary {
          0% { transform: scale(0.6); opacity: 0; }
          40% { transform: scale(1.4); opacity: 0.55; }
          100% { transform: scale(1.9); opacity: 0; }
        }
        @keyframes zf-particle {
          0% {
            transform: translate3d(var(--sx), var(--sy), 0) scale(0.4);
            opacity: 0;
          }
          15% {
            opacity: 1;
          }
          100% {
            transform: translate3d(calc(var(--sx) + var(--dx)), calc(var(--sy) + var(--dy)), 0) scale(0.05);
            opacity: 0;
          }
        }
        @keyframes zf-eyebrow-fade {
          0% { opacity: 0; transform: translateY(8px); letter-spacing: 0.5em; }
          100% { opacity: 1; transform: translateY(0); letter-spacing: 0.35em; }
        }
        @keyframes zf-title-reveal {
          0% { opacity: 0; transform: scale(0.6); filter: blur(12px); letter-spacing: 0.3em; }
          60% { opacity: 1; filter: blur(0); }
          100% { opacity: 1; transform: scale(1); letter-spacing: 0.04em; }
        }
        @keyframes zf-subtitle-fade {
          0% { opacity: 0; transform: translateY(6px); }
          100% { opacity: 0.85; transform: translateY(0); }
        }
        @keyframes zf-shimmer {
          0%, 100% { opacity: 0.85; }
          50% { opacity: 1; filter: drop-shadow(0 0 24px rgba(240, 165, 0, 0.55)); }
        }
      `}</style>

      {/* Outer radial backdrop */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at center, rgba(240,165,0,0.32) 0%, rgba(232,82,10,0.22) 22%, rgba(13,15,20,0) 58%)",
          animation: "zf-bloom-secondary 2.4s ease-out forwards",
        }}
      />

      {/* Bloom halo behind medallion */}
      <div
        className="absolute"
        style={{
          width: 520,
          height: 520,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(255,210,120,0.65) 0%, rgba(240,165,0,0.35) 30%, rgba(232,82,10,0.15) 55%, transparent 75%)",
          animation: "zf-bloom 1.6s cubic-bezier(0.2, 0.8, 0.3, 1) forwards",
          filter: "blur(2px)",
        }}
      />

      {/* Sunburst rays — two counter-rotating layers */}
      <div
        className="absolute"
        style={{
          width: 720,
          height: 720,
          animation: "zf-ray-spin 18s linear infinite",
        }}
      >
        {Array.from({ length: RAY_COUNT }).map((_, i) => {
          const angle = (i / RAY_COUNT) * 360;
          const isMajor = i % 3 === 0;
          return (
            <div
              key={`ray-a-${i}`}
              className="absolute left-1/2 top-1/2"
              style={{
                width: isMajor ? 4 : 2,
                height: isMajor ? 360 : 280,
                marginLeft: isMajor ? -2 : -1,
                marginTop: isMajor ? -180 : -140,
                background: isMajor
                  ? "linear-gradient(to bottom, rgba(255,200,80,0) 0%, rgba(240,165,0,0.85) 50%, rgba(232,82,10,0) 100%)"
                  : "linear-gradient(to bottom, rgba(255,200,80,0) 0%, rgba(240,165,0,0.45) 50%, rgba(232,82,10,0) 100%)",
                transformOrigin: "center center",
                transform: `rotate(${angle}deg) scaleY(0)`,
                animation: `zf-ray-grow 1.4s cubic-bezier(0.2, 0.7, 0.3, 1) ${0.05 * i}s forwards`,
                filter: "blur(0.5px)",
              }}
            />
          );
        })}
      </div>

      <div
        className="absolute"
        style={{
          width: 600,
          height: 600,
          animation: "zf-ray-spin 30s linear infinite reverse",
        }}
      >
        {Array.from({ length: RAY_COUNT / 2 }).map((_, i) => {
          const angle = (i / (RAY_COUNT / 2)) * 360 + 7.5;
          return (
            <div
              key={`ray-b-${i}`}
              className="absolute left-1/2 top-1/2"
              style={{
                width: 1.5,
                height: 240,
                marginLeft: -0.75,
                marginTop: -120,
                background:
                  "linear-gradient(to bottom, rgba(122,95,184,0) 0%, rgba(122,95,184,0.5) 50%, rgba(122,95,184,0) 100%)",
                transformOrigin: "center center",
                transform: `rotate(${angle}deg) scaleY(0)`,
                animation: `zf-ray-grow 1.6s cubic-bezier(0.2, 0.7, 0.3, 1) ${0.6 + 0.05 * i}s forwards`,
              }}
            />
          );
        })}
      </div>

      {/* Particle shower */}
      <div className="absolute" style={{ width: 4, height: 4 }}>
        {particles.map((p) => (
          <div
            key={p.id}
            className="absolute rounded-full"
            style={
              {
                left: 0,
                top: 0,
                width: p.size,
                height: p.size,
                background:
                  p.hue === "amber"
                    ? "radial-gradient(circle, #FFD068 0%, #F0A500 60%, transparent 100%)"
                    : p.hue === "orange"
                    ? "radial-gradient(circle, #FFB078 0%, #E8520A 60%, transparent 100%)"
                    : "radial-gradient(circle, #FFE4A0 0%, #C87040 60%, transparent 100%)",
                boxShadow: `0 0 ${p.size * 2}px rgba(240, 165, 0, 0.8)`,
                animation: `zf-particle ${p.duration}s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${p.delay}s forwards`,
                "--sx": `${p.startX}px`,
                "--sy": `${p.startY}px`,
                "--dx": `${p.driftX}px`,
                "--dy": `${p.driftY}px`,
              } as React.CSSProperties
            }
          />
        ))}
      </div>

      {/* Text reveal — eyebrow + title + subtitle */}
      <div className="absolute bottom-12 left-0 right-0 flex flex-col items-center gap-2 text-center">
        <p
          className="font-mono text-[0.7rem] text-zora-amber/80 uppercase"
          style={{
            animation: "zf-eyebrow-fade 0.8s cubic-bezier(0.2, 0.7, 0.3, 1) 0.6s both",
          }}
        >
          level {currentLevel.level} medallion complete
        </p>
        <h2
          className="font-display text-5xl font-bold text-zora-amber"
          style={{
            textShadow:
              "0 0 24px rgba(240, 165, 0, 0.6), 0 0 60px rgba(232, 82, 10, 0.35)",
            animation:
              "zf-title-reveal 1.4s cubic-bezier(0.2, 0.7, 0.3, 1) 0.9s both, zf-shimmer 2.6s ease-in-out 2.4s infinite",
          }}
        >
          {currentLevel.title}
        </h2>
        {phase !== "burst" && (
          <p
            className="font-mono text-xs text-dawn-mist/70 tracking-wider"
            style={{
              animation: "zf-subtitle-fade 0.7s ease-out 0.1s both",
            }}
          >
            the dawn answers
          </p>
        )}
      </div>
    </div>
  );
}

function generateParticles(): Particle[] {
  return Array.from({ length: PARTICLE_COUNT }, (_, i) => {
    const angle = Math.random() * Math.PI * 2;
    const distance = 180 + Math.random() * 320;
    const hueRoll = Math.random();
    return {
      id: i,
      startX: Math.cos(angle) * 12,
      startY: Math.sin(angle) * 12,
      driftX: Math.cos(angle) * distance,
      driftY: Math.sin(angle) * distance - (40 + Math.random() * 80),
      size: 2 + Math.random() * 5,
      delay: Math.random() * 0.6,
      duration: 1.8 + Math.random() * 1.6,
      hue: hueRoll < 0.55 ? "amber" : hueRoll < 0.85 ? "orange" : "ember",
    };
  });
}

/* ── Audio fanfare ─────────────────────────────────────────────── */

function playFanfare(ac: AudioContext) {
  const now = ac.currentTime;

  // Master gain w/ soft compressor-ish curve (single bus)
  const master = ac.createGain();
  master.gain.setValueAtTime(0.0001, now);
  master.gain.exponentialRampToValueAtTime(1.0, now + 0.05);
  master.connect(ac.destination);

  // Layer 1: Ascending arpeggio in C major (C4 → E4 → G4 → C5 → E5 → G5)
  const arpFreqs = [261.63, 329.63, 392.0, 523.25, 659.25, 783.99];
  arpFreqs.forEach((freq, i) => {
    const t = now + i * 0.09;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.18, t + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.7);
    osc.connect(gain);
    gain.connect(master);
    osc.start(t);
    osc.stop(t + 0.7);

    // Bell-like harmonic (3rd partial)
    const h = ac.createOscillator();
    const hg = ac.createGain();
    h.type = "sine";
    h.frequency.setValueAtTime(freq * 3, t);
    hg.gain.setValueAtTime(0, t);
    hg.gain.linearRampToValueAtTime(0.05, t + 0.04);
    hg.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    h.connect(hg);
    hg.connect(master);
    h.start(t);
    h.stop(t + 0.5);
  });

  // Layer 2: Sustained C major chord swell (C, E, G, C — pad-like)
  const padStart = now + 0.6;
  const padDur = 3.2;
  const chord = [261.63, 329.63, 392.0, 523.25];
  chord.forEach((freq, i) => {
    // Two detuned oscillators per note for warmth
    [-3, 3].forEach((cents) => {
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.type = "sawtooth";
      o.frequency.setValueAtTime(freq * Math.pow(2, cents / 1200), padStart);
      g.gain.setValueAtTime(0, padStart);
      g.gain.linearRampToValueAtTime(0.045, padStart + 0.6);
      g.gain.setValueAtTime(0.045, padStart + padDur - 0.8);
      g.gain.exponentialRampToValueAtTime(0.001, padStart + padDur);
      // Soft lowpass per voice
      const lp = ac.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.setValueAtTime(800 + i * 200, padStart);
      lp.frequency.linearRampToValueAtTime(2200 + i * 400, padStart + 1.0);
      lp.Q.setValueAtTime(0.6, padStart);
      o.connect(lp);
      lp.connect(g);
      g.connect(master);
      o.start(padStart);
      o.stop(padStart + padDur);
    });
  });

  // Layer 3: Whoosh / impact at burst start
  const dur = 1.0;
  const buf = ac.createBuffer(1, ac.sampleRate * dur, ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const src = ac.createBufferSource();
  src.buffer = buf;
  const lp = ac.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.setValueAtTime(150, now);
  lp.frequency.linearRampToValueAtTime(1800, now + 0.4);
  lp.frequency.exponentialRampToValueAtTime(120, now + dur);
  lp.Q.setValueAtTime(0.8, now);
  const wg = ac.createGain();
  wg.gain.setValueAtTime(0, now);
  wg.gain.linearRampToValueAtTime(0.28, now + 0.25);
  wg.gain.exponentialRampToValueAtTime(0.001, now + dur);
  src.connect(lp);
  lp.connect(wg);
  wg.connect(master);
  src.start(now);
  src.stop(now + dur);

  // Layer 4: Sub-bass impact at impact moment
  const subT = now;
  const sub = ac.createOscillator();
  const subG = ac.createGain();
  sub.type = "sine";
  sub.frequency.setValueAtTime(110, subT);
  sub.frequency.exponentialRampToValueAtTime(55, subT + 0.6);
  subG.gain.setValueAtTime(0.0001, subT);
  subG.gain.exponentialRampToValueAtTime(0.4, subT + 0.04);
  subG.gain.exponentialRampToValueAtTime(0.001, subT + 0.8);
  sub.connect(subG);
  subG.connect(master);
  sub.start(subT);
  sub.stop(subT + 0.8);
}
