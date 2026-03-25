"use client";

import { useState } from "react";

export function SeasonRecapButton({ season }: { season: number }) {
  const [recap, setRecap] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ai-season-recap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ season }),
      });
      const data = await res.json();
      if (data.recap) setRecap(data.recap);
    } catch {
      // best effort
    } finally {
      setLoading(false);
    }
  };

  if (recap) {
    return (
      <div className="bg-pre-dawn-mid border border-rule rounded-md p-6">
        <p className="font-mono text-[0.6rem] text-mist-dim/40 uppercase tracking-wider mb-3">
          Season {season} · AI generated recap
        </p>
        <div className="text-dawn-mist leading-relaxed whitespace-pre-wrap">
          {recap}
        </div>
        <button
          onClick={generate}
          className="mt-4 font-mono text-xs text-eos-teal hover:text-teal-light transition-colors"
        >
          regenerate
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={generate}
      disabled={loading}
      className="w-full rounded-md border border-eos-teal/30 bg-eos-teal/5 px-4 py-3 text-sm text-eos-teal transition-colors hover:bg-eos-teal/10 disabled:opacity-40"
    >
      {loading ? "generating recap..." : "generate season recap with AI"}
    </button>
  );
}
