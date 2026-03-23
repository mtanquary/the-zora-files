"use client";

import { useRef, useEffect } from "react";

interface Props {
  level: number;
  size?: number;
}

/**
 * Renders the level emblem icon at card size.
 * Each level has its own hand-drawn emblem matching the medallion artifacts.
 */
export function LevelEmblem({ level, size = 44 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const c = cv.getContext("2d");
    if (!c) return;
    const S = 200, CX = 100, CY = 100;

    c.clearRect(0, 0, S, S);

    // Background circle
    c.beginPath();
    c.arc(CX, CY, 92, 0, Math.PI * 2);
    c.fillStyle = "rgba(13,15,20,0.75)";
    c.fill();
    c.strokeStyle = "rgba(200,212,224,0.2)";
    c.lineWidth = 2;
    c.stroke();

    const draw = EMBLEMS[Math.min(level, 10)];
    draw(c, CX, CY);
  }, [level]);

  return (
    <canvas
      ref={canvasRef}
      width={200}
      height={200}
      style={{ width: size, height: size, display: "block" }}
    />
  );
}

type DrawFn = (c: CanvasRenderingContext2D, cx: number, cy: number) => void;

const EMBLEMS: DrawFn[] = [
  // 0 — Scout: Compass rose
  (c, cx, cy) => {
    const col = "rgba(200,200,210,0.7)";
    const colDark = "rgba(140,140,155,0.5)";

    // 4 intermediate points
    for (let i = 0; i < 4; i++) {
      const a = i * Math.PI / 2 + Math.PI / 4;
      const co = Math.cos(a), si = Math.sin(a);
      const px = -si, py = co;
      const len = 28, w = 6;
      c.beginPath();
      c.moveTo(cx + co * len, cy + si * len);
      c.lineTo(cx + px * w, cy + py * w);
      c.lineTo(cx, cy);
      c.lineTo(cx - px * w, cy - py * w);
      c.closePath();
      c.fillStyle = colDark;
      c.fill();
    }

    // 4 cardinal points
    const lengths = [42, 34, 34, 34]; // N tallest
    for (let i = 0; i < 4; i++) {
      const a = -Math.PI / 2 + i * Math.PI / 2;
      const co = Math.cos(a), si = Math.sin(a);
      const px = -si, py = co;
      const len = lengths[i], w = 9;

      // Light half
      c.beginPath();
      c.moveTo(cx + co * len, cy + si * len);
      c.lineTo(cx + px * w, cy + py * w);
      c.lineTo(cx, cy);
      c.closePath();
      c.fillStyle = col;
      c.fill();

      // Dark half
      c.beginPath();
      c.moveTo(cx + co * len, cy + si * len);
      c.lineTo(cx - px * w, cy - py * w);
      c.lineTo(cx, cy);
      c.closePath();
      c.fillStyle = colDark;
      c.fill();

      // Outline
      c.beginPath();
      c.moveTo(cx + co * len, cy + si * len);
      c.lineTo(cx + px * w, cy + py * w);
      c.lineTo(cx, cy);
      c.lineTo(cx - px * w, cy - py * w);
      c.closePath();
      c.strokeStyle = "rgba(200,200,220,0.3)";
      c.lineWidth = 0.8;
      c.stroke();
    }

    // Center dot
    c.beginPath();
    c.arc(cx, cy, 5, 0, Math.PI * 2);
    c.fillStyle = col;
    c.fill();
  },

  // 1 — Trailhead: Cairn (stacked stones)
  (c, cx, cy) => {
    const stones = [
      { cx, cy: cy + 18, rx: 30, ry: 11 },
      { cx, cy: cy - 2, rx: 21, ry: 10 },
      { cx, cy: cy - 20, rx: 14, ry: 8 },
    ];
    const colors = [
      { hi: "#E8A878", lo: "#7A3818" },
      { hi: "#DCA070", lo: "#6A3010" },
      { hi: "#F0B888", lo: "#8A4820" },
    ];
    stones.forEach((s, i) => {
      const gr = c.createRadialGradient(s.cx - s.rx * 0.25, s.cy - s.ry * 0.3, 0, s.cx, s.cy, Math.max(s.rx, s.ry) * 1.1);
      gr.addColorStop(0, colors[i].hi);
      gr.addColorStop(1, colors[i].lo);
      c.beginPath();
      c.ellipse(s.cx, s.cy, s.rx, s.ry, 0, 0, Math.PI * 2);
      c.fillStyle = gr;
      c.fill();
      c.strokeStyle = "rgba(195,138,50,0.5)";
      c.lineWidth = 0.8;
      c.stroke();
    });
  },

  // 2 — Desert Fox: Fox head silhouette
  (c, cx, cy) => {
    const s = 0.65;
    const fpx = (x: number) => cx + x * s;
    const fpy = (y: number) => cy + y * s;

    c.beginPath();
    c.moveTo(fpx(0), fpy(-34));
    // Right ear
    c.lineTo(fpx(8), fpy(-31));
    c.lineTo(fpx(24), fpy(-72));
    c.lineTo(fpx(33), fpy(-33));
    // Right face
    c.lineTo(fpx(46), fpy(-14));
    c.lineTo(fpx(48), fpy(8));
    c.lineTo(fpx(38), fpy(30));
    c.lineTo(fpx(20), fpy(48));
    // Chin
    c.lineTo(fpx(0), fpy(52));
    // Left face (mirror)
    c.lineTo(fpx(-20), fpy(48));
    c.lineTo(fpx(-38), fpy(30));
    c.lineTo(fpx(-48), fpy(8));
    c.lineTo(fpx(-46), fpy(-14));
    // Left ear
    c.lineTo(fpx(-33), fpy(-33));
    c.lineTo(fpx(-24), fpy(-72));
    c.lineTo(fpx(-8), fpy(-31));
    c.closePath();

    const gr = c.createRadialGradient(cx, cy - 10 * s, 0, cx, cy, 50 * s);
    gr.addColorStop(0, "#E8A030");
    gr.addColorStop(1, "#8A4A10");
    c.fillStyle = gr;
    c.fill();

    // Eyes
    c.beginPath();
    c.arc(fpx(-16), fpy(-5), 4 * s, 0, Math.PI * 2);
    c.arc(fpx(16), fpy(-5), 4 * s, 0, Math.PI * 2);
    c.fillStyle = "#FFE060";
    c.fill();

    // Nose
    c.beginPath();
    c.arc(fpx(0), fpy(18), 4 * s, 0, Math.PI * 2);
    c.fillStyle = "#3A1808";
    c.fill();
  },

  // 3 — Dawnchaser: Running figure
  (c, cx, cy) => {
    const col = "#E8C020";
    c.strokeStyle = col;
    c.lineCap = "round";
    c.lineWidth = 4;

    // Head
    c.beginPath();
    c.arc(cx + 8, cy - 32, 8, 0, Math.PI * 2);
    c.fillStyle = col;
    c.fill();

    // Torso
    c.beginPath();
    c.moveTo(cx + 8, cy - 24);
    c.lineTo(cx - 4, cy + 4);
    c.stroke();

    // Front arm
    c.beginPath();
    c.moveTo(cx + 2, cy - 16);
    c.lineTo(cx + 24, cy - 24);
    c.stroke();

    // Back arm
    c.beginPath();
    c.moveTo(cx + 2, cy - 16);
    c.lineTo(cx - 20, cy - 8);
    c.stroke();

    // Front leg
    c.beginPath();
    c.moveTo(cx - 4, cy + 4);
    c.lineTo(cx + 20, cy + 28);
    c.stroke();

    // Back leg
    c.beginPath();
    c.moveTo(cx - 4, cy + 4);
    c.lineTo(cx - 24, cy + 20);
    c.stroke();

    // Motion lines
    c.lineWidth = 1.5;
    c.strokeStyle = "rgba(232,192,32,0.3)";
    for (let i = 0; i < 3; i++) {
      const y = cy - 20 + i * 16;
      c.beginPath();
      c.moveTo(cx - 36, y);
      c.lineTo(cx - 48 - i * 4, y);
      c.stroke();
    }
  },

  // 4 — First Light: Half-sun with beams
  (c, cx, cy) => {
    const hY = cy + 8;
    const sunR = 22;

    // Horizon line
    c.beginPath();
    c.moveTo(cx - 50, hY);
    c.lineTo(cx + 50, hY);
    c.strokeStyle = "rgba(232,82,10,0.4)";
    c.lineWidth = 1;
    c.stroke();

    // Beams
    const beamCount = 9;
    for (let i = 0; i < beamCount; i++) {
      const a = Math.PI + (i / (beamCount - 1)) * Math.PI;
      const inner = sunR + 4;
      const outer = sunR + 22;
      c.beginPath();
      c.moveTo(cx + Math.cos(a) * inner, hY + Math.sin(a) * inner);
      c.lineTo(cx + Math.cos(a) * outer, hY + Math.sin(a) * outer);
      c.strokeStyle = i % 2 === 0 ? "rgba(255,200,80,0.7)" : "rgba(232,82,10,0.5)";
      c.lineWidth = i % 2 === 0 ? 2.5 : 1.5;
      c.stroke();
    }

    // Half-sun
    c.beginPath();
    c.arc(cx, hY, sunR, Math.PI, 0);
    c.closePath();
    const sg = c.createRadialGradient(cx, hY, 0, cx, hY, sunR);
    sg.addColorStop(0, "#FFD848");
    sg.addColorStop(1, "#D85820");
    c.fillStyle = sg;
    c.fill();
  },

  // 5 — Horizon Hunter: Eye with horizon
  (c, cx, cy) => {
    // Almond eye shape
    c.beginPath();
    c.moveTo(cx - 40, cy);
    c.quadraticCurveTo(cx, cy - 28, cx + 40, cy);
    c.quadraticCurveTo(cx, cy + 28, cx - 40, cy);
    c.closePath();
    const eg = c.createLinearGradient(cx - 40, cy, cx + 40, cy);
    eg.addColorStop(0, "#C8E0F0");
    eg.addColorStop(1, "#4878A0");
    c.fillStyle = eg;
    c.fill();

    // Iris
    c.beginPath();
    c.arc(cx, cy, 14, 0, Math.PI * 2);
    const ig = c.createRadialGradient(cx - 3, cy - 3, 0, cx, cy, 14);
    ig.addColorStop(0, "#60E8F8");
    ig.addColorStop(1, "#1868A0");
    c.fillStyle = ig;
    c.fill();

    // Pupil
    c.beginPath();
    c.arc(cx, cy, 5, 0, Math.PI * 2);
    c.fillStyle = "#0A1828";
    c.fill();

    // Catchlight
    c.beginPath();
    c.arc(cx + 3, cy - 3, 2, 0, Math.PI * 2);
    c.fillStyle = "#FFFFFF";
    c.fill();

    // Horizon line through pupil
    c.beginPath();
    c.moveTo(cx - 38, cy);
    c.lineTo(cx + 38, cy);
    c.strokeStyle = "rgba(208,216,224,0.6)";
    c.lineWidth = 0.8;
    c.stroke();
  },

  // 6 — Zora Seeker: Compass rose (violet-platinum)
  (c, cx, cy) => {
    const col = "rgba(200,190,220,0.7)";
    const colDark = "rgba(140,130,170,0.5)";

    for (let i = 0; i < 4; i++) {
      const a = i * Math.PI / 2 + Math.PI / 4;
      const co = Math.cos(a), si = Math.sin(a);
      const px = -si, py = co;
      c.beginPath();
      c.moveTo(cx + co * 24, cy + si * 24);
      c.lineTo(cx + px * 5, cy + py * 5);
      c.lineTo(cx, cy);
      c.lineTo(cx - px * 5, cy - py * 5);
      c.closePath();
      c.fillStyle = colDark;
      c.fill();
    }
    for (let i = 0; i < 4; i++) {
      const a = -Math.PI / 2 + i * Math.PI / 2;
      const co = Math.cos(a), si = Math.sin(a);
      const px = -si, py = co;
      const len = i === 0 ? 38 : 30;
      c.beginPath();
      c.moveTo(cx + co * len, cy + si * len);
      c.lineTo(cx + px * 8, cy + py * 8);
      c.lineTo(cx, cy);
      c.lineTo(cx - px * 8, cy - py * 8);
      c.closePath();
      c.fillStyle = col;
      c.fill();
      c.strokeStyle = "rgba(200,190,220,0.3)";
      c.lineWidth = 0.6;
      c.stroke();
    }
    c.beginPath();
    c.arc(cx, cy, 5, 0, Math.PI * 2);
    const cg = c.createRadialGradient(cx, cy, 0, cx, cy, 5);
    cg.addColorStop(0, "#E8E0F8");
    cg.addColorStop(1, "#8878B0");
    c.fillStyle = cg;
    c.fill();
  },

  // 7 — Dawn Keeper: Lantern with flame
  (c, cx, cy) => {
    const col = "rgba(200,140,50,0.85)";

    // Handle ring
    c.beginPath();
    c.arc(cx, cy - 38, 8, Math.PI, 0);
    c.strokeStyle = col;
    c.lineWidth = 2;
    c.stroke();

    // Top cap
    c.beginPath();
    c.moveTo(cx - 14, cy - 24);
    c.lineTo(cx, cy - 34);
    c.lineTo(cx + 14, cy - 24);
    c.closePath();
    c.fillStyle = col;
    c.fill();

    // Body
    c.fillStyle = "rgba(180,120,40,0.3)";
    c.fillRect(cx - 14, cy - 24, 28, 40);
    c.strokeStyle = col;
    c.lineWidth = 1.5;
    c.strokeRect(cx - 14, cy - 24, 28, 40);

    // Bars
    c.beginPath();
    c.moveTo(cx - 14, cy - 10);
    c.lineTo(cx + 14, cy - 10);
    c.moveTo(cx - 14, cy + 4);
    c.lineTo(cx + 14, cy + 4);
    c.strokeStyle = "rgba(200,140,50,0.4)";
    c.lineWidth = 1;
    c.stroke();

    // Base
    c.fillStyle = col;
    c.fillRect(cx - 18, cy + 16, 36, 6);

    // Flame
    c.beginPath();
    c.moveTo(cx, cy - 18);
    c.bezierCurveTo(cx + 8, cy - 10, cx + 6, cy, cx, cy + 6);
    c.bezierCurveTo(cx - 6, cy, cx - 8, cy - 10, cx, cy - 18);
    c.closePath();
    const fg = c.createRadialGradient(cx, cy - 6, 0, cx, cy - 6, 14);
    fg.addColorStop(0, "#FFE848");
    fg.addColorStop(0.4, "#FF8820");
    fg.addColorStop(1, "#C83010");
    c.fillStyle = fg;
    c.fill();
  },

  // 8 — Eos Adept: Sun disc with eye (teal)
  (c, cx, cy) => {
    const discR = 24;

    // Rays
    for (let i = 0; i < 24; i++) {
      const a = i / 24 * Math.PI * 2;
      c.beginPath();
      c.moveTo(cx + Math.cos(a) * (discR + 2), cy + Math.sin(a) * (discR + 2));
      c.lineTo(cx + Math.cos(a) * (discR + (i % 2 === 0 ? 16 : 10)), cy + Math.sin(a) * (discR + (i % 2 === 0 ? 16 : 10)));
      c.strokeStyle = i % 2 === 0 ? "#60A878" : "#4A9068";
      c.lineWidth = i % 2 === 0 ? 2 : 1;
      c.stroke();
    }

    // Disc
    c.beginPath();
    c.arc(cx, cy, discR, 0, Math.PI * 2);
    const dg = c.createRadialGradient(cx - 5, cy - 5, 0, cx, cy, discR);
    dg.addColorStop(0, "#88C8A0");
    dg.addColorStop(1, "#2A6838");
    c.fillStyle = dg;
    c.fill();

    // Eye inside
    c.beginPath();
    c.moveTo(cx - 16, cy);
    c.quadraticCurveTo(cx, cy - 10, cx + 16, cy);
    c.quadraticCurveTo(cx, cy + 10, cx - 16, cy);
    c.closePath();
    c.fillStyle = "#48E8C8";
    c.fill();

    // Iris + pupil
    c.beginPath();
    c.arc(cx, cy, 5, 0, Math.PI * 2);
    c.fillStyle = "#1D9E75";
    c.fill();
    c.beginPath();
    c.arc(cx, cy, 2, 0, Math.PI * 2);
    c.fillStyle = "#083828";
    c.fill();
  },

  // 9 — Zora Master: Crown
  (c, cx, cy) => {
    const bandY = cy + 10, bandH = 14, bandW = 38;
    const peakH = 40;

    // Band
    c.fillStyle = "#808090";
    c.fillRect(cx - bandW, bandY, bandW * 2, bandH);

    // 5 peaks
    const peaks = 5;
    for (let i = 0; i < peaks; i++) {
      const px = cx - bandW + (i + 0.5) * (bandW * 2 / peaks);
      c.beginPath();
      c.moveTo(px - 8, bandY);
      c.lineTo(px, bandY - peakH + i * 4);
      c.lineTo(px + 8, bandY);
      c.closePath();
      c.fillStyle = "#D0D0E0";
      c.fill();
      c.strokeStyle = "rgba(200,200,220,0.4)";
      c.lineWidth = 0.6;
      c.stroke();

      // Jewel at tip
      c.beginPath();
      c.arc(px, bandY - peakH + i * 4 + 6, 3, 0, Math.PI * 2);
      c.fillStyle = "#E8E0F8";
      c.fill();
    }

    // Band highlight
    c.strokeStyle = "rgba(200,200,220,0.3)";
    c.lineWidth = 0.8;
    c.strokeRect(cx - bandW, bandY, bandW * 2, bandH);
  },

  // 10 — Finding Zora: Radiant Z
  (c, cx, cy) => {
    // Rays from center
    for (let i = 0; i < 12; i++) {
      const a = i / 12 * Math.PI * 2;
      c.beginPath();
      c.moveTo(cx + Math.cos(a) * 20, cy + Math.sin(a) * 20);
      c.lineTo(cx + Math.cos(a) * 44, cy + Math.sin(a) * 44);
      c.strokeStyle = "rgba(240,216,120,0.25)";
      c.lineWidth = 1.5;
      c.stroke();
    }

    // Z
    c.font = "bold 72px monospace";
    c.textAlign = "center";
    c.textBaseline = "middle";

    // Glow
    c.shadowColor = "#FFE060";
    c.shadowBlur = 20;
    const zg = c.createLinearGradient(cx - 30, cy - 30, cx + 30, cy + 30);
    zg.addColorStop(0, "#FFF8E0");
    zg.addColorStop(0.3, "#F0D878");
    zg.addColorStop(0.5, "#FFFFFF");
    zg.addColorStop(0.7, "#F0D878");
    zg.addColorStop(1, "#FFF8E0");
    c.fillStyle = zg;
    c.fillText("Z", cx, cy + 4);
    c.shadowBlur = 0;
  },
];
