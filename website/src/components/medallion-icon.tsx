"use client";

import { useRef, useEffect } from "react";
import { LEVELS } from "@/lib/types";

/** Tiny medallion emblem for the share card — just the coin face with center initial. */
export function MedallionIcon({
  level,
  gems,
  size = 48,
}: {
  level: number;
  gems: number;
  size?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const levelInfo = LEVELS[Math.min(level, 10)];

  // Simplified palette
  const COLORS: Record<number, { bg: string; text: string; gem: string }> = {
    0: { bg: "#787880", text: "#C0C0C8", gem: "" },
    1: { bg: "#B06830", text: "#E8B080", gem: "#E87090" },
    2: { bg: "#A06830", text: "#D0A070", gem: "#E8A020" },
    3: { bg: "#A08030", text: "#D8B860", gem: "#E8C020" },
    4: { bg: "#B06848", text: "#E0A090", gem: "#E87048" },
    5: { bg: "#788890", text: "#B8C8D0", gem: "#40C0B8" },
    6: { bg: "#888890", text: "#C8C8D0", gem: "#A060D0" },
    7: { bg: "#886020", text: "#B89040", gem: "#D02020" },
    8: { bg: "#487860", text: "#78A890", gem: "#20B890" },
    9: { bg: "#606068", text: "#909098", gem: "#C0C0D0" },
    10: { bg: "#C0B8A8", text: "#E8E0D0", gem: "#D0E0F0" },
  };

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const c = cv.getContext("2d");
    if (!c) return;

    const S = 200, CX = 100, CY = 100, R = 90;
    c.clearRect(0, 0, S, S);

    const colors = COLORS[Math.min(level, 10)];

    // Coin face
    const fg = c.createRadialGradient(CX - 20, CY - 20, 0, CX, CY, R);
    fg.addColorStop(0, colors.text);
    fg.addColorStop(1, colors.bg);
    c.beginPath();
    c.arc(CX, CY, R, 0, Math.PI * 2);
    c.fillStyle = fg;
    c.fill();

    // Rim
    c.beginPath();
    c.arc(CX, CY, R, 0, Math.PI * 2);
    c.strokeStyle = "rgba(0,0,0,0.3)";
    c.lineWidth = 3;
    c.stroke();

    // Center letter
    c.font = "bold 48px monospace";
    c.fillStyle = colors.bg;
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.globalAlpha = 0.6;
    c.fillText(levelInfo.title.charAt(0), CX, CY + 2);
    c.globalAlpha = 1;

    // Gem dots around the edge
    if (level > 0 && colors.gem) {
      for (let i = 0; i < 6; i++) {
        const a = i / 6 * Math.PI * 2 - Math.PI / 2;
        const gx = CX + Math.cos(a) * 72;
        const gy = CY + Math.sin(a) * 72;
        c.beginPath();
        c.arc(gx, gy, 6, 0, Math.PI * 2);
        c.fillStyle = i < gems ? colors.gem : "rgba(0,0,0,0.25)";
        c.fill();
      }
    }
  }, [level, gems, levelInfo]);

  return (
    <canvas
      ref={canvasRef}
      width={200}
      height={200}
      style={{ width: size, height: size, display: "block" }}
    />
  );
}
