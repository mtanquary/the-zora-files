"use client";

import { useState, useCallback } from "react";
import { EosScorePanel } from "./eos-score-panel";
import { PlaceLookup } from "./place-lookup";
import { parseGpx, gpxToGeoJsonLineString, type ParsedGpx } from "@/lib/gpx-parser";
import { EFFORT_LEVELS, LEVELS } from "@/lib/types";
import { GemCeremony } from "@/components/gem-ceremony";
import { FirstExpeditionCeremony } from "@/components/first-expedition-ceremony";
import { DiscoveryEntry, emptyDiscovery, type DiscoveryDraft } from "@/components/discovery-entry";
import { DiscoveryUnlockCeremony, type UnlockItem } from "@/components/discovery-unlock";
import { MediaUploader, type PendingMedia, type ExistingMedia } from "@/components/media-uploader";
import type { EosResponseData } from "@/lib/eos-prompt";

export interface EditData {
  id: string;
  episodeNumber: number;
  season: number;
  title: string;
  location: string;
  country: string;
  region: string;
  trail: string;
  shootDate: string;
  effortLevel: 1 | 2 | 3 | 4 | 5;
  notes: string;
  thumbnailUrl: string;
  youtubeUrl: string;
  publishDate: string;
  lat: number;
  lng: number;
  distanceMiles: number | null;
  elevationGainFt: number | null;
  trackGeojson: { type: "LineString"; coordinates: Array<[number, number, number?]> } | null;
  gpxStoragePath: string | null;
  scores: EosScores;
  rationales: { [key: string]: string | undefined };
  media?: ExistingMedia[];
}

interface LogFormProps {
  hasApiKey: boolean;
  totalExpeditions: number;
  shootDates: string[];
  nextEpisodeNumber?: number;
  nextSeason?: number;
  editData?: EditData;
  mapboxToken?: string | null;
}

interface EosScores {
  color_intensity: number;
  cloud_engagement: number;
  horizon_definition: number;
  foreground_composition: number;
  location_uniqueness: number;
  access_difficulty: number;
  weather_challenge: number;
}

interface EosRationales {
  [key: string]: string | undefined;
}

const INITIAL_SCORES: EosScores = {
  color_intensity: 0,
  cloud_engagement: 0,
  horizon_definition: 0,
  foreground_composition: 0,
  location_uniqueness: 0,
  access_difficulty: 0,
  weather_challenge: 0,
};

export function LogForm({ hasApiKey, totalExpeditions, shootDates, nextEpisodeNumber, nextSeason, editData, mapboxToken = null }: LogFormProps) {
  const isEdit = !!editData;

  // Metadata
  const [episodeNumber, setEpisodeNumber] = useState(editData?.episodeNumber ?? nextEpisodeNumber ?? 1);
  const [season, setSeason] = useState(editData?.season ?? nextSeason ?? 1);
  const [title, setTitle] = useState(editData?.title ?? "");
  const [location, setLocation] = useState(editData?.location ?? "");
  const [country, setCountry] = useState(editData?.country ?? "US");
  const [region, setRegion] = useState(editData?.region ?? "Arizona");
  const [trail, setTrail] = useState(editData?.trail ?? "");
  const [latStr, setLatStr] = useState(
    editData?.lat ? String(editData.lat) : ""
  );
  const [lngStr, setLngStr] = useState(
    editData?.lng ? String(editData.lng) : ""
  );
  const [coordSource, setCoordSource] = useState<"manual" | "exif" | "lookup" | null>(
    editData?.lat && editData?.lng ? "manual" : null
  );
  const [shootDate, setShootDate] = useState(
    editData?.shootDate ?? new Date().toISOString().split("T")[0]
  );
  const [effortLevel, setEffortLevel] = useState(editData?.effortLevel ?? 1);
  const [notes, setNotes] = useState(editData?.notes ?? "");
  const [existingThumbnail] = useState(editData?.thumbnailUrl ?? "");
  const [youtubeUrl, setYoutubeUrl] = useState(editData?.youtubeUrl ?? "");
  const [publishDate, setPublishDate] = useState(editData?.publishDate ?? "");

  // AI assist
  const [titleSuggestions, setTitleSuggestions] = useState<string[]>([]);
  const [titleLoading, setTitleLoading] = useState(false);
  const [notesLoading, setNotesLoading] = useState(false);

  // Discoveries
  const [discoveries, setDiscoveries] = useState<DiscoveryDraft[]>([]);
  const [showUnlocks, setShowUnlocks] = useState(false);
  const [unlockItems, setUnlockItems] = useState<UnlockItem[]>([]);

  // Save state
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showCeremony, setShowCeremony] = useState(false);

  // Level calculation: gems go on the NEXT medallion (the one being earned)
  const currentLevel = LEVELS.filter((l) => totalExpeditions >= l.expeditions).pop()!;
  const nextLevel = LEVELS.find((l) => l.expeditions > totalExpeditions);
  const gemsInCurrentLevel = totalExpeditions - currentLevel.expeditions;

  // Streak: check if all 6 expeditions for this level (including the one being saved)
  // happened within 6 calendar weeks
  const checkStreak = (): boolean => {
    const gemsAfter = gemsInCurrentLevel + 1;
    if (gemsAfter < 6) return false;
    // Get the 6 dates for this level window (5 existing + current shootDate)
    const levelStart = currentLevel.expeditions;
    const levelDates = [...shootDates.slice(levelStart), shootDate].sort();
    if (levelDates.length < 6) return false;
    const first = new Date(levelDates[0]);
    const last = new Date(levelDates[levelDates.length - 1]);
    const sixWeeksMs = 6 * 7 * 24 * 60 * 60 * 1000;
    return last.getTime() - first.getTime() <= sixWeeksMs;
  };

  // Eos scoring
  const [scores, setScores] = useState<EosScores>(editData?.scores ?? INITIAL_SCORES);
  const [aiScores, setAiScores] = useState<EosScores | null>(null);
  const [rationales, setRationales] = useState<EosRationales>(editData?.rationales ?? {});

  // Photo
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // Track + journey stats (GPX-derivable, manually overridable)
  const [distanceMilesStr, setDistanceMilesStr] = useState(
    editData?.distanceMiles != null ? String(editData.distanceMiles) : ""
  );
  const [elevationGainFtStr, setElevationGainFtStr] = useState(
    editData?.elevationGainFt != null ? String(editData.elevationGainFt) : ""
  );
  const [trackGeojson, setTrackGeojson] = useState<EditData["trackGeojson"]>(
    editData?.trackGeojson ?? null
  );
  const [gpxStoragePath, setGpxStoragePath] = useState<string | null>(
    editData?.gpxStoragePath ?? null
  );
  const [gpxFileName, setGpxFileName] = useState<string | null>(null);
  const [gpxParsed, setGpxParsed] = useState<ParsedGpx | null>(null);
  const [gpxBusy, setGpxBusy] = useState(false);
  const [gpxError, setGpxError] = useState<string | null>(null);

  const handleGpxChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setGpxBusy(true);
    setGpxError(null);
    setGpxFileName(file.name);
    try {
      const text = await file.text();
      const parsed = parseGpx(text);
      setGpxParsed(parsed);
      setTrackGeojson(gpxToGeoJsonLineString(parsed));

      // Upload to Supabase storage; fire and forget for speed but await
      // so we have the storage path before save.
      const folder = `episodes/s${String(season).padStart(2, "0")}e${String(episodeNumber).padStart(2, "0")}/track`;
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", folder);
      const res = await fetch("/api/upload-gpx", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Upload failed");
      setGpxStoragePath(data.path);
    } catch (err) {
      setGpxError(err instanceof Error ? err.message : "Could not parse GPX.");
      setGpxParsed(null);
      setTrackGeojson(null);
      setGpxStoragePath(null);
    } finally {
      setGpxBusy(false);
    }
  };

  const applyGpxStats = () => {
    if (!gpxParsed) return;
    setDistanceMilesStr(gpxParsed.distanceMiles.toFixed(2));
    setElevationGainFtStr(String(Math.round(gpxParsed.elevationGainFt)));
  };

  const clearGpx = () => {
    setGpxParsed(null);
    setTrackGeojson(null);
    setGpxStoragePath(null);
    setGpxFileName(null);
    setGpxError(null);
  };

  // Additional media (photos + videos beyond the hero photo)
  const [pendingMedia, setPendingMedia] = useState<PendingMedia[]>([]);
  const [existingMedia, setExistingMedia] = useState<ExistingMedia[]>(
    editData?.media ?? []
  );

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));

    // Auto-fill coordinates from EXIF if the user hasn't set them yet (or
    // hadn't manually overridden). Only auto-fill when both fields are empty
    // OR the previous source was also EXIF — never overwrite a manual entry.
    if (coordSource === "manual" || coordSource === "lookup") return;
    try {
      const exifr = (await import("exifr")).default;
      const gps = await exifr.gps(file);
      if (gps && Number.isFinite(gps.latitude) && Number.isFinite(gps.longitude)) {
        setLatStr(gps.latitude.toFixed(6));
        setLngStr(gps.longitude.toFixed(6));
        setCoordSource("exif");
      }
    } catch {
      // EXIF parse errors are non-fatal.
    }
  };

  const applyAiScores = useCallback((data: EosResponseData) => {
    const newScores: EosScores = {
      color_intensity: data.sky.color_intensity.score,
      cloud_engagement: data.sky.cloud_engagement.score,
      horizon_definition: data.sky.horizon_definition.score,
      foreground_composition: data.setting.foreground_composition.score,
      location_uniqueness: data.setting.location_uniqueness.score,
      access_difficulty: data.conditions.access_difficulty.score,
      weather_challenge: data.conditions.weather_challenge.score,
    };
    setScores(newScores);
    setAiScores({ ...newScores });
    setRationales({
      color_intensity: data.sky.color_intensity.rationale,
      cloud_engagement: data.sky.cloud_engagement.rationale,
      horizon_definition: data.sky.horizon_definition.rationale,
      foreground_composition: data.setting.foreground_composition.rationale,
      location_uniqueness: data.setting.location_uniqueness.rationale,
      access_difficulty: data.conditions.access_difficulty.rationale,
      weather_challenge: data.conditions.weather_challenge.rationale,
    });
  }, []);

  const updateScore = (key: keyof EosScores, value: number) => {
    setScores((prev) => ({ ...prev, [key]: value }));
  };

  const resetField = (key: keyof EosScores) => {
    if (aiScores) {
      setScores((prev) => ({ ...prev, [key]: aiScores[key] }));
    }
  };

  const skyTotal =
    scores.color_intensity + scores.cloud_engagement + scores.horizon_definition;
  const settingTotal =
    scores.foreground_composition + scores.location_uniqueness;
  const conditionsTotal = scores.access_difficulty + scores.weather_challenge;
  const eosTotal = skyTotal + settingTotal + conditionsTotal;

  const effortInfo = EFFORT_LEVELS.find((e) => e.level === effortLevel)!;
  const discoveryPoints = discoveries.reduce((sum, d) => sum + d.points, 0);

  const suggestTitles = async () => {
    setTitleLoading(true);
    try {
      const res = await fetch("/api/ai-title", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location,
          eos_total: eosTotal,
          effort_label: effortInfo.label,
          discoveries: discoveries.filter((d) => d.name).map((d) => ({ name: d.name })),
          notes,
          weather: "",
        }),
      });
      const data = await res.json();
      if (data.titles) setTitleSuggestions(data.titles);
    } catch { /* best effort */ }
    finally { setTitleLoading(false); }
  };

  const draftNotes = async () => {
    setNotesLoading(true);
    try {
      const res = await fetch("/api/ai-field-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          location,
          shoot_date: shootDate,
          eos_total: eosTotal,
          effort_label: effortInfo.label,
          discoveries: discoveries.filter((d) => d.name).map((d) => ({
            name: d.name, type: d.type, rarity_tier: d.rarity_tier,
          })),
          scores: { sky: skyTotal, setting: settingTotal, conditions: conditionsTotal },
          notes_so_far: notes,
        }),
      });
      const data = await res.json();
      if (data.notes) setNotes(data.notes);
    } catch { /* best effort */ }
    finally { setNotesLoading(false); }
  };

  const handleSave = async () => {
    if (!title.trim() || !location.trim()) {
      setSaveError("Title and location are required.");
      return;
    }

    setSaving(true);
    setSaveError(null);

    // Upload photo to Supabase storage if present
    let thumbnailUrl: string | null = null;
    let photoCoordinates: { lat: number; lng: number } | null = null;
    if (photo) {
      const formData = new FormData();
      formData.append("file", photo);
      formData.append("folder", `episodes/s${String(season).padStart(2, "0")}e${String(episodeNumber).padStart(2, "0")}`);
      try {
        const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
        const uploadData = await uploadRes.json();
        if (uploadRes.ok) {
          thumbnailUrl = uploadData.url;
          if (uploadData.exif?.coordinates) {
            photoCoordinates = uploadData.exif.coordinates;
          }
        } else {
          console.error("Photo upload failed:", uploadData.error);
        }
      } catch {
        console.error("Photo upload network error");
      }
    }

    // Form-state coordinates win over EXIF (the user may have edited or used
    // the place lookup). Fall back to EXIF, then to {0,0}.
    const parsedLat = parseFloat(latStr);
    const parsedLng = parseFloat(lngStr);
    const coordinates =
      Number.isFinite(parsedLat) && Number.isFinite(parsedLng)
        ? { lat: parsedLat, lng: parsedLng }
        : photoCoordinates || { lat: 0, lng: 0 };

    const payload = {
      episode_number: episodeNumber,
      season,
      title,
      location_name: location,
      country,
      region: region || null,
      coordinates,
      shoot_date: shootDate,
      eos_index: {
        sky: {
          color_intensity: { score: scores.color_intensity, max: 20, rationale: rationales.color_intensity || "" },
          cloud_engagement: { score: scores.cloud_engagement, max: 15, rationale: rationales.cloud_engagement || "" },
          horizon_definition: { score: scores.horizon_definition, max: 15, rationale: rationales.horizon_definition || "" },
        },
        setting: {
          foreground_composition: { score: scores.foreground_composition, max: 15, rationale: rationales.foreground_composition || "" },
          location_uniqueness: { score: scores.location_uniqueness, max: 15, rationale: rationales.location_uniqueness || "" },
        },
        conditions: {
          access_difficulty: { score: scores.access_difficulty, max: 10, rationale: rationales.access_difficulty || "" },
          weather_challenge: { score: scores.weather_challenge, max: 10, rationale: rationales.weather_challenge || "" },
        },
      },
      eos_total: eosTotal,
      effort_rating: effortLevel,
      effort_points: effortInfo.points,
      zora_score: {
        eos_index: eosTotal,
        effort_points: effortInfo.points,
        discovery_points: discoveries.reduce((sum, d) => sum + d.points, 0),
        total: eosTotal + effortInfo.points + discoveries.reduce((sum, d) => sum + d.points, 0),
      },
      thumbnail_url: thumbnailUrl || existingThumbnail || null,
      youtube_url: youtubeUrl.trim() || null,
      publish_date: publishDate || null,
      notes: notes || null,
      streak_active: checkStreak(),
      distance_miles: distanceMilesStr.trim() === "" ? null : parseFloat(distanceMilesStr),
      elevation_gain_ft: elevationGainFtStr.trim() === "" ? null : parseFloat(elevationGainFtStr),
      track_geojson: trackGeojson,
      gpx_storage_path: gpxStoragePath,
    };

    try {
      const url = isEdit ? `/api/episodes/${editData!.id}` : "/api/episodes";
      const method = isEdit ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setSaveError(data.error || "Save failed.");
      } else {
        // Save discoveries
        const episodeId = data.id || editData?.id;
        const validDiscoveries = discoveries.filter((d) => d.name.trim());
        if (episodeId && validDiscoveries.length > 0) {
          for (const disc of validDiscoveries) {
            // Upload discovery photo if present
            let discPhotoUrl: string | null = null;
            if (disc.photo) {
              const fd = new FormData();
              fd.append("file", disc.photo);
              fd.append("folder", "discoveries");
              try {
                const upRes = await fetch("/api/upload", { method: "POST", body: fd });
                const upData = await upRes.json();
                if (upRes.ok) discPhotoUrl = upData.url;
              } catch { /* continue without photo */ }
            }

            await fetch("/api/discoveries", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                episode_id: episodeId,
                type: disc.type,
                name: disc.name,
                rarity_tier: disc.rarity_tier,
                points: disc.points,
                photo_url: discPhotoUrl,
                fun_fact: disc.fun_fact || null,
                first_spotted: shootDate,
                location_name: location,
                is_first_unlock: disc.is_first_unlock,
                detection_method: disc.detection_method,
              }),
            });
          }
        }

        // Persist additional media (uploads + caption updates + deletions)
        if (episodeId) {
          // 1. Upload pending media files and create rows
          for (let i = 0; i < pendingMedia.length; i++) {
            const m = pendingMedia[i];
            if (m.status === "uploaded") continue; // skip already-uploaded
            try {
              const fd = new FormData();
              fd.append("file", m.file);
              fd.append(
                "folder",
                `episodes/s${String(season).padStart(2, "0")}e${String(episodeNumber).padStart(2, "0")}/media`
              );
              const upRes = await fetch("/api/upload", { method: "POST", body: fd });
              const upData = await upRes.json();
              if (!upRes.ok) {
                console.error("Media upload failed:", upData.error);
                continue;
              }
              await fetch("/api/episode-media", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  episode_id: episodeId,
                  kind: m.kind,
                  url: upData.url,
                  storage_path: upData.path,
                  caption: m.caption || null,
                  mime_type: upData.mime_type || null,
                  size_bytes: upData.size_bytes || null,
                  sort_order: existingMedia.length + i,
                }),
              });
            } catch (e) {
              console.error("Media save failed:", e);
            }
          }

          // 2. Update captions on existing media (only those not marked for deletion)
          for (const m of existingMedia) {
            if (m.marked_for_deletion) continue;
            const original = editData?.media?.find((x) => x.id === m.id);
            if (original && original.caption !== m.caption) {
              try {
                await fetch(`/api/episode-media/${m.id}`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ caption: m.caption }),
                });
              } catch (e) {
                console.error("Media caption update failed:", e);
              }
            }
          }

          // 3. Delete media marked for removal
          for (const m of existingMedia) {
            if (!m.marked_for_deletion) continue;
            try {
              await fetch(`/api/episode-media/${m.id}`, { method: "DELETE" });
            } catch (e) {
              console.error("Media delete failed:", e);
            }
          }
        }

        // Check for first unlocks to show ceremony (both new and edit)
        const firstUnlocks = discoveries.filter((d) => d.is_first_unlock && d.name);
        if (firstUnlocks.length > 0) {
          setUnlockItems(
            firstUnlocks.map((d) => ({
              name: d.name,
              type: d.type,
              rarity: d.rarity_tier,
              points: d.points,
              photoUrl: d.photoPreview || null,
              detectionMethod: d.detection_method,
            }))
          );
          setShowUnlocks(true);
        } else if (isEdit) {
          setSaved(true);
        } else {
          setShowCeremony(true);
        }
      }
    } catch {
      setSaveError("Network error: could not save.");
    } finally {
      setSaving(false);
    }
  };

  // Discovery unlock ceremony: plays before gem ceremony
  if (showUnlocks) {
    return (
      <DiscoveryUnlockCeremony
        items={unlockItems}
        onComplete={() => {
          setShowUnlocks(false);
          if (isEdit) {
            setSaved(true);
          } else {
            setShowCeremony(true);
          }
        }}
      />
    );
  }

  // First-expedition (Scout → Trailhead training graduation) — overrides the
  // standard gem ceremony for the very first save in the system.
  if (showCeremony && totalExpeditions === 0) {
    return (
      <FirstExpeditionCeremony
        episodeTitle={title}
        eosTotal={eosTotal}
        onClose={() => {
          setShowCeremony(false);
          setSaved(true);
        }}
      />
    );
  }

  // Gem ceremony overlay
  if (showCeremony) {
    return (
      <GemCeremony
        level={nextLevel ? nextLevel.level : currentLevel.level}
        gemsBeforeThisExpedition={gemsInCurrentLevel}
        totalExpeditionsAfter={totalExpeditions + 1}
        episodeTitle={title}
        eosTotal={eosTotal}
        streakEarned={checkStreak()}
        onClose={() => {
          setShowCeremony(false);
          setSaved(true);
        }}
      />
    );
  }

  if (saved) {
    return (
      <div className="rounded-2xl border border-zora-amber/20 bg-zora-amber/5 p-12 text-center">
        <h2 className="font-display text-2xl font-bold text-zora-amber mb-3">
          expedition logged
        </h2>
        <p className="text-dawn-mist/60 mb-2">
          S{String(season).padStart(2, "0")}E{String(episodeNumber).padStart(2, "0")} · &ldquo;{title}&rdquo;
        </p>
        <div className="flex justify-center gap-8 my-6 text-sm">
          <div>
            <p className="text-dawn-mist/40">eos index</p>
            <p className="font-mono text-2xl text-eos-teal">{eosTotal}</p>
          </div>
          <div>
            <p className="text-dawn-mist/40">effort</p>
            <p className="font-mono text-2xl text-sunrise-orange">{effortInfo.points}</p>
          </div>
          <div>
            <p className="text-dawn-mist/40">zora score</p>
            <p className="font-mono text-2xl text-zora-amber">{eosTotal + effortInfo.points + discoveryPoints}</p>
          </div>
        </div>
        <a
          href={`/admin/card/s${String(season).padStart(2, "0")}e${String(episodeNumber).padStart(2, "0")}`}
          className="inline-block rounded-full bg-zora-amber px-6 py-3 text-sm font-semibold text-pre-dawn transition-colors hover:bg-zora-amber/90 mb-4"
        >
          export share card
        </a>
        <br />
        <button
          onClick={() => {
            setSaved(false);
            setScores(INITIAL_SCORES);
            setAiScores(null);
            setRationales({});
            setTitle("");
            setLocation("");
            setTrail("");
            setLatStr("");
            setLngStr("");
            setCoordSource(null);
            setDistanceMilesStr("");
            setElevationGainFtStr("");
            setTrackGeojson(null);
            setGpxStoragePath(null);
            setGpxFileName(null);
            setGpxParsed(null);
            setGpxError(null);
            setNotes("");
            setPhoto(null);
            setPhotoPreview(null);
            // Release object URLs from any leftover preview blobs before clearing
            pendingMedia.forEach((p) => URL.revokeObjectURL(p.previewUrl));
            setPendingMedia([]);
            setExistingMedia([]);
            setDiscoveries([]);
            setEpisodeNumber((n) => n + 1);
            setEffortLevel(1);
          }}
          className="rounded-full border border-dawn-mist/20 px-6 py-2 text-sm text-dawn-mist/60 hover:border-dawn-mist/40 transition-colors"
        >
          log another expedition
        </button>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr,320px]">
      {/* Main form */}
      <div className="space-y-10">
        {/* Episode metadata */}
        <section>
          <h2 className="font-display text-lg font-semibold text-dawn-mist mb-4">
            expedition details
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs text-dawn-mist/50 mb-1">
                episode title
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="The ___"
                  className="flex-1 rounded-lg border border-dawn-mist/10 bg-dawn-mist/5 px-3 py-2 text-sm text-dawn-mist placeholder:text-dawn-mist/20 focus:border-zora-amber/50 focus:outline-none"
                />
                {hasApiKey && (
                  <button
                    type="button"
                    onClick={suggestTitles}
                    disabled={titleLoading || !location}
                    className="rounded-lg border border-eos-teal/30 bg-eos-teal/5 px-3 py-2 text-xs text-eos-teal hover:bg-eos-teal/10 transition-colors disabled:opacity-30 whitespace-nowrap"
                    title="Suggest titles with AI"
                  >
                    {titleLoading ? "..." : "suggest"}
                  </button>
                )}
              </div>
              {titleSuggestions.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {titleSuggestions.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => { setTitle(t); setTitleSuggestions([]); }}
                      className="rounded-md border border-rule bg-pre-dawn-mid px-2.5 py-1 text-xs text-dawn-mist hover:border-zora-amber/40 hover:text-zora-amber transition-colors"
                    >
                      {t}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-dawn-mist/50 mb-1">
                  season
                </label>
                <input
                  type="number"
                  min={1}
                  value={season}
                  onChange={(e) => setSeason(Number(e.target.value))}
                  className="w-full rounded-lg border border-dawn-mist/10 bg-dawn-mist/5 px-3 py-2 text-sm text-dawn-mist focus:border-zora-amber/50 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-dawn-mist/50 mb-1">
                  episode #
                </label>
                <input
                  type="number"
                  min={1}
                  value={episodeNumber}
                  onChange={(e) => setEpisodeNumber(Number(e.target.value))}
                  className="w-full rounded-lg border border-dawn-mist/10 bg-dawn-mist/5 px-3 py-2 text-sm text-dawn-mist focus:border-zora-amber/50 focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-dawn-mist/50 mb-1">
                location name
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Horton Creek"
                className="w-full rounded-lg border border-dawn-mist/10 bg-dawn-mist/5 px-3 py-2 text-sm text-dawn-mist placeholder:text-dawn-mist/20 focus:border-zora-amber/50 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-dawn-mist/50 mb-1">
                trail / position
              </label>
              <input
                type="text"
                value={trail}
                onChange={(e) => setTrail(e.target.value)}
                placeholder="Prospector's View"
                className="w-full rounded-lg border border-dawn-mist/10 bg-dawn-mist/5 px-3 py-2 text-sm text-dawn-mist placeholder:text-dawn-mist/20 focus:border-zora-amber/50 focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-dawn-mist/50 mb-1">
                  shoot date
                </label>
                <input
                  type="date"
                  value={shootDate}
                  onChange={(e) => setShootDate(e.target.value)}
                  className="w-full rounded-lg border border-dawn-mist/10 bg-dawn-mist/5 px-3 py-2 text-sm text-dawn-mist focus:border-zora-amber/50 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-dawn-mist/50 mb-1">
                  release date
                </label>
                <input
                  type="date"
                  value={publishDate}
                  onChange={(e) => setPublishDate(e.target.value)}
                  className="w-full rounded-lg border border-dawn-mist/10 bg-dawn-mist/5 px-3 py-2 text-sm text-dawn-mist focus:border-zora-amber/50 focus:outline-none"
                />
                <p className="mt-1 text-[0.65rem] text-dawn-mist/40">
                  Scores, discoveries, and video are hidden until this date.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-dawn-mist/50 mb-1">
                  country
                </label>
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full rounded-lg border border-dawn-mist/10 bg-dawn-mist/5 px-3 py-2 text-sm text-dawn-mist focus:border-zora-amber/50 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-dawn-mist/50 mb-1">
                  region / state
                </label>
                <input
                  type="text"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="w-full rounded-lg border border-dawn-mist/10 bg-dawn-mist/5 px-3 py-2 text-sm text-dawn-mist focus:border-zora-amber/50 focus:outline-none"
                />
              </div>
            </div>

            {/* Coordinates — drives the map pin */}
            <div className="rounded-xl border border-dawn-mist/10 bg-dawn-mist/[0.03] p-4 space-y-3">
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-xs text-dawn-mist/60">
                  coordinates <span className="text-dawn-mist/30">(drives the map pin)</span>
                </p>
                {coordSource && (
                  <span className="font-mono text-[0.6rem] uppercase tracking-wider text-mist-dim">
                    {coordSource === "exif"
                      ? "from photo EXIF"
                      : coordSource === "lookup"
                        ? "from place lookup"
                        : "manual"}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[0.65rem] text-dawn-mist/40 mb-1 font-mono uppercase tracking-wider">
                    latitude
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={latStr}
                    onChange={(e) => {
                      setLatStr(e.target.value);
                      setCoordSource("manual");
                    }}
                    placeholder="34.358900"
                    className="w-full rounded-lg border border-dawn-mist/10 bg-pre-dawn px-3 py-2 text-sm text-dawn-mist font-mono placeholder:text-dawn-mist/20 focus:border-zora-amber/50 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[0.65rem] text-dawn-mist/40 mb-1 font-mono uppercase tracking-wider">
                    longitude
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={lngStr}
                    onChange={(e) => {
                      setLngStr(e.target.value);
                      setCoordSource("manual");
                    }}
                    placeholder="-111.098700"
                    className="w-full rounded-lg border border-dawn-mist/10 bg-pre-dawn px-3 py-2 text-sm text-dawn-mist font-mono placeholder:text-dawn-mist/20 focus:border-zora-amber/50 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[0.65rem] text-dawn-mist/40 mb-1 font-mono uppercase tracking-wider">
                  or look up a place
                </label>
                <PlaceLookup
                  token={mapboxToken}
                  initialQuery={location}
                  proximity={
                    Number.isFinite(parseFloat(latStr)) && Number.isFinite(parseFloat(lngStr))
                      ? { lat: parseFloat(latStr), lng: parseFloat(lngStr) }
                      : null
                  }
                  onPick={(lat, lng) => {
                    setLatStr(lat.toFixed(6));
                    setLngStr(lng.toFixed(6));
                    setCoordSource("lookup");
                  }}
                />
              </div>
            </div>

            {/* Journey: track + distance + elevation */}
            <div className="rounded-xl border border-dawn-mist/10 bg-dawn-mist/[0.03] p-4 space-y-3">
              <div className="flex items-baseline justify-between">
                <p className="text-xs text-dawn-mist/60">
                  journey <span className="text-dawn-mist/30">(distance, elevation, optional GPX track)</span>
                </p>
                {trackGeojson && (
                  <span className="font-mono text-[0.6rem] uppercase tracking-wider text-eos-teal">
                    track attached
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[0.65rem] text-dawn-mist/40 mb-1 font-mono uppercase tracking-wider">
                    distance (miles)
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={distanceMilesStr}
                    onChange={(e) => setDistanceMilesStr(e.target.value)}
                    placeholder="3.4"
                    className="w-full rounded-lg border border-dawn-mist/10 bg-pre-dawn px-3 py-2 text-sm text-dawn-mist font-mono placeholder:text-dawn-mist/20 focus:border-zora-amber/50 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[0.65rem] text-dawn-mist/40 mb-1 font-mono uppercase tracking-wider">
                    elevation gain (ft)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={elevationGainFtStr}
                    onChange={(e) => setElevationGainFtStr(e.target.value)}
                    placeholder="850"
                    className="w-full rounded-lg border border-dawn-mist/10 bg-pre-dawn px-3 py-2 text-sm text-dawn-mist font-mono placeholder:text-dawn-mist/20 focus:border-zora-amber/50 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[0.65rem] text-dawn-mist/40 mb-1 font-mono uppercase tracking-wider">
                  GPX track (AllTrails / Garmin / Strava export)
                </label>
                {!gpxParsed && !trackGeojson && (
                  <label className="block cursor-pointer rounded-lg border-2 border-dashed border-dawn-mist/15 hover:border-eos-teal/40 transition-colors p-4 text-center">
                    <p className="text-xs text-dawn-mist/50">
                      {gpxBusy ? "uploading…" : "click to attach a .gpx file"}
                    </p>
                    {gpxError && (
                      <p className="mt-1 text-xs text-sunrise-orange">{gpxError}</p>
                    )}
                    <input
                      type="file"
                      accept=".gpx,application/gpx+xml,application/xml,text/xml"
                      onChange={handleGpxChange}
                      disabled={gpxBusy}
                      className="hidden"
                    />
                  </label>
                )}

                {gpxParsed && (
                  <div className="rounded-lg border border-eos-teal/30 bg-eos-teal/5 p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-eos-teal font-mono">
                        {gpxFileName ?? "track.gpx"}
                      </p>
                      <button
                        type="button"
                        onClick={clearGpx}
                        className="text-[0.65rem] font-mono uppercase tracking-wider text-dawn-mist/40 hover:text-sunrise-orange transition-colors"
                      >
                        remove
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <p className="text-dawn-mist/40 font-mono text-[0.6rem] uppercase tracking-wider">distance</p>
                        <p className="text-dawn-mist font-mono">{gpxParsed.distanceMiles.toFixed(2)} mi</p>
                      </div>
                      <div>
                        <p className="text-dawn-mist/40 font-mono text-[0.6rem] uppercase tracking-wider">elevation</p>
                        <p className="text-dawn-mist font-mono">+{Math.round(gpxParsed.elevationGainFt)} ft</p>
                      </div>
                      <div>
                        <p className="text-dawn-mist/40 font-mono text-[0.6rem] uppercase tracking-wider">points</p>
                        <p className="text-dawn-mist font-mono">{gpxParsed.pointCount}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={applyGpxStats}
                      className="w-full rounded-md border border-eos-teal/30 hover:bg-eos-teal/10 text-eos-teal text-xs font-mono uppercase tracking-wider py-1.5 transition-colors"
                    >
                      use these numbers (overwrites the fields above)
                    </button>
                  </div>
                )}

                {!gpxParsed && trackGeojson && (
                  <div className="rounded-lg border border-eos-teal/30 bg-eos-teal/5 p-3 flex items-center justify-between">
                    <p className="text-xs text-eos-teal font-mono">
                      track from earlier upload ({trackGeojson.coordinates.length} points)
                    </p>
                    <button
                      type="button"
                      onClick={clearGpx}
                      className="text-[0.65rem] font-mono uppercase tracking-wider text-dawn-mist/40 hover:text-sunrise-orange transition-colors"
                    >
                      remove
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Sunrise photo */}
        <section>
          <h2 className="font-display text-lg font-semibold text-dawn-mist mb-4">
            sunrise photo
          </h2>
          <label className="block cursor-pointer rounded-xl border-2 border-dashed border-dawn-mist/15 hover:border-zora-amber/30 transition-colors p-8 text-center">
            {photoPreview ? (
              <img
                src={photoPreview}
                alt="Sunrise preview"
                className="mx-auto max-h-64 rounded-lg object-cover"
              />
            ) : existingThumbnail ? (
              <img
                src={existingThumbnail}
                alt="Current sunrise photo"
                className="mx-auto max-h-64 rounded-lg object-cover"
              />
            ) : (
              <p className="text-sm text-dawn-mist/40">
                Click to upload sunrise photo
              </p>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="hidden"
            />
          </label>
        </section>

        {/* Additional media (photos + videos for the official record) */}
        <section>
          <h2 className="font-display text-lg font-semibold text-dawn-mist mb-2">
            additional media
          </h2>
          <p className="text-xs text-dawn-mist/40 mb-4">
            Photos and videos that become part of the official expedition record. Linked from the episode page so the main view stays clean.
          </p>
          <MediaUploader
            pending={pendingMedia}
            existing={existingMedia}
            onPendingChange={setPendingMedia}
            onExistingChange={setExistingMedia}
          />
        </section>

        {/* Eos Index scoring */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-semibold text-eos-teal">
              eos index
            </h2>
            <span className="font-mono text-2xl text-eos-teal">
              {eosTotal}/100
            </span>
          </div>

          {/* AI scoring panel */}
          <EosScorePanel
            hasApiKey={hasApiKey}
            photo={photo}
            location={location}
            trail={trail}
            effortLabel={effortInfo.label}
            onApply={applyAiScores}
          />

          {/* Sky scores */}
          <div className="mt-6 space-y-6">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-dawn-mist">sky</h3>
                <span className="font-mono text-sm text-dawn-mist/50">
                  {skyTotal}/50
                </span>
              </div>
              <div className="space-y-3">
                <ScoreSlider
                  label="color intensity"
                  value={scores.color_intensity}
                  max={20}
                  onChange={(v) => updateScore("color_intensity", v)}
                  rationale={rationales.color_intensity}
                  isOverridden={aiScores ? scores.color_intensity !== aiScores.color_intensity : false}
                  onReset={() => resetField("color_intensity")}
                />
                <ScoreSlider
                  label="cloud engagement"
                  value={scores.cloud_engagement}
                  max={15}
                  onChange={(v) => updateScore("cloud_engagement", v)}
                  rationale={rationales.cloud_engagement}
                  isOverridden={aiScores ? scores.cloud_engagement !== aiScores.cloud_engagement : false}
                  onReset={() => resetField("cloud_engagement")}
                />
                <ScoreSlider
                  label="horizon definition"
                  value={scores.horizon_definition}
                  max={15}
                  onChange={(v) => updateScore("horizon_definition", v)}
                  rationale={rationales.horizon_definition}
                  isOverridden={aiScores ? scores.horizon_definition !== aiScores.horizon_definition : false}
                  onReset={() => resetField("horizon_definition")}
                />
              </div>
            </div>

            {/* Setting scores */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-dawn-mist">
                  setting
                </h3>
                <span className="font-mono text-sm text-dawn-mist/50">
                  {settingTotal}/30
                </span>
              </div>
              <div className="space-y-3">
                <ScoreSlider
                  label="foreground composition"
                  value={scores.foreground_composition}
                  max={15}
                  onChange={(v) => updateScore("foreground_composition", v)}
                  rationale={rationales.foreground_composition}
                  isOverridden={aiScores ? scores.foreground_composition !== aiScores.foreground_composition : false}
                  onReset={() => resetField("foreground_composition")}
                />
                <ScoreSlider
                  label="location uniqueness"
                  value={scores.location_uniqueness}
                  max={15}
                  onChange={(v) => updateScore("location_uniqueness", v)}
                  rationale={rationales.location_uniqueness}
                  isOverridden={aiScores ? scores.location_uniqueness !== aiScores.location_uniqueness : false}
                  onReset={() => resetField("location_uniqueness")}
                />
              </div>
            </div>

            {/* Conditions scores */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-dawn-mist">
                  conditions
                </h3>
                <span className="font-mono text-sm text-dawn-mist/50">
                  {conditionsTotal}/20
                </span>
              </div>
              <div className="space-y-3">
                <ScoreSlider
                  label="access difficulty"
                  value={scores.access_difficulty}
                  max={10}
                  onChange={(v) => updateScore("access_difficulty", v)}
                  rationale={rationales.access_difficulty}
                  isOverridden={aiScores ? scores.access_difficulty !== aiScores.access_difficulty : false}
                  onReset={() => resetField("access_difficulty")}
                />
                <ScoreSlider
                  label="weather challenge"
                  value={scores.weather_challenge}
                  max={10}
                  onChange={(v) => updateScore("weather_challenge", v)}
                  rationale={rationales.weather_challenge}
                  isOverridden={aiScores ? scores.weather_challenge !== aiScores.weather_challenge : false}
                  onReset={() => resetField("weather_challenge")}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Effort rating */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-semibold text-sunrise-orange">
              effort rating
            </h2>
            <span className="font-mono text-lg text-sunrise-orange">
              {effortInfo.points} pts
            </span>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {EFFORT_LEVELS.map((e) => (
              <button
                key={e.level}
                onClick={() => setEffortLevel(e.level)}
                className={`rounded-lg border p-3 text-center text-xs transition-colors ${
                  effortLevel === e.level
                    ? "border-zora-amber bg-zora-amber/10 text-zora-amber"
                    : "border-dawn-mist/10 text-dawn-mist/40 hover:border-dawn-mist/20"
                }`}
              >
                <div className="flex justify-center gap-0.5 mb-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span
                      key={i}
                      className={`inline-block h-2.5 w-1.5 rounded-sm ${
                        i < e.level ? "bg-zora-amber" : "bg-dawn-mist/10"
                      }`}
                    />
                  ))}
                </div>
                {e.label}
              </button>
            ))}
          </div>
        </section>

        {/* Discoveries */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-semibold text-zora-amber">
              discoveries
            </h2>
            <span className="font-mono text-sm text-amber-light">
              {discoveries.reduce((sum, d) => sum + d.points, 0)} pts
            </span>
          </div>

          <div className="space-y-3">
            {discoveries.map((disc, i) => (
              <DiscoveryEntry
                key={i}
                draft={disc}
                index={i}
                hasApiKey={hasApiKey}
                location={location}
                onChange={(updated) => {
                  const next = [...discoveries];
                  next[i] = updated;
                  setDiscoveries(next);
                }}
                onRemove={() => {
                  setDiscoveries(discoveries.filter((_, j) => j !== i));
                }}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={() => setDiscoveries([...discoveries, emptyDiscovery()])}
            className="mt-3 w-full rounded-md border border-dashed border-rule py-3 text-sm text-mist-dim hover:border-zora-amber/40 hover:text-zora-amber transition-colors"
          >
            + add discovery
          </button>
        </section>

        {/* YouTube URL */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-semibold text-dawn-mist">
              youtube url
            </h2>
          </div>
          <input
            type="url"
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=…"
            className="w-full rounded-lg border border-dawn-mist/10 bg-dawn-mist/5 px-3 py-2 text-sm text-dawn-mist placeholder:text-dawn-mist/20 focus:border-zora-amber/50 focus:outline-none"
          />
          <p className="mt-1 text-xs text-dawn-mist/40">
            Once set, a ▶ watch link appears on the home, hub, archive, and the embed appears on the episode page.
          </p>
        </section>

        {/* Field notes */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-semibold text-dawn-mist">
              field notes
            </h2>
            {hasApiKey && (
              <button
                type="button"
                onClick={draftNotes}
                disabled={notesLoading || !location}
                className="rounded-lg border border-eos-teal/30 bg-eos-teal/5 px-3 py-1.5 text-xs text-eos-teal hover:bg-eos-teal/10 transition-colors disabled:opacity-30"
              >
                {notesLoading ? "drafting..." : "draft with AI"}
              </button>
            )}
          </div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="What happened, what surprised you, what would you do differently."
            rows={4}
            className="w-full rounded-lg border border-dawn-mist/10 bg-dawn-mist/5 px-3 py-2 text-sm text-dawn-mist placeholder:text-dawn-mist/20 focus:border-zora-amber/50 focus:outline-none resize-none"
          />
        </section>

        {/* Save */}
        <section>
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full rounded-xl bg-zora-amber px-6 py-4 text-base font-semibold text-pre-dawn transition-colors hover:bg-zora-amber/90 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saving ? "saving..." : isEdit ? "update expedition" : "save expedition"}
          </button>
          {isEdit && (
            <button
              type="button"
              onClick={async () => {
                if (!confirm("Delete this expedition? This cannot be undone.")) return;
                const res = await fetch(`/api/episodes/${editData!.id}`, { method: "DELETE" });
                if (res.ok) {
                  window.location.href = "/admin/log";
                }
              }}
              className="w-full mt-3 rounded-xl border border-sunrise-orange/30 px-6 py-3 text-sm text-sunrise-orange/70 transition-colors hover:bg-sunrise-orange/10"
            >
              delete expedition
            </button>
          )}
          {saveError && (
            <p className="mt-3 text-sm text-sunrise-orange text-center">
              {saveError}
            </p>
          )}
        </section>
      </div>

      {/* Live preview sidebar */}
      <aside className="hidden lg:block">
        <div className="sticky top-8 rounded-2xl border border-dawn-mist/10 bg-dawn-mist/5 p-6">
          <h3 className="font-display text-sm font-semibold text-dawn-mist/50 mb-4">
            live preview
          </h3>
          {photoPreview && (
            <img
              src={photoPreview}
              alt="Preview"
              className="w-full rounded-lg object-cover mb-4"
            />
          )}
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-dawn-mist/50">eos index</span>
              <span className="font-mono text-eos-teal">{eosTotal}</span>
            </div>
            <div className="text-xs text-dawn-mist/30 space-y-1 ml-2">
              <div className="flex justify-between">
                <span>sky</span>
                <span className="font-mono">{skyTotal}/50</span>
              </div>
              <div className="flex justify-between">
                <span>setting</span>
                <span className="font-mono">{settingTotal}/30</span>
              </div>
              <div className="flex justify-between">
                <span>conditions</span>
                <span className="font-mono">{conditionsTotal}/20</span>
              </div>
            </div>
            <div className="border-t border-dawn-mist/10 pt-3 flex justify-between">
              <span className="text-dawn-mist/50">effort</span>
              <span className="text-sunrise-orange">
                {effortInfo.label} ({effortInfo.points})
              </span>
            </div>
            {discoveries.length > 0 && (
              <div className="border-t border-dawn-mist/10 pt-3 flex justify-between">
                <span className="text-dawn-mist/50">discoveries</span>
                <span className="text-amber-light text-sm">
                  {discoveries.length} ({discoveries.reduce((s, d) => s + d.points, 0)} pts)
                </span>
              </div>
            )}
            <div className="border-t border-dawn-mist/10 pt-3 flex justify-between">
              <span className="text-dawn-mist/50">zora score</span>
              <span className="font-mono text-zora-amber font-semibold">
                {eosTotal + effortInfo.points + discoveries.reduce((s, d) => s + d.points, 0)}
              </span>
            </div>
          </div>
          {location && (
            <p className="mt-4 text-xs text-dawn-mist/30">{location}</p>
          )}
        </div>
      </aside>
    </div>
  );
}

// ── Score slider component ──

function ScoreSlider({
  label,
  value,
  max,
  onChange,
  rationale,
  isOverridden,
  onReset,
}: {
  label: string;
  value: number;
  max: number;
  onChange: (v: number) => void;
  rationale?: string;
  isOverridden: boolean;
  onReset: () => void;
}) {
  return (
    <div
      className={`rounded-lg border p-3 transition-colors ${
        isOverridden
          ? "border-zora-amber/30 bg-zora-amber/5"
          : "border-dawn-mist/10"
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs text-dawn-mist/60">{label}</label>
        <div className="flex items-center gap-2">
          {isOverridden && (
            <button
              onClick={onReset}
              className="text-xs text-zora-amber/60 hover:text-zora-amber"
            >
              reset to AI
            </button>
          )}
          <span className="font-mono text-xs text-dawn-mist/40">
            {value}/{max}
          </span>
        </div>
      </div>
      <input
        type="range"
        min={0}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-eos-teal"
      />
      {rationale && (
        <p className="mt-1 text-xs text-dawn-mist/30 italic">{rationale}</p>
      )}
    </div>
  );
}
