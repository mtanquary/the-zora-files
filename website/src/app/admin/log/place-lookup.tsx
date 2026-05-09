"use client";

import { useEffect, useRef, useState } from "react";

interface GeocodeFeature {
  id: string;
  name: string;
  place_formatted: string;
  full_address: string;
  lat: number;
  lng: number;
}

interface PlaceLookupProps {
  token: string | null;
  onPick: (lat: number, lng: number, label: string) => void;
  proximity?: { lat: number; lng: number } | null;
  initialQuery?: string;
}

export function PlaceLookup({ token, onPick, proximity, initialQuery }: PlaceLookupProps) {
  const [query, setQuery] = useState(initialQuery ?? "");
  const [results, setResults] = useState<GeocodeFeature[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Debounced search
  useEffect(() => {
    if (!token) return;
    const q = query.trim();
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    if (q.length < 3) {
      setResults([]);
      return;
    }
    debounceRef.current = window.setTimeout(() => {
      void runSearch(q);
    }, 300);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, token]);

  async function runSearch(q: string) {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        q,
        access_token: token,
        limit: "6",
        types: "poi,place,address,locality,neighborhood,district,region",
      });
      if (proximity) {
        params.set("proximity", `${proximity.lng},${proximity.lat}`);
      }
      const res = await fetch(
        `https://api.mapbox.com/search/geocode/v6/forward?${params.toString()}`
      );
      if (!res.ok) {
        setError(`lookup failed (${res.status})`);
        setResults([]);
        return;
      }
      const data = (await res.json()) as {
        features?: Array<{
          id: string;
          properties?: {
            name?: string;
            place_formatted?: string;
            full_address?: string;
          };
          geometry?: { type: string; coordinates: [number, number] };
        }>;
      };
      const features: GeocodeFeature[] = (data.features ?? [])
        .filter((f) => f.geometry?.type === "Point")
        .map((f) => ({
          id: f.id,
          name: f.properties?.name ?? "",
          place_formatted:
            f.properties?.place_formatted ?? f.properties?.full_address ?? "",
          full_address: f.properties?.full_address ?? "",
          lng: f.geometry!.coordinates[0],
          lat: f.geometry!.coordinates[1],
        }));
      setResults(features);
      setOpen(features.length > 0);
    } catch {
      setError("network error");
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  function pick(f: GeocodeFeature) {
    onPick(f.lat, f.lng, f.name || f.place_formatted);
    setOpen(false);
    setQuery(f.name || f.place_formatted);
  }

  if (!token) {
    return (
      <p className="text-xs text-dawn-mist/40 italic">
        Place lookup needs <code className="text-dawn-mist/60">NEXT_PUBLIC_MAPBOX_TOKEN</code>.
      </p>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Search a place — e.g. Horton Spring, Arizona"
          className="flex-1 rounded-lg border border-dawn-mist/10 bg-dawn-mist/5 px-3 py-2 text-sm text-dawn-mist placeholder:text-dawn-mist/20 focus:border-zora-amber/50 focus:outline-none"
        />
        {loading && (
          <span className="self-center text-xs text-dawn-mist/40 font-mono">
            searching…
          </span>
        )}
      </div>
      {error && (
        <p className="mt-1 text-xs text-sunrise-orange">{error}</p>
      )}
      {open && results.length > 0 && (
        <ul className="absolute z-30 mt-1 left-0 right-0 max-h-72 overflow-y-auto rounded-lg border border-rule bg-pre-dawn-mid shadow-lg shadow-black/40">
          {results.map((f) => (
            <li key={f.id}>
              <button
                type="button"
                onClick={() => pick(f)}
                className="block w-full text-left px-3 py-2 hover:bg-zora-amber/10 transition-colors"
              >
                <p className="text-sm text-dawn-mist truncate">
                  {f.name || f.place_formatted || f.full_address}
                </p>
                {f.place_formatted && f.name && (
                  <p className="text-[0.65rem] text-mist-dim/70 truncate">
                    {f.place_formatted}
                  </p>
                )}
                <p className="font-mono text-[0.6rem] text-mist-dim/50 mt-0.5">
                  {f.lat.toFixed(5)}, {f.lng.toFixed(5)}
                </p>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
