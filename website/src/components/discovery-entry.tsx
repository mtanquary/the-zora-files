"use client";

import { useState, useEffect, useRef } from "react";

export type DetectionMethod = "photographed" | "visual" | "audio" | "visual_and_audio";

export interface DiscoveryDraft {
  name: string;
  type: "wildlife" | "plant" | "geographic" | "cultural_historical";
  rarity_tier: "common" | "uncommon" | "rare" | "very_rare" | "exceptional";
  points: number;
  fun_fact: string;
  detection_method: DetectionMethod;
  photo: File | null;
  photoPreview: string | null;
  is_first_unlock: boolean;
}

const DETECTION_METHODS = [
  { value: "photographed", label: "Photographed", icon: "📷" },
  { value: "visual", label: "Seen only", icon: "👁" },
  { value: "audio", label: "Heard only", icon: "🔊" },
  { value: "visual_and_audio", label: "Seen and heard", icon: "👁🔊" },
] as const;

const TYPES = [
  { value: "wildlife", label: "Wildlife" },
  { value: "plant", label: "Plant" },
  { value: "geographic", label: "Geographic" },
  { value: "cultural_historical", label: "Cultural / historical" },
] as const;

const RARITIES = [
  { value: "common", label: "Common", range: "5–10 pts", min: 5, max: 10, default: 8 },
  { value: "uncommon", label: "Uncommon", range: "15–20 pts", min: 15, max: 20, default: 18 },
  { value: "rare", label: "Rare", range: "25–35 pts", min: 25, max: 35, default: 30 },
  { value: "very_rare", label: "Very rare", range: "40–50 pts", min: 40, max: 50, default: 45 },
  { value: "exceptional", label: "Exceptional", range: "60–75 pts", min: 60, max: 75, default: 65 },
] as const;

const RARITY_COLORS: Record<string, string> = {
  common: "text-mist-dim",
  uncommon: "text-teal-light",
  rare: "text-zora-amber",
  very_rare: "text-sunrise-orange",
  exceptional: "text-amber-light",
};

interface Props {
  draft: DiscoveryDraft;
  onChange: (d: DiscoveryDraft) => void;
  onRemove: () => void;
  index: number;
  hasApiKey?: boolean;
  location?: string;
}

interface SearchResult {
  name: string;
  type: string;
  rarity_tier: string;
  points: number;
  find_count: string;
}

export function DiscoveryEntry({ draft, onChange, onRemove, index, hasApiKey, location }: Props) {
  const [query, setQuery] = useState(draft.name);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [searching, setSearching] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiWarning, setAiWarning] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Autocomplete search
  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `/api/discoveries?q=${encodeURIComponent(query)}`
        );
        const data = await res.json();
        setResults(Array.isArray(data) ? data : []);
        setShowResults(true);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
  }, [query]);

  // Click outside to close
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const selectResult = (r: SearchResult) => {
    const rarity = RARITIES.find((x) => x.value === r.rarity_tier);
    onChange({
      ...draft,
      name: r.name,
      type: r.type as DiscoveryDraft["type"],
      rarity_tier: r.rarity_tier as DiscoveryDraft["rarity_tier"],
      points: r.points,
      is_first_unlock: false, // Previously discovered
    });
    setQuery(r.name);
    setShowResults(false);
  };

  const setAsNew = () => {
    onChange({ ...draft, name: query, is_first_unlock: true });
    setShowResults(false);
  };

  const handleAiAssist = async () => {
    if (!draft.name && !draft.photo) return;
    setAiLoading(true);
    setAiWarning(null);

    const fd = new FormData();
    if (draft.name) fd.append("name", draft.name);
    if (draft.type) fd.append("type", draft.type);
    if (location) fd.append("location", location);
    if (draft.photo) fd.append("photo", draft.photo);

    try {
      const res = await fetch("/api/discovery-assist", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) return;

      const rarity = RARITIES.find((r) => r.value === data.rarity_tier);

      onChange({
        ...draft,
        name: data.corrected_name || draft.name,
        type: data.type || draft.type,
        rarity_tier: (data.rarity_tier as DiscoveryDraft["rarity_tier"]) || draft.rarity_tier,
        points: data.suggested_points || rarity?.default || draft.points,
        fun_fact: data.fun_fact || draft.fun_fact,
      });
      setQuery(data.corrected_name || draft.name);

      if (data.plausibility === "unlikely" || data.plausibility === "impossible") {
        setAiWarning(data.plausibility_note || `This species seems ${data.plausibility} at this location.`);
      }
    } catch {
      // AI assist is best-effort
    } finally {
      setAiLoading(false);
    }
  };

  const currentRarity = RARITIES.find((r) => r.value === draft.rarity_tier)!;

  return (
    <div className="bg-pre-dawn-mid border border-rule rounded-md p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[0.65rem] text-mist-dim uppercase tracking-wider">
          Discovery {index + 1}
          {draft.is_first_unlock && (
            <span className="ml-2 text-zora-amber">· first unlock</span>
          )}
        </span>
        <button
          onClick={onRemove}
          className="text-xs text-mist-dim/40 hover:text-sunrise-orange transition-colors"
        >
          remove
        </button>
      </div>

      {/* Name with autocomplete */}
      <div ref={wrapperRef} className="relative">
        <label className="block font-mono text-[0.6rem] text-mist-dim/60 uppercase tracking-wider mb-1">
          species / feature name
        </label>
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            onChange({ ...draft, name: e.target.value, is_first_unlock: true });
          }}
          onFocus={() => results.length > 0 && setShowResults(true)}
          placeholder="Search or type a new discovery..."
          className="w-full rounded-md border border-rule bg-pre-dawn-light px-3 py-2 text-sm text-dawn-mist placeholder:text-mist-dim/30 focus:border-zora-amber/50 focus:outline-none font-body"
        />

        {showResults && (
          <div className="absolute z-20 top-full mt-1 left-0 right-0 bg-pre-dawn-mid border border-rule rounded-md shadow-xl max-h-48 overflow-y-auto">
            {results.map((r) => (
              <button
                key={r.name + r.type}
                onClick={() => selectResult(r)}
                className="w-full text-left px-3 py-2 hover:bg-pre-dawn-light transition-colors border-b border-rule last:border-0"
              >
                <span className="text-sm text-dawn-mist">{r.name}</span>
                <span className="ml-2 font-mono text-[0.6rem] text-mist-dim">
                  {r.type} ·{" "}
                  <span className={RARITY_COLORS[r.rarity_tier]}>
                    {r.rarity_tier.replace("_", " ")}
                  </span>{" "}
                  · found {r.find_count}×
                </span>
              </button>
            ))}
            {query.length >= 2 && (
              <button
                onClick={setAsNew}
                className="w-full text-left px-3 py-2 hover:bg-pre-dawn-light transition-colors text-zora-amber text-sm"
              >
                + Add &ldquo;{query}&rdquo; as new discovery (first unlock)
              </button>
            )}
          </div>
        )}
      </div>

      {/* AI assist */}
      {hasApiKey && (
        <div>
          <button
            type="button"
            onClick={handleAiAssist}
            disabled={aiLoading || (!draft.name && !draft.photo)}
            className="w-full rounded-md border border-eos-teal/30 bg-eos-teal/5 px-3 py-2 text-xs text-eos-teal transition-colors hover:bg-eos-teal/10 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {aiLoading
              ? "identifying..."
              : draft.photo
                ? "identify from photo + name"
                : "verify and auto-fill"}
          </button>
          {aiWarning && (
            <div className="mt-2 rounded-md border border-sunrise-orange/30 bg-sunrise-orange/5 px-3 py-2 text-xs text-sunrise-orange">
              {aiWarning}
            </div>
          )}
        </div>
      )}

      {/* Detection method */}
      <div>
        <label className="block font-mono text-[0.6rem] text-mist-dim/60 uppercase tracking-wider mb-1">
          how was it identified?
        </label>
        <div className="grid grid-cols-4 gap-2">
          {DETECTION_METHODS.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() =>
                onChange({ ...draft, detection_method: m.value as DetectionMethod })
              }
              className={`rounded-md border px-2 py-2 text-center text-xs transition-colors ${
                draft.detection_method === m.value
                  ? "border-zora-amber bg-zora-amber/10 text-zora-amber"
                  : "border-rule text-mist-dim/40 hover:border-mist-dim/20"
              }`}
            >
              <span className="block text-base mb-0.5">{m.icon}</span>
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {/* Type */}
        <div>
          <label className="block font-mono text-[0.6rem] text-mist-dim/60 uppercase tracking-wider mb-1">
            type
          </label>
          <select
            value={draft.type}
            onChange={(e) =>
              onChange({ ...draft, type: e.target.value as DiscoveryDraft["type"] })
            }
            className="w-full rounded-md border border-rule bg-pre-dawn-light px-3 py-2 text-sm text-dawn-mist focus:border-zora-amber/50 focus:outline-none"
          >
            {TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        {/* Rarity */}
        <div>
          <label className="block font-mono text-[0.6rem] text-mist-dim/60 uppercase tracking-wider mb-1">
            rarity
          </label>
          <select
            value={draft.rarity_tier}
            onChange={(e) => {
              const rarity = RARITIES.find((r) => r.value === e.target.value)!;
              onChange({
                ...draft,
                rarity_tier: e.target.value as DiscoveryDraft["rarity_tier"],
                points: rarity.default,
              });
            }}
            className="w-full rounded-md border border-rule bg-pre-dawn-light px-3 py-2 text-sm text-dawn-mist focus:border-zora-amber/50 focus:outline-none"
          >
            {RARITIES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label} ({r.range})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Points slider */}
      <div>
        <div className="flex justify-between mb-1">
          <label className="font-mono text-[0.6rem] text-mist-dim/60 uppercase tracking-wider">
            points
          </label>
          <span className={`font-mono text-sm font-bold ${RARITY_COLORS[draft.rarity_tier]}`}>
            {draft.points}
          </span>
        </div>
        <input
          type="range"
          min={currentRarity.min}
          max={currentRarity.max}
          value={draft.points}
          onChange={(e) => onChange({ ...draft, points: Number(e.target.value) })}
          className="w-full accent-zora-amber"
        />
        <div className="flex justify-between font-mono text-[0.55rem] text-mist-dim/30">
          <span>{currentRarity.min}</span>
          <span>{currentRarity.max}</span>
        </div>
      </div>

      {/* Photo */}
      {draft.detection_method === "photographed" ? (
        <div>
          <label className="block font-mono text-[0.6rem] text-mist-dim/60 uppercase tracking-wider mb-1">
            photo
          </label>
          <label className="block cursor-pointer rounded-md border border-dashed border-rule hover:border-zora-amber/30 transition-colors p-3 text-center">
            {draft.photoPreview ? (
              <img
                src={draft.photoPreview}
                alt={draft.name}
                className="mx-auto max-h-24 rounded object-cover"
              />
            ) : (
              <span className="text-xs text-mist-dim/40">Click to add photo</span>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  onChange({
                    ...draft,
                    photo: file,
                    photoPreview: URL.createObjectURL(file),
                  });
                }
              }}
              className="hidden"
            />
        </label>
        </div>
      ) : (
        <div className="rounded-md border border-dashed border-rule p-3 text-center">
          <p className="text-xs text-mist-dim/40">
            {draft.detection_method === "audio"
              ? "Identified by sound. Photo can be added later."
              : draft.detection_method === "visual"
                ? "Seen but not photographed. Photo can be added later."
                : "Seen and heard but not photographed. Photo can be added later."}
          </p>
        </div>
      )}

      {/* Fun fact */}
      <div>
        <label className="block font-mono text-[0.6rem] text-mist-dim/60 uppercase tracking-wider mb-1">
          fun fact (optional)
        </label>
        <input
          type="text"
          value={draft.fun_fact}
          onChange={(e) => onChange({ ...draft, fun_fact: e.target.value })}
          placeholder="Something interesting about this discovery..."
          className="w-full rounded-md border border-rule bg-pre-dawn-light px-3 py-2 text-sm text-dawn-mist placeholder:text-mist-dim/30 focus:border-zora-amber/50 focus:outline-none font-body"
        />
      </div>
    </div>
  );
}

export function emptyDiscovery(): DiscoveryDraft {
  return {
    name: "",
    type: "wildlife",
    rarity_tier: "common",
    points: 8,
    fun_fact: "",
    detection_method: "photographed",
    photo: null,
    photoPreview: null,
    is_first_unlock: true,
  };
}
