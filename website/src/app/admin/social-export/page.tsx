"use client";

import { useState, useEffect, useRef } from "react";
import { Ornament } from "@/components/atmosphere";

interface ArchiveEntry {
  filename: string;
  taken_at: string | null;
  scores: { eos_total: number };
  vibe: string | null;
}

const PLATFORMS = [
  { key: "youtube", label: "YouTube / X", width: 1200, height: 675, aspect: "16:9" },
  { key: "ig-square", label: "Instagram square", width: 1080, height: 1080, aspect: "1:1" },
  { key: "ig-portrait", label: "Instagram portrait", width: 1080, height: 1350, aspect: "4:5" },
  { key: "tiktok", label: "TikTok / Stories", width: 1080, height: 1920, aspect: "9:16" },
] as const;

export default function SocialExportPage() {
  const [entries, setEntries] = useState<ArchiveEntry[]>([]);
  const [selected, setSelected] = useState<ArchiveEntry | null>(null);
  const [platform, setPlatform] = useState<typeof PLATFORMS[number]>(PLATFORMS[0]);
  const [focusX, setFocusX] = useState(0.5);
  const [focusY, setFocusY] = useState(0.5);
  const [showScore, setShowScore] = useState(true);
  const [showBrand, setShowBrand] = useState(true);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Load archive data
  useEffect(() => {
    fetch("/archives/archive-data.json")
      .then((r) => r.json())
      .then((d) => {
        setEntries(d);
        if (d.length > 0) setSelected(d[0]);
      })
      .catch(() => {});
  }, []);

  // Generate preview when settings change
  useEffect(() => {
    if (!selected) return;
    const timeout = setTimeout(() => generatePreview(), 300);
    return () => clearTimeout(timeout);
  }, [selected, platform, focusX, focusY, showScore, showBrand]);

  const generatePreview = async () => {
    if (!selected) return;
    setLoading(true);
    try {
      const res = await fetch("/api/social-export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: selected.filename,
          width: platform.width,
          height: platform.height,
          focusX,
          focusY,
          score: showScore ? selected.scores.eos_total : undefined,
          showBrand,
        }),
      });
      if (res.ok) {
        const blob = await res.blob();
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(URL.createObjectURL(blob));
      }
    } catch {
      // best effort
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!selected) return;
    const res = await fetch("/api/social-export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filename: selected.filename,
        width: platform.width,
        height: platform.height,
        focusX,
        focusY,
        score: showScore ? selected.scores.eos_total : undefined,
        showBrand,
      }),
    });
    if (res.ok) {
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${platform.key}-eos${selected.scores.eos_total}-${selected.filename}`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleDownloadAll = async () => {
    if (!selected) return;
    for (const p of PLATFORMS) {
      const res = await fetch("/api/social-export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: selected.filename,
          width: p.width,
          height: p.height,
          focusX,
          focusY,
          score: showScore ? selected.scores.eos_total : undefined,
          showBrand,
        }),
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${p.key}-eos${selected.scores.eos_total}-${selected.filename}`;
        a.click();
        URL.revokeObjectURL(url);
        await new Promise((r) => setTimeout(r, 300));
      }
    }
  };

  // Click on source image to set focal point
  const handleFocalClick = (e: React.MouseEvent<HTMLImageElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setFocusX((e.clientX - rect.left) / rect.width);
    setFocusY((e.clientY - rect.top) / rect.height);
  };

  return (
    <div className="max-w-[960px] mx-auto px-8 py-16">
      <h1 className="font-display-ornate text-3xl text-zora-amber mb-2">
        social media export
      </h1>
      <p className="text-mist-dim mb-6">
        Pick a photo, set your focal point, choose a platform, download.
      </p>

      {/* Photo selector */}
      <Ornament label="Select photo" />
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
        {entries.map((entry) => (
          <button
            key={entry.filename}
            onClick={() => {
              setSelected(entry);
              setFocusX(0.5);
              setFocusY(0.5);
            }}
            className={`shrink-0 rounded-md overflow-hidden border-2 transition-colors ${
              selected?.filename === entry.filename
                ? "border-zora-amber"
                : "border-transparent hover:border-rule"
            }`}
          >
            <div className="relative w-20 h-14">
              <img
                src={`/archives/${entry.filename}`}
                alt=""
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <span className="absolute bottom-0 right-0 font-mono text-[0.5rem] bg-black/60 text-zora-amber px-1">
                {entry.scores.eos_total}
              </span>
            </div>
          </button>
        ))}
      </div>

      {selected && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left: source image + focal point picker */}
          <div>
            <Ornament label="Focal point" />
            <p className="text-xs text-mist-dim mb-2">
              Click on the image where you want the crop centered.
            </p>
            <div className="relative inline-block rounded-md overflow-hidden border border-rule cursor-crosshair">
              <img
                ref={imgRef}
                src={`/archives/${selected.filename}`}
                alt=""
                className="max-w-full"
                onClick={handleFocalClick}
              />
              {/* Focal point crosshair */}
              <div
                className="absolute w-6 h-6 border-2 border-zora-amber rounded-full pointer-events-none"
                style={{
                  left: `${focusX * 100}%`,
                  top: `${focusY * 100}%`,
                  transform: "translate(-50%, -50%)",
                  boxShadow: "0 0 0 2px rgba(0,0,0,0.5)",
                }}
              />
              <div
                className="absolute pointer-events-none"
                style={{
                  left: `${focusX * 100}%`,
                  top: 0,
                  bottom: 0,
                  width: 1,
                  background: "rgba(240,165,0,0.3)",
                }}
              />
              <div
                className="absolute pointer-events-none"
                style={{
                  top: `${focusY * 100}%`,
                  left: 0,
                  right: 0,
                  height: 1,
                  background: "rgba(240,165,0,0.3)",
                }}
              />
            </div>
            <p className="font-mono text-[0.6rem] text-mist-dim/40 mt-1">
              focal: {(focusX * 100).toFixed(0)}% x, {(focusY * 100).toFixed(0)}% y
            </p>
          </div>

          {/* Right: platform, options, preview */}
          <div>
            <Ornament label="Platform" />
            <div className="flex flex-wrap gap-2 mb-4">
              {PLATFORMS.map((p) => (
                <button
                  key={p.key}
                  onClick={() => setPlatform(p)}
                  className={`rounded-md border px-3 py-1.5 text-xs font-mono transition-colors ${
                    platform.key === p.key
                      ? "border-zora-amber text-zora-amber"
                      : "border-rule text-mist-dim hover:border-zora-amber/40"
                  }`}
                >
                  {p.label}
                  <span className="ml-1 text-mist-dim/40">{p.aspect}</span>
                </button>
              ))}
            </div>

            {/* Options */}
            <div className="flex gap-4 mb-4">
              <label className="flex items-center gap-2 font-mono text-xs text-mist-dim cursor-pointer">
                <input
                  type="checkbox"
                  checked={showScore}
                  onChange={(e) => setShowScore(e.target.checked)}
                />
                eos score badge
              </label>
              <label className="flex items-center gap-2 font-mono text-xs text-mist-dim cursor-pointer">
                <input
                  type="checkbox"
                  checked={showBrand}
                  onChange={(e) => setShowBrand(e.target.checked)}
                />
                brand watermark
              </label>
            </div>

            {/* Preview */}
            <div className="bg-pre-dawn-mid border border-rule rounded-md p-3 mb-4">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full rounded"
                  style={{ aspectRatio: `${platform.width}/${platform.height}` }}
                />
              ) : (
                <div
                  className="w-full bg-pre-dawn-light rounded flex items-center justify-center text-mist-dim/30 text-sm"
                  style={{ aspectRatio: `${platform.width}/${platform.height}` }}
                >
                  {loading ? "generating..." : "preview"}
                </div>
              )}
              <p className="font-mono text-[0.6rem] text-mist-dim/40 mt-2">
                {platform.width} x {platform.height}
              </p>
            </div>

            {/* Download */}
            <div className="flex gap-2">
              <button
                onClick={handleDownload}
                className="rounded-md bg-eos-teal px-4 py-2 text-sm font-medium text-pre-dawn transition-colors hover:bg-eos-teal/90"
              >
                download {platform.label}
              </button>
              <button
                onClick={handleDownloadAll}
                className="rounded-md border border-rule px-4 py-2 text-sm text-dawn-mist hover:border-zora-amber/40 transition-colors"
              >
                download all platforms
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
