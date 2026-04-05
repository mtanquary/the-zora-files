"use client";

import { useRef, useEffect, useState } from "react";

/**
 * YouTube watermark / branding watermark:
 * - 150x150 px, PNG, transparent background
 * - Appears bottom-right of video
 * - Should be recognizable at small size
 */
const SIZE = 150;
const HALF = SIZE / 2;

type Style = "sun" | "monogram" | "ring";

export default function WatermarkPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [style, setStyle] = useState<Style>("sun");
  const [opacity, setOpacity] = useState(85);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const c = cv.getContext("2d");
    if (!c) return;

    cv.width = SIZE;
    cv.height = SIZE;
    c.clearRect(0, 0, SIZE, SIZE);

    const alpha = opacity / 100;

    if (style === "sun") {
      drawSunMark(c, alpha);
    } else if (style === "monogram") {
      drawMonogram(c, alpha);
    } else {
      drawRing(c, alpha);
    }
  }, [style, opacity]);

  const handleDownload = () => {
    const cv = canvasRef.current;
    if (!cv) return;
    const link = document.createElement("a");
    link.download = `zora-watermark-${style}.png`;
    link.href = cv.toDataURL("image/png");
    link.click();
  };

  return (
    <div className="max-w-[780px] mx-auto px-8 py-16">
      <h1 className="font-display-ornate text-3xl text-zora-amber mb-2">
        youtube watermark
      </h1>
      <p className="text-mist-dim mb-6">
        150 x 150 px, transparent PNG. Appears bottom-right of every video.
      </p>

      <div className="space-y-6">
        {/* Controls */}
        <div className="flex flex-wrap items-center gap-6">
          <div>
            <label className="block font-mono text-[0.6rem] text-mist-dim/60 uppercase tracking-wider mb-2">
              style
            </label>
            <div className="flex gap-2">
              {(["sun", "monogram", "ring"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStyle(s)}
                  className={`rounded-md border px-3 py-1.5 text-sm font-mono transition-colors ${
                    style === s
                      ? "border-zora-amber text-zora-amber"
                      : "border-rule text-mist-dim hover:border-zora-amber/40"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block font-mono text-[0.6rem] text-mist-dim/60 uppercase tracking-wider mb-1">
              opacity ({opacity}%)
            </label>
            <input
              type="range"
              min={30}
              max={100}
              value={opacity}
              onChange={(e) => setOpacity(parseInt(e.target.value))}
              className="w-48"
            />
          </div>
          <button
            onClick={handleDownload}
            className="rounded-md bg-eos-teal px-4 py-2 text-sm font-medium text-pre-dawn transition-colors hover:bg-eos-teal/90"
          >
            download PNG
          </button>
        </div>

        {/* Preview — shown at actual size and enlarged */}
        <div className="flex items-start gap-8">
          <div>
            <p className="font-mono text-[0.6rem] text-mist-dim/60 uppercase tracking-wider mb-2">
              actual size (150px)
            </p>
            <div className="bg-pre-dawn-mid border border-rule rounded-md p-4 inline-block">
              <canvas ref={canvasRef} style={{ width: 150, height: 150 }} />
            </div>
          </div>
          <div>
            <p className="font-mono text-[0.6rem] text-mist-dim/60 uppercase tracking-wider mb-2">
              preview on dark
            </p>
            <div className="bg-[#111] border border-rule rounded-md p-8 inline-block">
              <canvas
                ref={canvasRef}
                style={{ width: 150, height: 150, imageRendering: "auto" }}
              />
            </div>
          </div>
        </div>

        <p className="font-mono text-[0.6rem] text-mist-dim/40">
          YouTube compresses watermarks. The &ldquo;sun&rdquo; style is the most recognizable at small sizes.
        </p>
      </div>
    </div>
  );
}

/** Style 1: Stylized sunrise — amber sun cresting a ridge line */
function drawSunMark(c: CanvasRenderingContext2D, alpha: number) {
  const cx = HALF;
  const ridgeY = SIZE * 0.62;

  // Sun disk
  const sunR = 22;
  const sunY = ridgeY - 8;
  const grad = c.createRadialGradient(cx, sunY, 0, cx, sunY, sunR);
  grad.addColorStop(0, `rgba(255,250,220,${alpha})`);
  grad.addColorStop(0.5, `rgba(240,165,0,${alpha * 0.9})`);
  grad.addColorStop(1, `rgba(232,120,20,${alpha * 0.6})`);

  // Clip to above ridge for the sun
  c.save();
  c.beginPath();
  c.rect(0, 0, SIZE, ridgeY);
  c.clip();
  c.beginPath();
  c.arc(cx, sunY, sunR, 0, Math.PI * 2);
  c.fillStyle = grad;
  c.fill();
  c.restore();

  // Rays above sun
  c.save();
  c.beginPath();
  c.rect(0, 0, SIZE, ridgeY);
  c.clip();

  const rayCount = 7;
  const raySpread = Math.PI * 0.55;
  for (let i = 0; i < rayCount; i++) {
    const angle = -Math.PI / 2 + (i / (rayCount - 1) - 0.5) * raySpread;
    const len = 18 + (i % 2) * 8;
    const startR = sunR + 4;
    const x1 = cx + Math.cos(angle) * startR;
    const y1 = sunY + Math.sin(angle) * startR;
    const x2 = cx + Math.cos(angle) * (startR + len);
    const y2 = sunY + Math.sin(angle) * (startR + len);

    c.beginPath();
    c.moveTo(x1, y1);
    c.lineTo(x2, y2);
    c.strokeStyle = `rgba(240,165,0,${alpha * 0.6})`;
    c.lineWidth = 1.5;
    c.lineCap = "round";
    c.stroke();
  }
  c.restore();

  // Ridge silhouette
  c.beginPath();
  c.moveTo(0, ridgeY + 6);
  c.lineTo(20, ridgeY - 2);
  c.lineTo(40, ridgeY + 2);
  c.lineTo(55, ridgeY - 6);
  c.lineTo(75, ridgeY);
  c.lineTo(95, ridgeY - 8);
  c.lineTo(110, ridgeY - 2);
  c.lineTo(130, ridgeY - 10);
  c.lineTo(SIZE, ridgeY - 4);
  c.lineTo(SIZE, SIZE);
  c.lineTo(0, SIZE);
  c.closePath();
  c.fillStyle = `rgba(13,15,20,${alpha})`;
  c.fill();

  // "TZF" small text below ridge
  c.textAlign = "center";
  c.textBaseline = "middle";
  c.font = "bold 18px 'Cinzel Decorative', serif";
  c.fillStyle = `rgba(240,165,0,${alpha * 0.8})`;
  c.fillText("TZF", cx, SIZE * 0.82);
}

/** Style 2: "Z" monogram in amber circle */
function drawMonogram(c: CanvasRenderingContext2D, alpha: number) {
  const cx = HALF;
  const cy = HALF;
  const r = 58;

  // Circle outline
  c.beginPath();
  c.arc(cx, cy, r, 0, Math.PI * 2);
  c.strokeStyle = `rgba(240,165,0,${alpha})`;
  c.lineWidth = 3;
  c.stroke();

  // Inner subtle fill
  c.beginPath();
  c.arc(cx, cy, r - 2, 0, Math.PI * 2);
  c.fillStyle = `rgba(240,165,0,${alpha * 0.06})`;
  c.fill();

  // "Z" letter
  c.textAlign = "center";
  c.textBaseline = "middle";
  c.font = "bold 72px 'Cinzel Decorative', serif";
  c.fillStyle = `rgba(240,165,0,${alpha})`;
  c.fillText("Z", cx, cy + 2);
}

/** Style 3: Sun ring — circle with rays */
function drawRing(c: CanvasRenderingContext2D, alpha: number) {
  const cx = HALF;
  const cy = HALF;
  const innerR = 35;
  const outerR = 55;

  // Outer rays
  const rayCount = 24;
  for (let i = 0; i < rayCount; i++) {
    const angle = (i / rayCount) * Math.PI * 2;
    const isLong = i % 2 === 0;
    const startR = innerR + 6;
    const endR = isLong ? outerR : outerR - 8;

    c.beginPath();
    c.moveTo(cx + Math.cos(angle) * startR, cy + Math.sin(angle) * startR);
    c.lineTo(cx + Math.cos(angle) * endR, cy + Math.sin(angle) * endR);
    c.strokeStyle = `rgba(240,165,0,${alpha * (isLong ? 0.7 : 0.4)})`;
    c.lineWidth = isLong ? 2 : 1;
    c.lineCap = "round";
    c.stroke();
  }

  // Inner circle
  c.beginPath();
  c.arc(cx, cy, innerR, 0, Math.PI * 2);
  c.strokeStyle = `rgba(240,165,0,${alpha})`;
  c.lineWidth = 2.5;
  c.stroke();

  // Inner fill
  const grad = c.createRadialGradient(cx, cy, 0, cx, cy, innerR);
  grad.addColorStop(0, `rgba(255,250,220,${alpha * 0.15})`);
  grad.addColorStop(1, `rgba(240,165,0,${alpha * 0.05})`);
  c.beginPath();
  c.arc(cx, cy, innerR - 2, 0, Math.PI * 2);
  c.fillStyle = grad;
  c.fill();

  // "Z" in center
  c.textAlign = "center";
  c.textBaseline = "middle";
  c.font = "bold 40px 'Cinzel Decorative', serif";
  c.fillStyle = `rgba(240,165,0,${alpha})`;
  c.fillText("Z", cx, cy + 1);
}
