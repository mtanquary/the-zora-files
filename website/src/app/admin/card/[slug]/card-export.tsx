"use client";

import { useRef, useState } from "react";
import { toPng } from "html-to-image";
import {
  ExpeditionCard,
  type ExpeditionCardData,
  type CardAspect,
  type FocalPoint,
} from "@/components/expedition-card";

const PRESETS: { label: string; aspect: CardAspect; description: string }[] = [
  { label: "16:9", aspect: "16:9", description: "X / YouTube community" },
  { label: "1:1", aspect: "1:1", description: "Instagram post" },
  { label: "9:16", aspect: "9:16", description: "Instagram story / TikTok" },
];

export function CardExport({ data }: { data: ExpeditionCardData }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [aspect, setAspect] = useState<CardAspect>("16:9");
  const [focalPoint, setFocalPoint] = useState<FocalPoint>({ x: 50, y: 50 });
  const [exporting, setExporting] = useState(false);

  const handleFocalClick = (e: React.MouseEvent<HTMLImageElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
    setFocalPoint({ x, y });
  };

  const exportPng = async () => {
    if (!cardRef.current) return;
    setExporting(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 2,
        backgroundColor: "#0D0F14",
      });
      const link = document.createElement("a");
      const slug = `s${String(data.season).padStart(2, "0")}e${String(data.episode_number).padStart(2, "0")}`;
      link.download = `zora-${slug}-${aspect.replace(":", "x")}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setExporting(false);
    }
  };

  const copyToClipboard = async () => {
    if (!cardRef.current) return;
    setExporting(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 2,
        backgroundColor: "#0D0F14",
      });
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob }),
      ]);
    } catch (err) {
      console.error("Copy failed:", err);
    } finally {
      setExporting(false);
    }
  };

  const openInTab = async () => {
    if (!cardRef.current) return;
    setExporting(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 2,
        backgroundColor: "#0D0F14",
      });
      window.open(dataUrl, "_blank");
    } catch (err) {
      console.error("Open failed:", err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Controls row */}
      <div className="grid gap-6 sm:grid-cols-2">
        {/* Aspect ratio selector */}
        <div>
          <h2 className="text-sm text-dawn-mist/50 mb-3">aspect ratio</h2>
          <div className="flex gap-3">
            {PRESETS.map((p) => (
              <button
                key={p.aspect}
                onClick={() => setAspect(p.aspect)}
                className={`rounded-lg border px-4 py-3 text-sm transition-colors ${
                  aspect === p.aspect
                    ? "border-zora-amber bg-zora-amber/10 text-zora-amber"
                    : "border-dawn-mist/10 text-dawn-mist/40 hover:border-dawn-mist/20"
                }`}
              >
                <p className="font-mono font-semibold">{p.label}</p>
                <p className="text-xs mt-0.5 opacity-60">{p.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Focal point picker */}
        {data.thumbnail_url && (
          <div>
            <h2 className="text-sm text-dawn-mist/50 mb-3">
              focal point{" "}
              <span className="text-dawn-mist/30 font-mono">
                ({focalPoint.x}%, {focalPoint.y}%)
              </span>
            </h2>
            <div className="relative inline-block rounded-lg overflow-hidden border border-dawn-mist/10 cursor-crosshair">
              <img
                src={data.thumbnail_url}
                alt="Set focal point"
                className="h-28 w-auto object-contain"
                onClick={handleFocalClick}
              />
              {/* Crosshair indicator */}
              <div
                className="absolute w-5 h-5 pointer-events-none"
                style={{
                  left: `${focalPoint.x}%`,
                  top: `${focalPoint.y}%`,
                  transform: "translate(-50%, -50%)",
                }}
              >
                <div className="absolute inset-0 rounded-full border-2 border-zora-amber" />
                <div className="absolute top-1/2 left-0 right-0 h-px bg-zora-amber/60" />
                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-zora-amber/60" />
              </div>
            </div>
            <p className="text-xs text-dawn-mist/30 mt-1">
              Click the image to set the crop center
            </p>
          </div>
        )}
      </div>

      {/* Card preview */}
      <div className="flex justify-center">
        <ExpeditionCard
          ref={cardRef}
          data={data}
          aspect={aspect}
          focalPoint={focalPoint}
        />
      </div>

      {/* Export buttons */}
      <div className="flex gap-3 justify-center">
        <button
          onClick={exportPng}
          disabled={exporting}
          className="rounded-full bg-zora-amber px-6 py-3 text-sm font-semibold text-pre-dawn transition-colors hover:bg-zora-amber/90 disabled:opacity-40"
        >
          {exporting ? "exporting..." : "download PNG"}
        </button>
        <button
          onClick={copyToClipboard}
          disabled={exporting}
          className="rounded-full border border-dawn-mist/20 px-6 py-3 text-sm text-dawn-mist/60 transition-colors hover:border-dawn-mist/40 disabled:opacity-40"
        >
          copy to clipboard
        </button>
        <button
          onClick={openInTab}
          disabled={exporting}
          className="rounded-full border border-dawn-mist/20 px-6 py-3 text-sm text-dawn-mist/60 transition-colors hover:border-dawn-mist/40 disabled:opacity-40"
        >
          open in new tab
        </button>
      </div>
    </div>
  );
}
