"use client";

import { useState } from "react";

interface Props {
  total: number;
  eosIndex: number;
  effortPoints: number;
  effortLabel: string;
  discoveryPoints: number;
  size?: "sm" | "lg";
}

export function ZoraExpandable({
  total,
  eosIndex,
  effortPoints,
  effortLabel,
  discoveryPoints,
  size = "sm",
}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`font-mono font-bold text-amber-light hover:text-amber-light/80 transition-colors cursor-pointer ${
          size === "lg" ? "text-2xl" : ""
        }`}
        title="Click to expand Zora Score breakdown"
      >
        {total}
        <span className="text-amber-light/30 text-[0.6em] ml-1">
          {open ? "\u25B2" : "\u25BC"}
        </span>
      </button>

      {open && (
        <div className="absolute z-30 top-full mt-2 right-0 bg-pre-dawn-mid border border-rule rounded-md p-4 shadow-xl min-w-[220px]">
          {/* Components */}
          <div className="space-y-2.5">
            <div className="flex justify-between font-mono text-xs">
              <span className="text-teal-light">Eos Index</span>
              <span className="text-teal-light font-bold">{eosIndex}</span>
            </div>
            <div className="flex justify-between font-mono text-xs">
              <span className="text-sunrise-orange">Effort · {effortLabel}</span>
              <span className="text-sunrise-orange font-bold">+{effortPoints}</span>
            </div>
            <div className="flex justify-between font-mono text-xs">
              <span className="text-zora-amber">Discovery</span>
              <span className="text-zora-amber font-bold">+{discoveryPoints}</span>
            </div>
          </div>

          {/* Total */}
          <div className="mt-3 pt-2 border-t border-rule flex justify-between font-mono text-xs">
            <span className="text-mist-dim">Zora Score</span>
            <span className="text-amber-light font-bold">{total}</span>
          </div>
        </div>
      )}
    </div>
  );
}
