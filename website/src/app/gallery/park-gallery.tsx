"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";

export interface GalleryItem {
  key: string;
  src: string;
  caption: string | null;
  /** Alt text when it differs from the visible caption. */
  alt?: string;
  place: string | null;
  date: string | null;
  source: "expedition" | "archive";
  href?: string;
  eos?: number;
  /** Pixel size when known; expedition photos fall back to 4:3. */
  width?: number;
  height?: number;
}

const FILTERS = [
  { id: "all", label: "All photographs" },
  { id: "expedition", label: "From expeditions" },
  { id: "archive", label: "Sunrise archive" },
] as const;

type FilterId = (typeof FILTERS)[number]["id"];

export function ParkGallery({ items }: { items: GalleryItem[] }) {
  const [filter, setFilter] = useState<FilterId>("all");
  const [open, setOpen] = useState<number | null>(null);

  const shown = useMemo(
    () => (filter === "all" ? items : items.filter((i) => i.source === filter)),
    [items, filter]
  );
  const hasBoth = items.some((i) => i.source === "expedition") && items.some((i) => i.source === "archive");

  const step = useCallback(
    (dir: 1 | -1) => setOpen((o) => (o === null ? o : (o + dir + shown.length) % shown.length)),
    [shown.length]
  );

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, step]);

  const current = open !== null ? shown[open] : null;

  return (
    <>
      {hasBoth && (
        <div className="mb-6 flex flex-wrap gap-2" role="tablist">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              role="tab"
              aria-selected={filter === f.id}
              onClick={() => setFilter(f.id)}
              className={`rounded-sm border-2 px-4 py-1.5 font-park-sans text-sm font-semibold transition-colors ${
                filter === f.id
                  ? "border-park-forest bg-park-forest text-park-paper"
                  : "border-park-ink/30 text-park-ink-soft hover:border-park-forest hover:text-park-forest"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
        {shown.map((item, i) => (
          <figure key={item.key} className="mb-4 break-inside-avoid">
            <button
              onClick={() => setOpen(i)}
              className="group block w-full overflow-hidden bg-blue-hour"
              aria-label={`Open photograph${item.place ? ` from ${item.place}` : ""}`}
            >
              <Image
                src={item.src}
                alt={item.alt ?? item.caption ?? "Sunrise photograph"}
                width={item.width ?? 1200}
                height={item.height ?? 900}
                sizes="(min-width: 1024px) 340px, (min-width: 640px) 50vw, 100vw"
                className="h-auto w-full transition-transform duration-500 group-hover:scale-[1.03]"
              />
            </button>
            {(item.place || item.date) && (
              <figcaption className="mt-1.5 flex justify-between gap-3 font-park-sans text-xs text-park-ink-faint">
                <span className="truncate">{item.place}</span>
                <span className="shrink-0">{item.date}</span>
              </figcaption>
            )}
          </figure>
        ))}
      </div>

      {current && (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-blue-hour/95"
          role="dialog"
          aria-modal="true"
          onClick={() => setOpen(null)}
        >
          <div className="flex items-center justify-between px-4 py-3 text-park-paper/80">
            <span className="font-park-sans text-sm">
              {open! + 1} / {shown.length}
            </span>
            <button
              onClick={() => setOpen(null)}
              className="rounded-sm px-3 py-1 font-park-sans text-sm font-semibold hover:bg-park-paper/10"
            >
              Close ✕
            </button>
          </div>
          <div className="relative flex min-h-0 flex-1 items-center justify-center px-4" onClick={(e) => e.stopPropagation()}>
            {shown.length > 1 && (
              <button
                onClick={() => step(-1)}
                aria-label="Previous photograph"
                className="absolute left-2 z-10 rounded-sm bg-char/60 px-3 py-2 text-2xl text-park-paper hover:bg-char sm:left-6"
              >
                ‹
              </button>
            )}
            <div className="relative h-full w-full">
              <Image
                key={current.key}
                src={current.src}
                alt={current.alt ?? current.caption ?? "Sunrise photograph"}
                fill
                sizes="100vw"
                className="object-contain"
              />
            </div>
            {shown.length > 1 && (
              <button
                onClick={() => step(1)}
                aria-label="Next photograph"
                className="absolute right-2 z-10 rounded-sm bg-char/60 px-3 py-2 text-2xl text-park-paper hover:bg-char sm:right-6"
              >
                ›
              </button>
            )}
          </div>
          <div
            className="mx-auto w-full max-w-[760px] px-6 py-5 text-center text-park-paper"
            onClick={(e) => e.stopPropagation()}
          >
            {current.caption && <p className="text-lg italic text-park-paper/90">{current.caption}</p>}
            <p className="mt-2 font-park-sans text-sm text-park-paper/60">
              {[current.place, current.date].filter(Boolean).join(" · ")}
              {current.eos !== undefined && (
                <span className="ml-2 stamp border border-first-light/60 px-1.5 py-0.5 text-xs text-first-light">
                  Eos {current.eos}
                </span>
              )}
            </p>
            {current.href && (
              <Link
                href={current.href}
                className="mt-3 inline-block font-park-sans text-sm font-bold text-park-amber hover:underline"
              >
                View the expedition →
              </Link>
            )}
          </div>
        </div>
      )}
    </>
  );
}
