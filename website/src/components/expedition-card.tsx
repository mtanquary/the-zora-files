"use client";

import { forwardRef } from "react";
import { EFFORT_LEVELS, LEVELS } from "@/lib/types";
import { LevelEmblem } from "./level-emblem";

export interface ExpeditionCardData {
  title: string;
  episode_number: number;
  season: number;
  location_name: string;
  shoot_date: string;
  eos_total: number;
  effort_rating: number;
  effort_points: number;
  streak_active: boolean;
  thumbnail_url: string | null;
  distance_miles: number | null;
  elevation_gain_ft: number | null;
  minutes_before_sunrise: number | null;
  weather_notes: string | null;
  total_expeditions: number;
}

export type CardAspect = "16:9" | "1:1" | "9:16";

const ASPECT_CLASSES: Record<CardAspect, string> = {
  "16:9": "aspect-video",
  "1:1": "aspect-square",
  "9:16": "aspect-[9/16]",
};

export interface FocalPoint {
  x: number; // 0-100 percentage
  y: number; // 0-100 percentage
}

interface Props {
  data: ExpeditionCardData;
  aspect: CardAspect;
  focalPoint?: FocalPoint;
}

export const ExpeditionCard = forwardRef<HTMLDivElement, Props>(
  function ExpeditionCard({ data, aspect, focalPoint }, ref) {
    const effort = EFFORT_LEVELS.find((e) => e.level === data.effort_rating);
    const currentLevel = LEVELS.filter(
      (l) => data.total_expeditions >= l.expeditions
    ).pop()!;

    return (
      <div
        ref={ref}
        className={`relative overflow-hidden rounded-2xl bg-pre-dawn ${ASPECT_CLASSES[aspect]} w-full max-w-[600px]`}
      >
        {/* Streak bar */}
        {data.streak_active && (
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-zora-amber z-20" />
        )}

        {/* Photo zone — upper portion */}
        <div className="absolute inset-0 flex flex-col">
          {/* Photo area */}
          <div className="relative flex-1 min-h-0">
            {data.thumbnail_url ? (
              <img
                src={data.thumbnail_url}
                alt={data.title}
                className="h-full w-full object-cover"
                style={focalPoint ? { objectPosition: `${focalPoint.x}% ${focalPoint.y}%` } : undefined}
              />
            ) : (
              <div className="h-full w-full bg-gradient-to-b from-sunrise-orange/20 to-pre-dawn" />
            )}

            {/* Gradient overlay for text readability */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/10 to-black/80" />

            {/* Top-left: location + date */}
            <div className="absolute top-4 left-4 z-10" style={{ textShadow: "0 1px 4px rgba(0,0,0,0.9), 0 0 12px rgba(0,0,0,0.7)" }}>
              <p className="text-xs text-white/80 font-medium">
                S{String(data.season).padStart(2, "0")}E
                {String(data.episode_number).padStart(2, "0")}
              </p>
              <p className="text-sm font-bold text-white">
                {data.location_name}
              </p>
              <p className="text-xs text-white/60">
                {new Date(data.shoot_date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>

            {/* Top-right: level emblem */}
            <div className="absolute top-3 right-3 z-10" style={{ filter: "drop-shadow(0 2px 8px rgba(0,0,0,1)) drop-shadow(0 0 4px rgba(0,0,0,0.8))" }}>
              <LevelEmblem level={currentLevel.level} size={44} />
            </div>
          </div>

          {/* Score zone */}
          <div className="relative z-10 bg-pre-dawn px-5 py-4">
            <div className="flex items-end justify-between">
              {/* Eos Index — large teal number */}
              <div>
                <p className="text-[10px] uppercase tracking-wider text-eos-teal/60 mb-0.5">
                  eos index
                </p>
                <p className="font-mono text-4xl font-bold text-eos-teal leading-none">
                  {data.eos_total}
                </p>
              </div>

              {/* Effort indicator — sundogs + label */}
              <div className="text-right">
                <div className="flex justify-end gap-1 mb-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Sundog
                      key={i}
                      filled={i < data.effort_rating}
                    />
                  ))}
                </div>
                <p className="text-xs text-zora-amber/80">{effort?.label}</p>
              </div>
            </div>

            {/* Stats strip */}
            <div className="flex gap-4 mt-3 text-[10px] text-dawn-mist/40">
              {data.elevation_gain_ft != null && (
                <span>{Math.round(data.elevation_gain_ft)} ft gain</span>
              )}
              {data.distance_miles != null && (
                <span>{data.distance_miles} mi</span>
              )}
              {data.minutes_before_sunrise != null && (
                <span>{data.minutes_before_sunrise} min pre-dawn</span>
              )}
              {data.weather_notes && <span>{data.weather_notes}</span>}
            </div>

            {/* Footer */}
            <div className="mt-3 pt-2 border-t border-dawn-mist/10">
              <p className="text-[10px] tracking-widest text-dawn-mist/25 text-center font-display">
                the zora files
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

/** Sundog gem shape — elongated teardrop */
function Sundog({ filled }: { filled: boolean }) {
  return (
    <svg width="8" height="18" viewBox="0 0 8 18" className="inline-block">
      <path
        d="M4 0 C6 4, 8 8, 8 10 C8 14, 6 18, 4 18 C2 18, 0 14, 0 10 C0 8, 2 4, 4 0Z"
        fill={filled ? "#F0A500" : "rgba(200,212,224,0.1)"}
      />
    </svg>
  );
}
