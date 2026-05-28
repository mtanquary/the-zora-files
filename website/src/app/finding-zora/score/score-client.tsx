"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import {
  eosSkyTotal,
  eosSettingTotal,
  eosConditionsTotal,
  type EosIndex,
} from "@/lib/types";

interface ScoreResponse {
  eos_index: EosIndex;
  eos_total: number;
  photo_url: string | null;
  remaining: number;
}

export function ScoreClient({
  remaining: initialRemaining,
  limit,
  resetsAt,
}: {
  remaining: number;
  limit: number;
  resetsAt: string;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [limitReached, setLimitReached] = useState(initialRemaining <= 0);
  const [remaining, setRemaining] = useState(initialRemaining);
  const [result, setResult] = useState<ScoreResponse | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const resetDate = new Date(resetsAt).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setResult(null);
    setError(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(f ? URL.createObjectURL(f) : null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Choose a sunrise photo first.");
      return;
    }
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("photo", file);
    if (location.trim()) formData.append("location", location.trim());

    try {
      const res = await fetch("/api/member-score", { method: "POST", body: formData });
      const data = await res.json();

      if (res.status === 429) {
        setLimitReached(true);
        setRemaining(0);
        setError(data.error ?? "Monthly limit reached.");
        return;
      }
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }

      setResult(data as ScoreResponse);
      setRemaining(data.remaining);
      if (data.remaining <= 0) setLimitReached(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const scoreAnother = () => {
    setFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setLocation("");
    setResult(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="max-w-[680px] mx-auto px-8 py-16">
      <h1 className="font-display-ornate text-3xl text-zora-amber mb-2">
        score your sunrise
      </h1>
      <p className="text-mist-dim">
        Upload a sunrise photo and get it scored on the Eos Index — the same
        0–100 rubric every expedition uses.
      </p>

      {/* Quota banner */}
      <div className="mt-6 flex items-center justify-between bg-pre-dawn-mid border border-rule rounded-md px-5 py-3">
        <span className="font-mono text-[0.65rem] uppercase tracking-wider text-mist-dim">
          {remaining} of {limit} free scores left this month
        </span>
        <Link
          href="/account"
          className="font-mono text-[0.6rem] uppercase tracking-wider text-mist-dim/60 hover:text-zora-amber"
        >
          account
        </Link>
      </div>

      {limitReached && !result ? (
        <div className="mt-6 bg-pre-dawn-mid border border-rule rounded-md p-6 text-sm text-mist-dim">
          <p className="text-dawn-mist">You&apos;ve used all {limit} free scores this month.</p>
          <p className="mt-2">
            Your free scores reset on {resetDate}. Thanks for chasing the dawn with us.
          </p>
        </div>
      ) : result ? (
        <ResultView result={result} location={location} onScoreAnother={scoreAnother} canScoreMore={remaining > 0} />
      ) : (
        <form
          onSubmit={handleSubmit}
          className="mt-6 bg-pre-dawn-mid border border-rule rounded-md p-6 space-y-5"
        >
          <div>
            <label className="block font-mono text-[0.6rem] text-mist-dim/60 uppercase tracking-wider mb-2">
              sunrise photo
            </label>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              onChange={onFileChange}
              className="block w-full text-sm text-mist-dim file:mr-4 file:rounded-md file:border-0 file:bg-pre-dawn-light file:px-4 file:py-2 file:text-sm file:text-dawn-mist hover:file:border-zora-amber/40"
            />
            {previewUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewUrl}
                alt="Selected sunrise"
                className="mt-4 w-full aspect-video object-cover rounded-md bg-pre-dawn-light"
              />
            )}
          </div>

          <div>
            <label className="block font-mono text-[0.6rem] text-mist-dim/60 uppercase tracking-wider mb-1">
              location <span className="text-mist-dim/40">(optional)</span>
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Where was this taken?"
              className="w-full rounded-md border border-rule bg-pre-dawn-light px-3 py-2 text-sm text-dawn-mist placeholder:text-mist-dim/30 focus:border-zora-amber/50 focus:outline-none"
            />
          </div>

          {error && <p className="text-sm text-sunrise-orange">{error}</p>}

          <button
            type="submit"
            disabled={loading || !file}
            className="w-full rounded-md bg-zora-amber px-4 py-2.5 text-sm font-medium text-pre-dawn transition-colors hover:bg-zora-amber/90 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? "scoring…" : "score this sunrise"}
          </button>
          <p className="text-center text-[0.6rem] text-mist-dim/50">
            Scoring uses one of your free credits.
          </p>
        </form>
      )}
    </div>
  );
}

function ResultView({
  result,
  location,
  onScoreAnother,
  canScoreMore,
}: {
  result: ScoreResponse;
  location: string;
  onScoreAnother: () => void;
  canScoreMore: boolean;
}) {
  const eos = result.eos_index;
  const rows = [
    { label: "Sky", value: eosSkyTotal(eos), max: 50 },
    { label: "Setting", value: eosSettingTotal(eos), max: 30 },
    { label: "Conditions", value: eosConditionsTotal(eos), max: 20 },
  ];

  return (
    <div className="mt-6 bg-pre-dawn-mid border border-rule rounded-md overflow-hidden">
      {result.photo_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={result.photo_url}
          alt={location || "Scored sunrise"}
          className="w-full aspect-video object-cover bg-pre-dawn-light"
        />
      )}
      <div className="p-6">
        <div className="text-center">
          <p className="font-mono text-[0.6rem] uppercase tracking-wider text-mist-dim/60">
            eos index
          </p>
          <p className="font-display text-6xl text-eos-teal mt-1">{result.eos_total}</p>
          {location && <p className="text-sm text-mist-dim mt-1">{location}</p>}
        </div>

        <div className="mt-6 space-y-3">
          {rows.map((r) => (
            <div key={r.label}>
              <div className="flex justify-between text-xs text-mist-dim mb-1">
                <span>{r.label}</span>
                <span className="font-mono">
                  {r.value}
                  <span className="text-mist-dim/40"> / {r.max}</span>
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-pre-dawn-light overflow-hidden">
                <div
                  className="h-full rounded-full bg-eos-teal"
                  style={{ width: `${(r.value / r.max) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {canScoreMore ? (
          <button
            onClick={onScoreAnother}
            className="mt-6 w-full rounded-md border border-rule bg-pre-dawn-light px-4 py-2.5 text-sm font-medium text-dawn-mist transition-colors hover:border-zora-amber/40"
          >
            score another
          </button>
        ) : (
          <p className="mt-6 text-center text-xs text-mist-dim">
            That was your last free score this month.{" "}
            <Link href="/account" className="text-zora-amber hover:underline underline-offset-2">
              view your account
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
