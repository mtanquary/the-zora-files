"use client";

import { useState, useMemo } from "react";
import { buildEosPrompt, parseEosResponse } from "@/lib/eos-prompt";
import type { EosResponseData } from "@/lib/eos-prompt";

interface EosScorePanelProps {
  hasApiKey: boolean;
  photo: File | null;
  location: string;
  trail: string;
  effortLabel: string;
  onApply: (data: EosResponseData) => void;
}

export function EosScorePanel({
  hasApiKey,
  photo,
  location,
  trail,
  effortLabel,
  onApply,
}: EosScorePanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<"direct" | "paste">(
    hasApiKey ? "direct" : "paste"
  );
  const [jsonInput, setJsonInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const prompt = useMemo(
    () =>
      buildEosPrompt({
        location: location || undefined,
        trail: trail || undefined,
        effort_label: effortLabel,
      }),
    [location, trail, effortLabel]
  );

  // Direct mode — send photo to /api/eos-score
  const handleDirectScore = async () => {
    if (!photo) {
      setError("Upload a sunrise photo first.");
      return;
    }
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("photo", photo);
    if (location) formData.append("location", location);
    if (trail) formData.append("trail", trail);
    formData.append("effort_label", effortLabel);

    try {
      const res = await fetch("/api/eos-score", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Scoring failed.");
        return;
      }

      onApply(data.eos_index);
      setIsOpen(false);
    } catch {
      setError("Network error — could not reach the scoring endpoint.");
    } finally {
      setLoading(false);
    }
  };

  // Copy-paste mode — validate and apply pasted JSON
  const handlePasteApply = () => {
    setError(null);
    const result = parseEosResponse(jsonInput);
    if (!result.success) {
      setError(result.error);
      return;
    }
    onApply(result.data);
    setIsOpen(false);
    setJsonInput("");
  };

  const copyPrompt = async () => {
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="w-full rounded-lg border border-eos-teal/30 bg-eos-teal/5 px-4 py-3 text-sm text-eos-teal transition-colors hover:bg-eos-teal/10"
      >
        score with Claude
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-eos-teal/20 bg-eos-teal/5 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-eos-teal">
          AI-assisted scoring
        </h3>
        <button
          onClick={() => {
            setIsOpen(false);
            setError(null);
          }}
          className="text-xs text-dawn-mist/40 hover:text-dawn-mist"
        >
          close
        </button>
      </div>

      {/* Mode toggle (only if API key is available) */}
      {hasApiKey && (
        <div className="flex gap-2">
          <button
            onClick={() => setMode("direct")}
            className={`rounded-md px-3 py-1.5 text-xs transition-colors ${
              mode === "direct"
                ? "bg-eos-teal/20 text-eos-teal"
                : "text-dawn-mist/40 hover:text-dawn-mist/60"
            }`}
          >
            direct (API)
          </button>
          <button
            onClick={() => setMode("paste")}
            className={`rounded-md px-3 py-1.5 text-xs transition-colors ${
              mode === "paste"
                ? "bg-eos-teal/20 text-eos-teal"
                : "text-dawn-mist/40 hover:text-dawn-mist/60"
            }`}
          >
            copy-paste
          </button>
        </div>
      )}

      {mode === "direct" ? (
        /* Direct mode */
        <div className="space-y-3">
          <p className="text-xs text-dawn-mist/50">
            Sends your sunrise photo and the scoring rubric directly to Claude.
            Scores populate automatically.
          </p>
          {!photo && (
            <p className="text-xs text-sunrise-orange">
              Upload a sunrise photo above first.
            </p>
          )}
          <button
            onClick={handleDirectScore}
            disabled={loading || !photo}
            className="w-full rounded-lg bg-eos-teal px-4 py-2.5 text-sm font-medium text-pre-dawn transition-colors hover:bg-eos-teal/90 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? "scoring..." : "score this sunrise"}
          </button>
        </div>
      ) : (
        /* Copy-paste mode */
        <div className="space-y-3">
          <p className="text-xs text-dawn-mist/50">
            Copy the prompt below, paste it into Claude along with your sunrise
            photo, then paste the JSON response back here.
          </p>

          {/* Read-only prompt */}
          <div className="relative">
            <textarea
              readOnly
              value={prompt}
              rows={6}
              className="w-full rounded-lg border border-dawn-mist/10 bg-pre-dawn p-3 text-xs text-dawn-mist/60 font-mono resize-none"
            />
            <button
              onClick={copyPrompt}
              className="absolute top-2 right-2 rounded-md bg-dawn-mist/10 px-2 py-1 text-xs text-dawn-mist/50 hover:text-dawn-mist transition-colors"
            >
              {copied ? "copied" : "copy prompt"}
            </button>
          </div>

          {/* JSON input */}
          <textarea
            value={jsonInput}
            onChange={(e) => {
              setJsonInput(e.target.value);
              setError(null);
            }}
            placeholder="Paste Claude's JSON response here..."
            rows={6}
            className="w-full rounded-lg border border-dawn-mist/10 bg-dawn-mist/5 p-3 text-xs text-dawn-mist font-mono placeholder:text-dawn-mist/20 focus:border-eos-teal/50 focus:outline-none resize-none"
          />

          <button
            onClick={handlePasteApply}
            disabled={!jsonInput.trim()}
            className="w-full rounded-lg bg-eos-teal px-4 py-2.5 text-sm font-medium text-pre-dawn transition-colors hover:bg-eos-teal/90 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            apply scores
          </button>
        </div>
      )}

      {error && (
        <p className="text-xs text-sunrise-orange">{error}</p>
      )}
    </div>
  );
}
