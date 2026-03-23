"use client";

import { useState, useCallback } from "react";
import { EosScorePanel } from "./eos-score-panel";
import { EFFORT_LEVELS, LEVELS } from "@/lib/types";
import { GemCeremony } from "@/components/gem-ceremony";
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
  scores: EosScores;
  rationales: { [key: string]: string | undefined };
}

interface LogFormProps {
  hasApiKey: boolean;
  totalExpeditions: number;
  shootDates: string[];
  editData?: EditData;
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

export function LogForm({ hasApiKey, totalExpeditions, shootDates, editData }: LogFormProps) {
  const isEdit = !!editData;

  // Metadata
  const [episodeNumber, setEpisodeNumber] = useState(editData?.episodeNumber ?? 1);
  const [season, setSeason] = useState(editData?.season ?? 1);
  const [title, setTitle] = useState(editData?.title ?? "");
  const [location, setLocation] = useState(editData?.location ?? "");
  const [country, setCountry] = useState(editData?.country ?? "US");
  const [region, setRegion] = useState(editData?.region ?? "Arizona");
  const [trail, setTrail] = useState(editData?.trail ?? "");
  const [shootDate, setShootDate] = useState(
    editData?.shootDate ?? new Date().toISOString().split("T")[0]
  );
  const [effortLevel, setEffortLevel] = useState(editData?.effortLevel ?? 1);
  const [notes, setNotes] = useState(editData?.notes ?? "");
  const [existingThumbnail] = useState(editData?.thumbnailUrl ?? "");

  // Save state
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showCeremony, setShowCeremony] = useState(false);

  // Level calculation — gems go on the NEXT medallion (the one being earned)
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

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
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

  const handleSave = async () => {
    if (!title.trim() || !location.trim()) {
      setSaveError("Title and location are required.");
      return;
    }

    setSaving(true);
    setSaveError(null);

    // Upload photo to Supabase storage if present
    let thumbnailUrl: string | null = null;
    if (photo) {
      const formData = new FormData();
      formData.append("file", photo);
      formData.append("folder", `episodes/s${String(season).padStart(2, "0")}e${String(episodeNumber).padStart(2, "0")}`);
      try {
        const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
        const uploadData = await uploadRes.json();
        if (uploadRes.ok) {
          thumbnailUrl = uploadData.url;
        } else {
          console.error("Photo upload failed:", uploadData.error);
        }
      } catch {
        console.error("Photo upload network error");
      }
    }

    const payload = {
      episode_number: episodeNumber,
      season,
      title,
      location_name: location,
      country,
      region: region || null,
      coordinates: { lat: 0, lng: 0 },
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
        discovery_points: 0,
        total: eosTotal + effortInfo.points,
      },
      thumbnail_url: thumbnailUrl || existingThumbnail || null,
      notes: notes || null,
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
      } else if (isEdit) {
        setSaved(true);
      } else {
        setShowCeremony(true);
      }
    } catch {
      setSaveError("Network error — could not save.");
    } finally {
      setSaving(false);
    }
  };

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
          S{String(season).padStart(2, "0")}E{String(episodeNumber).padStart(2, "0")} — &ldquo;{title}&rdquo;
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
            <p className="font-mono text-2xl text-zora-amber">{eosTotal + effortInfo.points}+</p>
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
            setNotes("");
            setPhoto(null);
            setPhotoPreview(null);
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
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="The Benchmark"
                className="w-full rounded-lg border border-dawn-mist/10 bg-dawn-mist/5 px-3 py-2 text-sm text-dawn-mist placeholder:text-dawn-mist/20 focus:border-zora-amber/50 focus:outline-none"
              />
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
                placeholder="Lost Dutchman State Park"
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

        {/* Field notes */}
        <section>
          <h2 className="font-display text-lg font-semibold text-dawn-mist mb-4">
            field notes
          </h2>
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
            <div className="border-t border-dawn-mist/10 pt-3 flex justify-between">
              <span className="text-dawn-mist/50">zora score</span>
              <span className="font-mono text-zora-amber font-semibold">
                {eosTotal + effortInfo.points}+
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
