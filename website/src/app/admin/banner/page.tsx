"use client";

import { useRef, useEffect, useState } from "react";

/**
 * YouTube banner dimensions:
 * - Full image: 2560 x 1440
 * - Safe area (visible on all devices): 1546 x 423, centered
 * - Desktop min: 2560 x 423
 * - Mobile: narrower crop from center
 */
const FULL_W = 2560;
const FULL_H = 1440;
const SAFE_X = (FULL_W - 1546) / 2; // 507
const SAFE_Y = (FULL_H - 423) / 2;  // 508.5
const SAFE_W = 1546;
const SAFE_H = 423;

export default function BannerPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [sunProgress, setSunProgress] = useState(0.55); // peak amber by default
  const [showGuides, setShowGuides] = useState(true);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const c = cv.getContext("2d");
    if (!c) return;

    cv.width = FULL_W;
    cv.height = FULL_H;

    const W = FULL_W;
    const H = FULL_H;

    // Sun position
    const horizonY = H * 0.75;
    const sunY = horizonY + 60 - sunProgress * 120;
    const sunX = W * 0.5;
    const sunR = 40;

    c.clearRect(0, 0, W, H);

    // Sky gradient with peak amber intensity
    const preCrest = Math.exp(-Math.pow((sunProgress - 0.55) / 0.2, 2));
    const warmth = sunProgress * 0.3;
    const intensity = warmth + preCrest * 0.7;

    const skyGrad = c.createLinearGradient(0, 0, 0, H);
    skyGrad.addColorStop(0, `rgba(13,15,20,${1 - intensity * 0.4})`);
    skyGrad.addColorStop(0.35, `rgba(${13 + intensity * 80},${15 + intensity * 25},${20 + intensity * 5},1)`);
    skyGrad.addColorStop(0.65, `rgba(${30 + intensity * 150},${15 + intensity * 50},${10 + intensity * 10},${0.3 + intensity})`);
    skyGrad.addColorStop(1, `rgba(${50 + intensity * 180},${20 + intensity * 70},${10 + intensity * 15},${0.3 + intensity})`);
    c.fillStyle = skyGrad;
    c.fillRect(0, 0, W, H);

    // Stars (faded at this sun progress)
    const starAlpha = Math.max(0, 1 - sunProgress * 1.5);
    if (starAlpha > 0) {
      const rng = (seed: number) => {
        let s = seed;
        return () => { s = (s * 16807 + 0) % 2147483647; return s / 2147483647; };
      };
      const rand = rng(42);
      for (let i = 0; i < 120; i++) {
        const sx = rand() * W;
        const sy = rand() * H * 0.6;
        const sr = rand() * 2 + 0.5;
        const sa = (rand() * 0.4 + 0.3) * starAlpha;
        if (sa < 0.05) continue;
        const isAmber = rand() < 0.15;
        c.beginPath();
        c.arc(sx, sy, sr, 0, Math.PI * 2);
        c.fillStyle = isAmber
          ? `rgba(240,165,0,${sa})`
          : `rgba(200,212,224,${sa})`;
        c.fill();
      }
    }

    // Mountain ridge data
    const scX = W / 780;
    const mtHeight = H * 0.35;
    const mtBase = H;
    const ridgeScale = (y: number) => mtBase - (160 - y) * (mtHeight / 160);

    const ridgePoints: [number, number][] = [
      [0, 160], [70, 105], [130, 125], [200, 80], [280, 100],
      [360, 58], [440, 82], [520, 50], [600, 72], [680, 42],
      [740, 65], [780, 55],
    ];

    const clipAboveRidge = () => {
      c.beginPath();
      c.moveTo(0, 0);
      c.lineTo(W, 0);
      for (let i = ridgePoints.length - 1; i >= 0; i--) {
        c.lineTo(ridgePoints[i][0] * scX, ridgeScale(ridgePoints[i][1]));
      }
      c.closePath();
    };

    // Sun glow
    if (sunProgress > 0.05) {
      c.save();
      clipAboveRidge();
      c.clip();
      const glowR = 80 + sunProgress * 150;
      const glow = c.createRadialGradient(sunX, sunY, 0, sunX, sunY, glowR);
      const glowIntensity = Math.min(sunProgress * 0.6, 0.3) + preCrest * 0.35;
      glow.addColorStop(0, `rgba(240,165,0,${glowIntensity})`);
      glow.addColorStop(0.3, `rgba(232,82,10,${glowIntensity * 0.5})`);
      glow.addColorStop(1, "rgba(232,82,10,0)");
      c.fillStyle = glow;
      c.fillRect(0, 0, W, H);
      c.restore();
    }

    // Crepuscular rays
    if (sunProgress > 0.08) {
      c.save();
      clipAboveRidge();
      c.clip();
      const rayCount = 16;
      const raySpread = Math.PI * 0.7;
      const rayAlpha = Math.min(sunProgress * 0.4, 0.15);
      const maxRayLen = 150 + sunProgress * 400;

      for (let i = 0; i < rayCount; i++) {
        const baseAngle = -Math.PI / 2;
        const spread = (i / (rayCount - 1) - 0.5) * raySpread;
        const a = baseAngle + spread;
        const lenVar = 0.6 + Math.sin(i * 2.3) * 0.4;
        const rayLen = maxRayLen * lenVar;
        const halfWidth = 2 + sunProgress * 5 + Math.sin(i * 3.1) * 2;
        const perpX = Math.cos(a + Math.PI / 2);
        const perpY = Math.sin(a + Math.PI / 2);
        const endX = sunX + Math.cos(a) * rayLen;
        const endY = sunY + Math.sin(a) * rayLen;

        const rayGrad = c.createLinearGradient(sunX, sunY, endX, endY);
        const thisAlpha = rayAlpha * (0.5 + Math.sin(i * 0.9) * 0.3);
        rayGrad.addColorStop(0, `rgba(255,200,80,${thisAlpha})`);
        rayGrad.addColorStop(0.3, `rgba(240,165,0,${thisAlpha * 0.6})`);
        rayGrad.addColorStop(1, "rgba(232,82,10,0)");

        c.beginPath();
        c.moveTo(sunX + perpX * halfWidth * 0.3, sunY + perpY * halfWidth * 0.3);
        c.lineTo(endX + perpX * halfWidth, endY + perpY * halfWidth);
        c.lineTo(endX - perpX * halfWidth, endY - perpY * halfWidth);
        c.lineTo(sunX - perpX * halfWidth * 0.3, sunY - perpY * halfWidth * 0.3);
        c.closePath();
        c.fillStyle = rayGrad;
        c.fill();
      }
      c.restore();
    }

    // Sun disk
    if (sunY < horizonY + sunR) {
      c.save();
      clipAboveRidge();
      c.clip();

      const outerGlow = c.createRadialGradient(sunX, sunY, sunR * 0.7, sunX, sunY, sunR * 3);
      outerGlow.addColorStop(0, "rgba(255,220,120,0.35)");
      outerGlow.addColorStop(0.4, "rgba(240,165,0,0.12)");
      outerGlow.addColorStop(1, "rgba(232,82,10,0)");
      c.beginPath();
      c.arc(sunX, sunY, sunR * 3, 0, Math.PI * 2);
      c.fillStyle = outerGlow;
      c.fill();

      c.beginPath();
      c.arc(sunX, sunY, sunR, 0, Math.PI * 2);
      const diskGrad = c.createRadialGradient(sunX, sunY, 0, sunX, sunY, sunR);
      diskGrad.addColorStop(0, "rgba(255,252,230,0.95)");
      diskGrad.addColorStop(0.4, "rgba(255,230,150,0.9)");
      diskGrad.addColorStop(0.8, "rgba(240,180,60,0.85)");
      diskGrad.addColorStop(1, "rgba(232,120,20,0.7)");
      c.fillStyle = diskGrad;
      c.fill();

      c.restore();
    }

    // Mountain layers
    // Layer 1: far ridge
    c.beginPath();
    for (let i = 0; i < ridgePoints.length; i++) {
      const [px, py] = ridgePoints[i];
      if (i === 0) c.moveTo(px * scX, ridgeScale(py));
      else c.lineTo(px * scX, ridgeScale(py));
    }
    c.lineTo(W, H);
    c.lineTo(0, H);
    c.closePath();
    c.fillStyle = "rgba(20,24,32,0.55)";
    c.fill();

    // Layer 2: mid ridge
    const midRidge: [number, number][] = [
      [0, 148], [60, 155], [130, 140], [200, 152], [280, 135],
      [360, 148], [440, 130], [520, 145], [600, 136], [680, 148], [780, 138],
    ];
    c.beginPath();
    for (let i = 0; i < midRidge.length; i++) {
      const [px, py] = midRidge[i];
      if (i === 0) c.moveTo(px * scX, ridgeScale(py));
      else c.lineTo(px * scX, ridgeScale(py));
    }
    c.lineTo(W, H);
    c.lineTo(0, H);
    c.closePath();
    c.fillStyle = "rgba(20,24,32,0.85)";
    c.fill();

    // Layer 3: foreground
    const fgRidge: [number, number][] = [
      [0, 158], [90, 162], [200, 155], [320, 160],
      [440, 153], [560, 159], [680, 154], [780, 158],
    ];
    c.beginPath();
    for (let i = 0; i < fgRidge.length; i++) {
      const [px, py] = fgRidge[i];
      if (i === 0) c.moveTo(px * scX, ridgeScale(py));
      else c.lineTo(px * scX, ridgeScale(py));
    }
    c.lineTo(W, H);
    c.lineTo(0, H);
    c.closePath();
    c.fillStyle = "#0D0F14";
    c.fill();

    // Saguaro cacti
    c.fillStyle = "#0D0F14";
    const drawSaguaro = (cx: number, baseY: number, height: number, arms: Array<{ side: -1 | 1; hPct: number; reach: number; rise: number }>) => {
      const tw = 8;
      const armW = 6;
      const r = tw / 2;

      c.beginPath();
      c.roundRect(cx - tw / 2, baseY - height, tw, height, [r, r, 0, 0]);
      c.fill();

      for (const arm of arms) {
        const armBase = baseY - height * arm.hPct;
        const reach = arm.reach * arm.side;
        const elbowX = cx + reach;
        const elbowR = armW / 2;

        c.beginPath();
        c.roundRect(
          Math.min(cx, elbowX),
          armBase - armW / 2,
          Math.abs(reach) + armW / 2,
          armW,
          elbowR
        );
        c.fill();

        c.beginPath();
        c.roundRect(elbowX - armW / 2, armBase - arm.rise, armW, arm.rise, [elbowR, elbowR, 0, 0]);
        c.fill();
      }
    };

    // Left saguaro
    drawSaguaro(W * 0.37, ridgeScale(152), 95, [
      { side: -1, hPct: 0.55, reach: 20, rise: 35 },
      { side: 1, hPct: 0.38, reach: 16, rise: 28 },
    ]);

    // Right saguaro
    drawSaguaro(W * 0.63, ridgeScale(154), 70, [
      { side: 1, hPct: 0.5, reach: 18, rise: 30 },
    ]);

    // --- Text ---
    // Title: "The Zora Files"
    c.textAlign = "center";
    c.textBaseline = "middle";

    // Title shadow
    c.save();
    c.shadowColor = "rgba(240,165,0,0.3)";
    c.shadowBlur = 60;
    c.font = "bold 120px 'Cinzel Decorative', serif";
    c.fillStyle = "#F0A500";
    c.fillText("The Zora Files", W / 2, SAFE_Y + SAFE_H * 0.4);
    c.restore();

    // Title crisp
    c.font = "bold 120px 'Cinzel Decorative', serif";
    c.fillStyle = "#F0A500";
    c.fillText("The Zora Files", W / 2, SAFE_Y + SAFE_H * 0.4);

    // Subtitle
    c.font = "400 36px 'Cinzel', serif";
    c.fillStyle = "rgba(200,212,224,0.85)";
    c.fillText("early to rise", W / 2, SAFE_Y + SAFE_H * 0.62);

    // Ornament line
    const lineY = SAFE_Y + SAFE_H * 0.52;
    const lineW = 200;
    const lineGrad = c.createLinearGradient(W / 2 - lineW, lineY, W / 2 + lineW, lineY);
    lineGrad.addColorStop(0, "transparent");
    lineGrad.addColorStop(0.5, "rgba(240,165,0,0.5)");
    lineGrad.addColorStop(1, "transparent");
    c.strokeStyle = lineGrad;
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(W / 2 - lineW, lineY);
    c.lineTo(W / 2 + lineW, lineY);
    c.stroke();

    // Safe area guides (optional)
    if (showGuides) {
      c.strokeStyle = "rgba(255,0,0,0.3)";
      c.lineWidth = 2;
      c.setLineDash([10, 10]);
      c.strokeRect(SAFE_X, SAFE_Y, SAFE_W, SAFE_H);
      c.setLineDash([]);

      // Desktop area
      c.strokeStyle = "rgba(0,255,0,0.2)";
      c.setLineDash([10, 10]);
      c.strokeRect(0, SAFE_Y, FULL_W, SAFE_H);
      c.setLineDash([]);

      // Labels
      c.font = "14px monospace";
      c.fillStyle = "rgba(255,0,0,0.5)";
      c.textAlign = "left";
      c.fillText("safe area (all devices)", SAFE_X + 8, SAFE_Y + 20);
      c.fillStyle = "rgba(0,255,0,0.4)";
      c.fillText("desktop visible", 8, SAFE_Y + 20);
    }

  }, [sunProgress, showGuides]);

  const handleDownload = () => {
    const cv = canvasRef.current;
    if (!cv) return;

    // Re-render without guides
    const prev = showGuides;
    setShowGuides(false);

    // Need a tick for re-render, then download
    setTimeout(() => {
      const link = document.createElement("a");
      link.download = "the-zora-files-youtube-banner.png";
      link.href = cv.toDataURL("image/png");
      link.click();
      setShowGuides(prev);
    }, 100);
  };

  return (
    <div className="max-w-[1200px] mx-auto px-8 py-16">
      <h1 className="font-display-ornate text-3xl text-zora-amber mb-2">
        youtube banner
      </h1>
      <p className="text-mist-dim mb-6">
        2560 x 1440. Red dashes = safe area (visible on all devices). Green = desktop visible.
      </p>

      <div className="space-y-4">
        {/* Controls */}
        <div className="flex flex-wrap items-center gap-6">
          <div>
            <label className="block font-mono text-[0.6rem] text-mist-dim/60 uppercase tracking-wider mb-1">
              sun position ({Math.round(sunProgress * 100)}%)
            </label>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(sunProgress * 100)}
              onChange={(e) => setSunProgress(parseInt(e.target.value) / 100)}
              className="w-48"
            />
          </div>
          <label className="flex items-center gap-2 font-mono text-xs text-mist-dim cursor-pointer">
            <input
              type="checkbox"
              checked={showGuides}
              onChange={(e) => setShowGuides(e.target.checked)}
            />
            show safe area guides
          </label>
          <button
            onClick={handleDownload}
            className="rounded-md bg-eos-teal px-4 py-2 text-sm font-medium text-pre-dawn transition-colors hover:bg-eos-teal/90"
          >
            download PNG
          </button>
        </div>

        {/* Canvas preview (scaled down to fit) */}
        <div className="border border-rule rounded-md overflow-hidden">
          <canvas
            ref={canvasRef}
            style={{ width: "100%", height: "auto" }}
          />
        </div>

        <p className="font-mono text-[0.6rem] text-mist-dim/40">
          Tip: set sun position to ~55% for peak amber glow, ~75% for sun just cresting the ridge
        </p>
      </div>
    </div>
  );
}
