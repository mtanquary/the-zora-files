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
      const sunProgress = Math.min(elapsed / 120, 1);
      const horizonY = H * 0.82;
      const sunY = horizonY + 40 - sunProgress * 80;
      const sunX = W * 0.5;
      const sunR = 20 * window.devicePixelRatio;

      c.clearRect(0, 0, W, H);

      // Sky gradient that shifts with sun position
      const skyGrad = c.createLinearGradient(0, 0, 0, H);
      const warmth = sunProgress * 0.3;
      skyGrad.addColorStop(0, `rgba(13,15,20,${1 - warmth * 0.3})`);
      skyGrad.addColorStop(0.5, `rgba(${13 + warmth * 30},${15 + warmth * 10},${20 + warmth * 5},1)`);
      skyGrad.addColorStop(0.8, `rgba(${30 + warmth * 60},${15 + warmth * 20},${10 + warmth * 5},${0.3 + warmth})`);
      skyGrad.addColorStop(1, `rgba(${50 + warmth * 100},${20 + warmth * 40},${10 + warmth * 10},${0.2 + warmth})`);
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

      // Sun glow (behind mountains)
      if (sunProgress > 0.05) {
        const glowR = (80 + sunProgress * 120) * window.devicePixelRatio;
        const glow = c.createRadialGradient(sunX, sunY, 0, sunX, sunY, glowR);
        const glowAlpha = Math.min(sunProgress * 0.6, 0.3);
        glow.addColorStop(0, `rgba(240,165,0,${glowAlpha})`);
        glow.addColorStop(0.3, `rgba(232,82,10,${glowAlpha * 0.5})`);
        glow.addColorStop(1, "rgba(232,82,10,0)");
        c.fillStyle = glow;
        c.fillRect(0, 0, W, H);
      }

      // Sun disk (partially behind horizon)
      if (sunY < horizonY + sunR) {
        c.save();
        c.beginPath();
        c.rect(0, 0, W, horizonY);
        c.clip();

        const diskGrad = c.createRadialGradient(sunX, sunY, 0, sunX, sunY, sunR);
        diskGrad.addColorStop(0, "rgba(255,220,120,0.9)");
        diskGrad.addColorStop(0.5, "rgba(240,165,0,0.7)");
        diskGrad.addColorStop(1, "rgba(232,82,10,0)");
        c.beginPath();
        c.arc(sunX, sunY, sunR, 0, Math.PI * 2);
        c.fillStyle = diskGrad;
        c.fill();

        // Bright core
        const coreGrad = c.createRadialGradient(sunX, sunY, 0, sunX, sunY, sunR * 0.4);
        coreGrad.addColorStop(0, "rgba(255,250,220,0.8)");
        coreGrad.addColorStop(1, "rgba(255,220,120,0)");
        c.beginPath();
        c.arc(sunX, sunY, sunR * 0.4, 0, Math.PI * 2);
        c.fillStyle = coreGrad;
        c.fill();

        c.restore();
      }

      // Crepuscular rays expanding from the sun
      if (sunProgress > 0.08) {
        c.save();
        // Clip to above horizon so rays don't bleed below mountains
        c.beginPath();
        c.rect(0, 0, W, horizonY);
        c.clip();

        const rayCount = 12;
        const raySpread = Math.PI * 0.6; // fan across ~108 degrees above horizon
        const rayAlpha = Math.min(sunProgress * 0.4, 0.15);
        const maxRayLen = (150 + sunProgress * 300) * window.devicePixelRatio;

        for (let i = 0; i < rayCount; i++) {
          // Rays fan upward from sun position
          const baseAngle = -Math.PI / 2; // straight up
          const spread = (i / (rayCount - 1) - 0.5) * raySpread;
          const angle = baseAngle + spread;

          // Each ray has slight animated wobble
          const wobble = Math.sin(elapsed * 0.3 + i * 1.7) * 0.015;
          const a = angle + wobble;

          // Ray length grows slowly, with variation per ray
          const lenVar = 0.6 + Math.sin(i * 2.3) * 0.4;
          const rayLen = maxRayLen * lenVar;

          // Tapered ray: narrow at sun, wider at end
          const halfWidth = (2 + sunProgress * 4 + Math.sin(i * 3.1) * 2) * window.devicePixelRatio;
          const perpX = Math.cos(a + Math.PI / 2);
          const perpY = Math.sin(a + Math.PI / 2);
          const endX = sunX + Math.cos(a) * rayLen;
          const endY = sunY + Math.sin(a) * rayLen;

          // Gradient along the ray
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
      className="relative min-h-[70vh] flex flex-col items-center justify-center text-center overflow-hidden px-6 py-16 border-b border-rule cursor-default"
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none"
      />

      {/* Mountains SVG on top of canvas */}
      <div className="absolute bottom-0 left-0 right-0 pointer-events-none z-[1]">
        <svg
          viewBox="0 0 780 160"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMax meet"
          style={{ width: "100%", maxHeight: 160, display: "block" }}
        >
          <path d="M0 160 L70 105 L130 125 L200 80 L280 100 L360 58 L440 82 L520 50 L600 72 L680 42 L740 65 L780 55 L780 160 Z" fill="#141820" opacity="0.55"/>
          <path d="M0 160 L0 148 L60 155 L130 140 L200 152 L280 135 L360 148 L440 130 L520 145 L600 136 L680 148 L780 138 L780 160 Z" fill="#141820" opacity="0.85"/>
          <path d="M0 160 L0 158 L90 162 L200 155 L320 160 L440 153 L560 159 L680 154 L780 158 L780 160 Z" fill="#0D0F14"/>
          <g fill="#0D0F14">
            <rect x="65" y="134" width="3" height="18"/>
            <path d="M63 144 Q60 141 60 137 L63 137 Z"/>
            <path d="M68 141 Q71 138 71 134 L68 134 Z"/>
            <rect x="290" y="128" width="4" height="22"/>
            <path d="M288 140 Q284 137 284 132 L288 132 Z"/>
            <path d="M294 136 Q298 133 298 128 L294 128 Z"/>
            <rect x="510" y="130" width="3" height="20"/>
            <path d="M508 141 Q505 138 505 133 L508 133 Z"/>
            <rect x="680" y="133" width="4" height="18"/>
            <path d="M678 143 Q675 140 675 135 L678 135 Z"/>
            <path d="M684 140 Q687 137 687 133 L684 133 Z"/>
          </g>
        </svg>
      </div>

      {/* Content on top */}
      <div className="relative z-[2]">
        {children}
      </div>

    </section>
  );
}
