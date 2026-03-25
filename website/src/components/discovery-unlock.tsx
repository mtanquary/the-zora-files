"use client";

import { useState, useEffect, useRef, useCallback } from "react";

export interface UnlockItem {
  name: string;
  type: string;
  rarity: string;
  points: number;
  photoUrl: string | null;
  detectionMethod: string;
}

interface Props {
  items: UnlockItem[];
  onComplete: () => void;
}

const RARITY_COLORS: Record<string, string> = {
  common: "text-mist-dim",
  uncommon: "text-teal-light",
  rare: "text-zora-amber",
  very_rare: "text-sunrise-orange",
  exceptional: "text-amber-light",
};

const RARITY_GLOW: Record<string, string> = {
  common: "rgba(138,154,174,0.3)",
  uncommon: "rgba(44,196,143,0.3)",
  rare: "rgba(240,165,0,0.3)",
  very_rare: "rgba(232,82,10,0.3)",
  exceptional: "rgba(255,209,102,0.4)",
};

/**
 * Discovery unlock ceremony.
 * For each first-unlock: silhouette → lock boom → color reveal → info.
 */
export function DiscoveryUnlockCeremony({ items, onComplete }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState<"silhouette" | "unlocking" | "revealed" | "done">("silhouette");
  const actxRef = useRef<AudioContext | null>(null);

  const getAudio = useCallback(() => {
    if (!actxRef.current) actxRef.current = new AudioContext();
    return actxRef.current;
  }, []);

  // Heavy metallic lock-opening boom with echo
  const sfxUnlock = useCallback(() => {
    const a = getAudio(), now = a.currentTime;

    // Deep impact: low sine thump
    const o1 = a.createOscillator(), g1 = a.createGain();
    o1.type = "sine";
    o1.frequency.setValueAtTime(60, now);
    o1.frequency.exponentialRampToValueAtTime(30, now + 0.5);
    g1.gain.setValueAtTime(0.5, now);
    g1.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    o1.connect(g1); g1.connect(a.destination);
    o1.start(now); o1.stop(now + 0.6);

    // Metallic click: high frequency burst
    const o2 = a.createOscillator(), g2 = a.createGain();
    o2.type = "square";
    o2.frequency.setValueAtTime(3200, now);
    o2.frequency.exponentialRampToValueAtTime(800, now + 0.05);
    g2.gain.setValueAtTime(0.3, now);
    g2.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    o2.connect(g2); g2.connect(a.destination);
    o2.start(now); o2.stop(now + 0.08);

    // Bolt sliding: filtered noise
    const dur = 0.4;
    const buf = a.createBuffer(1, a.sampleRate * dur, a.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const src = a.createBufferSource(); src.buffer = buf;
    const bp = a.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.setValueAtTime(2000, now + 0.03);
    bp.frequency.exponentialRampToValueAtTime(400, now + 0.03 + dur);
    bp.Q.setValueAtTime(3, now + 0.03);
    const gn = a.createGain();
    gn.gain.setValueAtTime(0, now + 0.03);
    gn.gain.linearRampToValueAtTime(0.15, now + 0.06);
    gn.gain.exponentialRampToValueAtTime(0.001, now + 0.03 + dur);
    src.connect(bp); bp.connect(gn); gn.connect(a.destination);
    src.start(now + 0.03); src.stop(now + 0.03 + dur);

    // Echo: delayed repeat of the impact
    const o3 = a.createOscillator(), g3 = a.createGain();
    o3.type = "sine";
    o3.frequency.setValueAtTime(45, now + 0.25);
    o3.frequency.exponentialRampToValueAtTime(25, now + 0.7);
    g3.gain.setValueAtTime(0.15, now + 0.25);
    g3.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
    o3.connect(g3); g3.connect(a.destination);
    o3.start(now + 0.25); o3.stop(now + 0.8);

    // Second echo: quieter
    const o4 = a.createOscillator(), g4 = a.createGain();
    o4.type = "sine";
    o4.frequency.setValueAtTime(40, now + 0.5);
    g4.gain.setValueAtTime(0.06, now + 0.5);
    g4.gain.exponentialRampToValueAtTime(0.001, now + 1.0);
    o4.connect(g4); g4.connect(a.destination);
    o4.start(now + 0.5); o4.stop(now + 1.0);
  }, [getAudio]);

  // Reveal chime: bright ascending tone
  const sfxReveal = useCallback(() => {
    const a = getAudio(), now = a.currentTime;
    const notes = [523.25, 659.25, 783.99];
    notes.forEach((freq, i) => {
      const t = now + i * 0.08;
      const o = a.createOscillator(), g = a.createGain();
      o.type = "sine";
      o.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.18, t + 0.03);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
      o.connect(g); g.connect(a.destination);
      o.start(t); o.stop(t + 0.6);
    });
  }, [getAudio]);

  useEffect(() => {
    if (currentIndex >= items.length) {
      onComplete();
      return;
    }

    // Auto-run the ceremony for current item
    const timer = setTimeout(async () => {
      // Show silhouette for a beat
      setPhase("silhouette");
      await new Promise((r) => setTimeout(r, 1200));

      // Lock boom
      setPhase("unlocking");
      sfxUnlock();
      await new Promise((r) => setTimeout(r, 800));

      // Reveal
      setPhase("revealed");
      sfxReveal();
      await new Promise((r) => setTimeout(r, 2500));

      // Next item or done
      if (currentIndex + 1 < items.length) {
        setCurrentIndex((i) => i + 1);
        setPhase("silhouette");
      } else {
        setPhase("done");
        await new Promise((r) => setTimeout(r, 500));
        onComplete();
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [currentIndex]);

  if (currentIndex >= items.length) return null;

  const item = items[currentIndex];
  const isRevealed = phase === "revealed" || phase === "done";
  const glowColor = RARITY_GLOW[item.rarity] || "rgba(200,212,224,0.2)";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-pre-dawn/95 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-6 p-8 max-w-md text-center">
        {/* Counter */}
        {items.length > 1 && (
          <p className="font-mono text-[0.6rem] text-mist-dim/40 tracking-wider">
            {currentIndex + 1} of {items.length} discoveries
          </p>
        )}

        {/* Status */}
        <p className="font-mono text-xs tracking-[0.25em] text-zora-amber uppercase">
          {phase === "silhouette" && "new discovery"}
          {phase === "unlocking" && "unlocking..."}
          {(phase === "revealed" || phase === "done") && "first unlock"}
        </p>

        {/* Photo - silhouette to color */}
        <div
          className="relative w-64 h-64 rounded-xl overflow-hidden transition-all duration-700"
          style={{
            boxShadow: isRevealed ? `0 0 60px ${glowColor}` : "none",
          }}
        >
          {item.photoUrl ? (
            <img
              src={item.photoUrl}
              alt={item.name}
              className="w-full h-full object-cover transition-all duration-700"
              style={{
                filter: isRevealed
                  ? "brightness(1) saturate(1)"
                  : "brightness(0) saturate(0)",
              }}
            />
          ) : (
            <div
              className="w-full h-full flex flex-col items-center justify-center gap-4 transition-all duration-700"
              style={{ background: isRevealed ? glowColor : "#0A0A0F" }}
            >
              {/* Type icon with glow on reveal */}
              <span
                className="transition-all duration-700"
                style={{
                  fontSize: isRevealed ? "5rem" : "4rem",
                  filter: isRevealed ? "grayscale(0) drop-shadow(0 0 20px rgba(240,165,0,0.4))" : "grayscale(1) brightness(0.15)",
                }}
              >
                {item.type === "wildlife" ? "\u{1F43E}" :
                 item.type === "plant" ? "\u{1F33F}" :
                 item.type === "geographic" ? "\u{26F0}\uFE0F" :
                 "\u{1F3DB}\uFE0F"}
              </span>
              {isRevealed && (
                <span className="font-mono text-xs text-dawn-mist/50 uppercase tracking-wider">
                  {item.detectionMethod === "audio" ? "identified by sound" :
                   item.detectionMethod === "visual" ? "seen, not photographed" :
                   item.detectionMethod === "visual_and_audio" ? "seen and heard" :
                   "awaiting photo"}
                </span>
              )}
            </div>
          )}

          {/* Lock icon overlay during silhouette phase */}
          {!isRevealed && (
            <div className="absolute inset-0 flex items-center justify-center">
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                className={`transition-all duration-500 ${
                  phase === "unlocking" ? "opacity-0 scale-150" : "opacity-40"
                }`}
              >
                <rect
                  x="5"
                  y="11"
                  width="14"
                  height="10"
                  rx="2"
                  fill="rgba(200,212,224,0.15)"
                  stroke="rgba(200,212,224,0.3)"
                  strokeWidth="1"
                />
                <path
                  d="M8 11V7a4 4 0 1 1 8 0v4"
                  fill="none"
                  stroke="rgba(200,212,224,0.3)"
                  strokeWidth="1"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          )}
        </div>

        {/* Info - appears on reveal */}
        <div
          className={`transition-all duration-700 ${
            isRevealed ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <p className="font-display text-2xl text-dawn-mist mb-1">
            {item.name}
          </p>
          <p className="font-mono text-xs text-mist-dim tracking-wider mb-2">
            {item.type.replace("_", " ")}
          </p>
          <div className="flex items-center justify-center gap-3">
            <span
              className={`font-mono text-xs uppercase tracking-wider ${RARITY_COLORS[item.rarity]}`}
            >
              {item.rarity.replace("_", " ")}
            </span>
            <span className="text-mist-dim/20">·</span>
            <span className="font-mono text-sm text-amber-light font-bold">
              +{item.points} pts
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
