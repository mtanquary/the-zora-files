"use client";

import { useState, useEffect, useRef } from "react";

export interface DiscoveryDraft {
  name: string;
  type: "wildlife" | "plant" | "geographic" | "cultural_historical";
  rarity_tier: "common" | "uncommon" | "rare" | "very_rare" | "exceptional";
  points: number;
  fun_fact: string;
  photo: File | null;
  photoPreview: string | null;
  is_first_unlock: boolean;
}

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
}

interface SearchResult {
  name: string;
  type: string;
  rarity_tier: string;
  points: number;
  find_count: string;
}

export function DiscoveryEntry({ draft, onChange, onRemove, index }: Props) {
  const [query, setQuery] = useState(draft.name);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [searching, setSearching] = useState(false);
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
    photo: null,
    photoPreview: null,
    is_first_unlock: true,
  };
}
