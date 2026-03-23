"use client";

import { MedallionCanvas } from "./medallion-canvas";

interface Props {
  level: number;
  gems: number;
  streak?: boolean;
  size?: number;
}

/** Static medallion emblem for display (no animation). */
export function MedallionEmblem({ level, gems, streak = false, size = 80 }: Props) {
  return (
    <div className="inline-block" style={{ filter: "drop-shadow(0 1px 6px rgba(0,0,0,0.9)) drop-shadow(0 0 12px rgba(0,0,0,0.6))" }}>
      <MedallionCanvas level={level} gems={gems} streak={streak} size={size} />
    </div>
  );
}
