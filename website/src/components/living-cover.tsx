"use client";

import { useEffect, useRef, useState, useCallback } from "react";

/**
 * Living cover: animated stars, rising sun, ambient sky, bird sounds.
 * Renders as a full backdrop behind the cover content.
 */
export function LivingCover({ children }: { children: React.ReactNode }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasInteracted] = useState(false);

  // Track time for sun position
  const startTime = useRef(Date.now());

  // Stars data (generated once)
  const starsRef = useRef<Array<{
    x: number; y: number; r: number; base: number; speed: number; phase: number; amber: boolean;
  }>>([]);


  const initStars = useCallback((w: number, h: number) => {
    const stars = [];
    for (let i = 0; i < 80; i++) {
      stars.push({
        x: Math.random() * w,
        y: Math.random() * h * 0.7,
        r: Math.random() * 1.5 + 0.5,
        base: Math.random() * 0.4 + 0.3,
        speed: Math.random() * 2 + 1,
        phase: Math.random() * Math.PI * 2,
        amber: Math.random() < 0.15,
      });
    }
    starsRef.current = stars;
  }, []);

  // Audio placeholder: bird sounds can be re-enabled here later

  // Canvas animation
  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;

    const resize = () => {
      const rect = cv.parentElement!.getBoundingClientRect();
      cv.width = rect.width * window.devicePixelRatio;
      cv.height = rect.height * window.devicePixelRatio;
      cv.style.width = rect.width + "px";
      cv.style.height = rect.height + "px";
      if (starsRef.current.length === 0) initStars(cv.width, cv.height);
    };
    resize();
    window.addEventListener("resize", resize);

    let raf: number;
    const draw = () => {
      const c = cv.getContext("2d");
      if (!c) return;
      const W = cv.width, H = cv.height;
      const elapsed = (Date.now() - startTime.current) / 1000;

      // Sun position: rises slowly from below horizon to just above
      // Takes ~120 seconds to fully rise
      const sunProgress = Math.min(elapsed / 20, 1);
      const horizonY = H * 0.82;
      const sunY = horizonY + 40 - sunProgress * 80;
      const sunX = W * 0.5;
      const sunR = 20 * window.devicePixelRatio;

      c.clearRect(0, 0, W, H);

      // Sky gradient — intense amber/orange peaks just before sun crests (~60-80%),
      // then dissipates after the sun fully rises
      const skyGrad = c.createLinearGradient(0, 0, 0, H);
      // Intensity peaks mid-rise then fades. Bell curve centered around 0.6 progress.
      const preCrest = Math.exp(-Math.pow((sunProgress - 0.55) / 0.2, 2)); // peaks ~0.55
      const warmth = sunProgress * 0.3;
      const intensity = warmth + preCrest * 0.7; // much stronger amber before crest
      skyGrad.addColorStop(0, `rgba(13,15,20,${1 - intensity * 0.4})`);
      skyGrad.addColorStop(0.4, `rgba(${13 + intensity * 80},${15 + intensity * 25},${20 + intensity * 5},1)`);
      skyGrad.addColorStop(0.7, `rgba(${30 + intensity * 150},${15 + intensity * 50},${10 + intensity * 10},${0.3 + intensity})`);
      skyGrad.addColorStop(1, `rgba(${50 + intensity * 180},${20 + intensity * 70},${10 + intensity * 15},${0.3 + intensity})`);
      c.fillStyle = skyGrad;
      c.fillRect(0, 0, W, H);

      // Twinkling stars (fade as sun rises)
      const starAlpha = Math.max(0, 1 - sunProgress * 1.5);
      if (starAlpha > 0) {
        starsRef.current.forEach(s => {
          const twinkle = Math.sin(elapsed * s.speed + s.phase) * 0.3 + s.base;
          const alpha = twinkle * starAlpha;
          if (alpha < 0.05) return;
          c.beginPath();
          c.arc(s.x, s.y, s.r * window.devicePixelRatio, 0, Math.PI * 2);
          c.fillStyle = s.amber
            ? `rgba(240,165,0,${alpha})`
            : `rgba(200,212,224,${alpha})`;
          c.fill();
        });
      }

      // --- Mountain ridge helpers ---
      // Scale SVG coordinates (780x160 viewBox) to canvas size.
      // Mountains occupy the bottom 35% of canvas height for good definition.
      const scX = W / 780;
      const mtHeight = H * 0.35; // total mountain zone height
      const mtBase = H;          // bottom edge
      const ridgeScale = (y: number) => mtBase - (160 - y) * (mtHeight / 160);

      // Far ridge (tallest peaks) — used for clipping glow/sun/rays
      const ridgePoints: [number, number][] = [
        [0, 160], [70, 105], [130, 125], [200, 80], [280, 100],
        [360, 58], [440, 82], [520, 50], [600, 72], [680, 42],
        [740, 65], [780, 55],
      ];

      const clipAboveRidge = () => {
        c.beginPath();
        c.moveTo(0, 0);
        c.lineTo(W, 0);
        // Trace ridge right-to-left
        for (let i = ridgePoints.length - 1; i >= 0; i--) {
          c.lineTo(ridgePoints[i][0] * scX, ridgeScale(ridgePoints[i][1]));
        }
        c.closePath();
      };

      // Sun glow — visible above ridge only. Intensifies before crest, fades after.
      if (sunProgress > 0.05) {
        c.save();
        clipAboveRidge();
        c.clip();

        const glowR = (80 + sunProgress * 150) * window.devicePixelRatio;
        const glow = c.createRadialGradient(sunX, sunY, 0, sunX, sunY, glowR);
        // Glow peaks before crest then settles
        const glowIntensity = Math.min(sunProgress * 0.6, 0.3) + preCrest * 0.35;
        glow.addColorStop(0, `rgba(240,165,0,${glowIntensity})`);
        glow.addColorStop(0.3, `rgba(232,82,10,${glowIntensity * 0.5})`);
        glow.addColorStop(1, "rgba(232,82,10,0)");
        c.fillStyle = glow;
        c.fillRect(0, 0, W, H);

        c.restore();
      }

      // Crepuscular rays — clipped to above ridge
      if (sunProgress > 0.08) {
        c.save();
        clipAboveRidge();
        c.clip();

        const rayCount = 12;
        const raySpread = Math.PI * 0.6;
        const rayAlpha = Math.min(sunProgress * 0.4, 0.15);
        const maxRayLen = (150 + sunProgress * 300) * window.devicePixelRatio;

        for (let i = 0; i < rayCount; i++) {
          const baseAngle = -Math.PI / 2;
          const spread = (i / (rayCount - 1) - 0.5) * raySpread;
          const angle = baseAngle + spread;
          const wobble = Math.sin(elapsed * 0.3 + i * 1.7) * 0.015;
          const a = angle + wobble;
          const lenVar = 0.6 + Math.sin(i * 2.3) * 0.4;
          const rayLen = maxRayLen * lenVar;
          const halfWidth = (2 + sunProgress * 4 + Math.sin(i * 3.1) * 2) * window.devicePixelRatio;
          const perpX = Math.cos(a + Math.PI / 2);
          const perpY = Math.sin(a + Math.PI / 2);
          const endX = sunX + Math.cos(a) * rayLen;
          const endY = sunY + Math.sin(a) * rayLen;

          const rayGrad = c.createLinearGradient(sunX, sunY, endX, endY);
          const thisAlpha = rayAlpha * (0.5 + Math.sin(elapsed * 0.5 + i * 0.9) * 0.3);
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

      // Sun disk — clipped to ridge. Solid enough at the edge to crest cleanly,
      // warm gradient interior for realism.
      if (sunY < horizonY + sunR) {
        c.save();
        clipAboveRidge();
        c.clip();

        // Soft outer corona
        const outerGlow = c.createRadialGradient(sunX, sunY, sunR * 0.7, sunX, sunY, sunR * 3);
        outerGlow.addColorStop(0, "rgba(255,220,120,0.35)");
        outerGlow.addColorStop(0.4, "rgba(240,165,0,0.12)");
        outerGlow.addColorStop(1, "rgba(232,82,10,0)");
        c.beginPath();
        c.arc(sunX, sunY, sunR * 3, 0, Math.PI * 2);
        c.fillStyle = outerGlow;
        c.fill();

        // Sun disk — bright core fading to solid amber edge
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

      // Draw mountains on canvas (opaque, fully occluding everything behind)
      // Layer 1: far ridge (semi-transparent)
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
      c.beginPath();
      const midRidge: [number, number][] = [
        [0, 148], [60, 155], [130, 140], [200, 152], [280, 135],
        [360, 148], [440, 130], [520, 145], [600, 136], [680, 148], [780, 138],
      ];
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

      // Layer 3: foreground ridge (solid, fully opaque)
      c.beginPath();
      const fgRidge: [number, number][] = [
        [0, 158], [90, 162], [200, 155], [320, 160],
        [440, 153], [560, 159], [680, 154], [780, 158],
      ];
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

      // Two saguaro silhouettes, centered under title, larger-than-life
      c.fillStyle = "#0D0F14";
      const dpr = window.devicePixelRatio;

      const drawSaguaro = (centerX: number, baseY: number, height: number, opts: {
        arms: Array<{ side: -1 | 1; heightPct: number; reach: number; rise: number }>;
      }) => {
        const x = centerX;
        const trunkW = 5 * dpr;
        const armW = 4 * dpr;
        const r = trunkW / 2; // rounded cap radius

        // Trunk
        c.beginPath();
        c.roundRect(x - trunkW / 2, baseY - height, trunkW, height, [r, r, 0, 0]);
        c.fill();

        // Arms
        for (const arm of opts.arms) {
          const armBase = baseY - height * arm.heightPct;
          const reach = arm.reach * dpr * arm.side;
          const rise = arm.rise * dpr;
          const elbowX = x + reach;
          const elbowR = armW / 2;

          // Horizontal part from trunk
          c.beginPath();
          c.roundRect(
            Math.min(x, elbowX) - (arm.side < 0 ? 0 : 0),
            armBase - armW / 2,
            Math.abs(reach) + armW / 2,
            armW,
            elbowR
          );
          c.fill();

          // Vertical part going up
          c.beginPath();
          c.roundRect(elbowX - armW / 2, armBase - rise, armW, rise, [elbowR, elbowR, 0, 0]);
          c.fill();
        }
      };

      // Left saguaro — taller, slightly left of center
      const sag1X = W * 0.38;
      const sag1Base = ridgeScale(152);
      drawSaguaro(sag1X, sag1Base, 55 * dpr, {
        arms: [
          { side: -1, heightPct: 0.55, reach: 12, rise: 22 },
          { side: 1, heightPct: 0.4, reach: 10, rise: 18 },
        ],
      });

      // Right saguaro — shorter, slightly right of center
      const sag2X = W * 0.62;
      const sag2Base = ridgeScale(154);
      drawSaguaro(sag2X, sag2Base, 40 * dpr, {
        arms: [
          { side: 1, heightPct: 0.5, reach: 11, rise: 20 },
        ],
      });

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [initStars]);

  return (
    <section
      className="relative min-h-[35vh] flex flex-col items-center justify-end text-center overflow-hidden px-6 pt-4 pb-24 border-b border-rule cursor-default"
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none"
      />

      {/* Content on top */}
      <div className="relative z-[2]">
        {children}
      </div>

    </section>
  );
}
