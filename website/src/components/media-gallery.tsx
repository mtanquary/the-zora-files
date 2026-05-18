"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface GalleryItem {
  id: string;
  kind: "photo" | "video";
  url: string;
  caption?: string | null;
}

interface MediaGalleryProps {
  media: GalleryItem[];
}

export function MediaGallery({ media }: MediaGalleryProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const close = useCallback(() => setOpenIndex(null), []);
  const goPrev = useCallback(
    () =>
      setOpenIndex((i) =>
        i == null ? null : (i - 1 + media.length) % media.length
      ),
    [media.length]
  );
  const goNext = useCallback(
    () =>
      setOpenIndex((i) => (i == null ? null : (i + 1) % media.length)),
    [media.length]
  );

  if (media.length === 0) return null;

  return (
    <>
      {/* Masonry grid — CSS columns lets each image keep its natural aspect
          ratio, so portrait and landscape orientations both read correctly. */}
      <div className="columns-1 sm:columns-2 lg:columns-3 gap-3">
        {media.map((m, i) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setOpenIndex(i)}
            className="block w-full mb-3 break-inside-avoid rounded-lg overflow-hidden border border-rule bg-pre-dawn-mid hover:border-zora-amber/50 transition-colors group text-left"
          >
            {m.kind === "photo" ? (
              <img
                src={m.url}
                alt={m.caption || `Photo ${i + 1}`}
                loading="lazy"
                className="w-full block group-hover:opacity-90 transition-opacity"
              />
            ) : (
              <div className="relative w-full aspect-video">
                <video
                  src={m.url}
                  preload="metadata"
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-14 h-14 rounded-full bg-zora-amber/85 flex items-center justify-center text-pre-dawn text-xl shadow-lg">
                    ▶
                  </div>
                </div>
              </div>
            )}
            {m.caption && (
              <p className="px-3 py-2 text-xs text-dawn-mist/60 line-clamp-2">
                {m.caption}
              </p>
            )}
          </button>
        ))}
      </div>

      {openIndex !== null && (
        <Lightbox
          item={media[openIndex]}
          index={openIndex}
          total={media.length}
          onClose={close}
          onPrev={media.length > 1 ? goPrev : undefined}
          onNext={media.length > 1 ? goNext : undefined}
        />
      )}
    </>
  );
}

export interface LightboxProps {
  item: GalleryItem;
  index: number;
  total: number;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
}

export function Lightbox({
  item,
  index,
  total,
  onClose,
  onPrev,
  onNext,
}: LightboxProps) {
  const touchStartX = useRef<number | null>(null);

  // Keyboard nav.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowLeft" && onPrev) {
        e.preventDefault();
        onPrev();
      } else if (e.key === "ArrowRight" && onNext) {
        e.preventDefault();
        onNext();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, onPrev, onNext]);

  // Lock body scroll while open.
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, []);

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }
  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(dx) < 50) return;
    if (dx > 0 && onPrev) onPrev();
    else if (dx < 0 && onNext) onNext();
  }

  return (
    <div
      className="fixed inset-0 z-[100] bg-pre-dawn/95 backdrop-blur-sm flex flex-col"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Image viewer"
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 flex-shrink-0">
        <p className="font-mono text-[0.7rem] tracking-[0.15em] uppercase text-mist-dim">
          {index + 1} of {total}
        </p>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          aria-label="Close"
          className="text-mist-dim hover:text-zora-amber transition-colors w-8 h-8 flex items-center justify-center text-2xl leading-none"
        >
          ×
        </button>
      </div>

      {/* Body */}
      <div
        className="flex-1 flex items-center justify-center px-2 sm:px-12 relative min-h-0"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {onPrev && (
          <button
            type="button"
            onClick={onPrev}
            aria-label="Previous"
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-pre-dawn/70 hover:bg-zora-amber/20 border border-rule hover:border-zora-amber/50 backdrop-blur-sm text-dawn-mist hover:text-zora-amber transition-colors flex items-center justify-center text-2xl leading-none"
          >
            ‹
          </button>
        )}

        {item.kind === "photo" ? (
          <img
            src={item.url}
            alt={item.caption || ""}
            className="max-h-full max-w-full object-contain rounded"
          />
        ) : (
          <video
            src={item.url}
            controls
            autoPlay
            className="max-h-full max-w-full rounded bg-pre-dawn-mid"
          />
        )}

        {onNext && (
          <button
            type="button"
            onClick={onNext}
            aria-label="Next"
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-pre-dawn/70 hover:bg-zora-amber/20 border border-rule hover:border-zora-amber/50 backdrop-blur-sm text-dawn-mist hover:text-zora-amber transition-colors flex items-center justify-center text-2xl leading-none"
          >
            ›
          </button>
        )}
      </div>

      {/* Caption */}
      <div className="px-6 py-4 text-center min-h-[2.5rem] flex-shrink-0">
        {item.caption && (
          <p className="text-sm text-dawn-mist/80 max-w-2xl mx-auto">
            {item.caption}
          </p>
        )}
      </div>
    </div>
  );
}
