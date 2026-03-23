"use client";

import { useState } from "react";
import type { EosSubScores } from "@/components/expedition-card";

interface Props {
  total: number;
  sub: EosSubScores;
  size?: "sm" | "lg";
}

const LABELS = [
  { key: "ci" as const, label: "Color intensity", max: 20, group: "sky" },
  { key: "ce" as const, label: "Cloud engagement", max: 15, group: "sky" },
  { key: "hd" as const, label: "Horizon definition", max: 15, group: "sky" },
  { key: "fc" as const, label: "Foreground composition", max: 15, group: "setting" },
  { key: "lu" as const, label: "Location uniqueness", max: 15, group: "setting" },
  { key: "ad" as const, label: "Access difficulty", max: 10, group: "conditions" },
  { key: "wc" as const, label: "Weather challenge", max: 10, group: "conditions" },
];

const GROUP_COLORS = {
  sky: "text-zora-amber",
  setting: "text-teal-light",
  conditions: "text-sunrise-orange",
};

const BAR_COLORS = {
  sky: "bg-zora-amber/50",
  setting: "bg-teal-light/50",
  conditions: "bg-sunrise-orange/50",
};

/** Clickable Eos Index number that expands to show sub-score breakdown. */
export function EosExpandable({ total, sub, size = "sm" }: Props) {
  const [open, setOpen] = useState(false);

  const skyTotal = sub.ci + sub.ce + sub.hd;
  const settingTotal = sub.fc + sub.lu;
  const conditionsTotal = sub.ad + sub.wc;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`font-mono font-bold text-teal-light hover:text-teal-light/80 transition-colors cursor-pointer ${
          size === "lg" ? "text-2xl" : ""
        }`}
        title="Click to expand Eos Index breakdown"
      >
        {total}
        <span className="text-teal-light/30 text-[0.6em] ml-1">
          {open ? "▲" : "▼"}
        </span>
      </button>

      {open && (
        <div className="absolute z-30 top-full mt-2 right-0 bg-pre-dawn-mid border border-rule rounded-md p-4 shadow-xl min-w-[280px]">
          {/* Group totals */}
          <div className="flex gap-4 mb-3 pb-3 border-b border-rule font-mono text-xs">
            <span className="text-zora-amber">Sky {skyTotal}/50</span>
            <span className="text-teal-light">Setting {settingTotal}/30</span>
            <span className="text-sunrise-orange">Conditions {conditionsTotal}/20</span>
          </div>

          {/* Individual scores */}
          <div className="space-y-2">
            {LABELS.map(({ key, label, max, group }) => {
              const val = sub[key];
              const pct = (val / max) * 100;
              return (
                <div key={key}>
                  <div className="flex justify-between font-mono text-[0.65rem] mb-0.5">
                    <span className="text-mist-dim">{label}</span>
                    <span className={GROUP_COLORS[group as keyof typeof GROUP_COLORS]}>
                      {val}/{max}
                    </span>
                  </div>
                  <div className="h-1 rounded-full bg-dawn-mist/10">
                    <div
                      className={`h-full rounded-full ${BAR_COLORS[group as keyof typeof BAR_COLORS]}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Total */}
          <div className="mt-3 pt-2 border-t border-rule flex justify-between font-mono text-xs">
            <span className="text-mist-dim">Eos Index</span>
            <span className="text-teal-light font-bold">{total}/100</span>
          </div>
        </div>
      )}
    </div>
  );
}
