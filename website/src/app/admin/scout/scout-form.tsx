"use client";

import { useState } from "react";
import { Ornament } from "@/components/atmosphere";

interface Discovery {
  name: string;
  type: string;
  rarity: string;
  tip: string;
}

interface Intel {
  likely_discoveries: Discovery[];
  sunrise_notes: string;
  positioning_tip: string;
  weather_watch: string;
  gear_priority: string;
}

const RARITY_COLORS: Record<string, string> = {
  common: "text-mist-dim",
  uncommon: "text-teal-light",
  rare: "text-zora-amber",
  very_rare: "text-sunrise-orange",
  exceptional: "text-amber-light",
};

export function ScoutForm() {
  const [location, setLocation] = useState("");
  const [region, setRegion] = useState("Arizona");
  const [country, setCountry] = useState("US");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);
  const [intel, setIntel] = useState<Intel | null>(null);

  const handleScout = async () => {
    if (!location) return;
    setLoading(true);
    try {
      const res = await fetch("/api/ai-pre-shoot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ location, date, region, country }),
      });
      const data = await res.json();
      if (res.ok) setIntel(data);
    } catch {
      // best effort
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Input form */}
      <div className="bg-pre-dawn-mid border border-rule rounded-md p-5 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block font-mono text-[0.6rem] text-mist-dim/60 uppercase tracking-wider mb-1">
              location
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Lost Dutchman State Park"
              className="w-full rounded-md border border-rule bg-pre-dawn-light px-3 py-2 text-sm text-dawn-mist placeholder:text-mist-dim/30 focus:border-zora-amber/50 focus:outline-none font-body"
            />
          </div>
          <div>
            <label className="block font-mono text-[0.6rem] text-mist-dim/60 uppercase tracking-wider mb-1">
              date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-md border border-rule bg-pre-dawn-light px-3 py-2 text-sm text-dawn-mist focus:border-zora-amber/50 focus:outline-none"
            />
          </div>
          <div>
            <label className="block font-mono text-[0.6rem] text-mist-dim/60 uppercase tracking-wider mb-1">
              region / state
            </label>
            <input
              type="text"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="w-full rounded-md border border-rule bg-pre-dawn-light px-3 py-2 text-sm text-dawn-mist focus:border-zora-amber/50 focus:outline-none font-body"
            />
          </div>
          <div>
            <label className="block font-mono text-[0.6rem] text-mist-dim/60 uppercase tracking-wider mb-1">
              country
            </label>
            <input
              type="text"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full rounded-md border border-rule bg-pre-dawn-light px-3 py-2 text-sm text-dawn-mist focus:border-zora-amber/50 focus:outline-none font-body"
            />
          </div>
        </div>
        <button
          onClick={handleScout}
          disabled={loading || !location}
          className="w-full rounded-md bg-eos-teal px-4 py-2.5 text-sm font-medium text-pre-dawn transition-colors hover:bg-eos-teal/90 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? "scouting..." : "generate pre-shoot intel"}
        </button>
      </div>

      {/* Intel results */}
      {intel && (
        <div className="space-y-6">
          <Ornament label="Sunrise" />
          <p className="text-dawn-mist">{intel.sunrise_notes}</p>

          <Ornament label="Positioning" />
          <p className="text-dawn-mist">{intel.positioning_tip}</p>

          <Ornament label="Likely discoveries" />
          <div className="bg-pre-dawn-mid border border-rule rounded-md">
            {intel.likely_discoveries.map((d, i) => (
              <div
                key={d.name}
                className={`flex items-center justify-between px-5 py-3 ${
                  i < intel.likely_discoveries.length - 1
                    ? "border-b border-dawn-mist/[0.05]"
                    : ""
                }`}
              >
                <div>
                  <span className="font-display text-sm text-dawn-mist">
                    {d.name}
                  </span>
                  <span className="ml-2 font-mono text-[0.6rem] text-mist-dim">
                    {d.type}
                  </span>
                </div>
                <div className="text-right">
                  <span className={`font-mono text-[0.6rem] uppercase tracking-wider ${RARITY_COLORS[d.rarity]}`}>
                    {d.rarity.replace("_", " ")}
                  </span>
                  <p className="text-[0.6rem] text-mist-dim/50 mt-0.5">{d.tip}</p>
                </div>
              </div>
            ))}
          </div>

          <Ornament label="Conditions" />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="bg-pre-dawn-mid border border-rule rounded-md p-4">
              <p className="font-mono text-[0.6rem] text-mist-dim/60 uppercase tracking-wider mb-2">
                weather watch
              </p>
              <p className="text-sm text-dawn-mist">{intel.weather_watch}</p>
            </div>
            <div className="bg-pre-dawn-mid border border-rule rounded-md p-4">
              <p className="font-mono text-[0.6rem] text-mist-dim/60 uppercase tracking-wider mb-2">
                gear priority
              </p>
              <p className="text-sm text-dawn-mist">{intel.gear_priority}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
