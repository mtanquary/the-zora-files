"use client";

import { useState, useRef } from "react";
import { Ornament } from "@/components/atmosphere";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface ExistingPlan {
  folder: string;
  code: string;
  title: string;
  hasPlan: boolean;
  hasProductionSheet: boolean;
}

interface DiscoveryHint {
  name: string;
  rarity: string;
  note: string;
}

interface LocationSuggestion {
  name: string;
  coordinates: string;
  distance_from_base: string;
  why: string;
  notable_discoveries: DiscoveryHint[];
  effort_level: string;
  best_season: string;
  trail_info: string;
  fee: string;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const EFFORT_COLORS: Record<string, string> = {
  Roadside: "text-mist-dim",
  Trail: "text-teal-light",
  Summit: "text-zora-amber",
  Remote: "text-sunrise-orange",
  Expedition: "text-amber-light",
};

const RARITY_COLORS: Record<string, string> = {
  common: "text-mist-dim",
  uncommon: "text-teal-light",
  rare: "text-zora-amber",
  very_rare: "text-sunrise-orange",
  "very rare": "text-sunrise-orange",
  exceptional: "text-amber-light",
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function PlannerForm({
  existingPlans,
  nextEpisodeNumber,
}: {
  existingPlans: ExistingPlan[];
  nextEpisodeNumber: number;
}) {
  // Steps: "inspire" → "configure" → "plan" → "production"
  const [step, setStep] = useState<"inspire" | "configure" | "plan" | "production">("inspire");

  // Step 1: Inspiration
  const [prompt, setPrompt] = useState("");
  const [region, setRegion] = useState("Arizona");
  const [country, setCountry] = useState("US");
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [suggestError, setSuggestError] = useState<string | null>(null);

  // Step 2: Configure
  const [selectedLocation, setSelectedLocation] = useState<LocationSuggestion | null>(null);
  const [customLocation, setCustomLocation] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [episodeNumber, setEpisodeNumber] = useState(nextEpisodeNumber);
  const [season, setSeason] = useState(1);
  const [purposeNotes, setPurposeNotes] = useState("");

  // Step 3: Plan
  const [planMarkdown, setPlanMarkdown] = useState("");
  const [planTitle, setPlanTitle] = useState("");
  const [planFolder, setPlanFolder] = useState("");
  const [planLoading, setPlanLoading] = useState(false);
  const [planError, setPlanError] = useState<string | null>(null);

  // Step 4: Production sheet
  const [productionSheet, setProductionSheet] = useState("");
  const [sheetLoading, setSheetLoading] = useState(false);
  const [sheetError, setSheetError] = useState<string | null>(null);

  // Viewing existing plans
  const [viewingContent, setViewingContent] = useState<string | null>(null);
  const [viewingLabel, setViewingLabel] = useState("");
  const [viewingLoading, setViewingLoading] = useState<string | null>(null);

  const printRef = useRef<HTMLDivElement>(null);

  /* ------ API calls ------ */

  /** Safely parse JSON from a fetch response, returning null on failure. */
  const safeJson = async (res: Response) => {
    const text = await res.text();
    if (!text) return null;
    try { return JSON.parse(text); } catch { return null; }
  };

  const handleViewFile = async (folder: string, file: string, label: string) => {
    const key = `${folder}/${file}`;
    setViewingLoading(key);
    try {
      const res = await fetch("/api/ai-episode-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "read-plan", folder, file }),
      });
      const data = await safeJson(res);
      if (res.ok && data?.content) {
        setViewingContent(data.content);
        setViewingLabel(label);
      }
    } catch {
      // best effort
    } finally {
      setViewingLoading(null);
    }
  };

  const handleSuggestLocations = async () => {
    setSuggestLoading(true);
    setSuggestError(null);
    try {
      const res = await fetch("/api/ai-episode-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "suggest-locations",
          prompt: prompt || undefined,
          region,
          country,
        }),
      });
      const data = await safeJson(res);
      if (res.ok && data?.suggestions) {
        setSuggestions(data.suggestions);
      } else {
        setSuggestError(data?.error || `Request failed (${res.status})`);
      }
    } catch (err) {
      setSuggestError(err instanceof Error ? err.message : "Network error");
    } finally {
      setSuggestLoading(false);
    }
  };

  const handleSelectLocation = (loc: LocationSuggestion) => {
    setSelectedLocation(loc);
    setCustomLocation("");
    setStep("configure");
  };

  const handleUseCustomLocation = () => {
    setSelectedLocation(null);
    setStep("configure");
  };

  const handleGeneratePlan = async () => {
    const loc = selectedLocation;
    const locationName = loc?.name || customLocation;
    if (!locationName) return;

    setPlanLoading(true);
    setPlanError(null);
    try {
      const res = await fetch("/api/ai-episode-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate-plan",
          location: locationName,
          coordinates: loc?.coordinates || "",
          region,
          country,
          date,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          episode_number: String(episodeNumber),
          season: String(season),
          trail_info: loc?.trail_info || "",
          fee: loc?.fee || "",
          effort_level: loc?.effort_level || "",
          notable_discoveries: loc?.notable_discoveries
            ? loc.notable_discoveries.map((d) => `${d.name} (${d.rarity})`).join(", ")
            : "",
          purpose_notes: purposeNotes,
          distance_from_base: loc?.distance_from_base || "",
        }),
      });
      const data = await safeJson(res);
      if (res.ok && data?.plan) {
        setPlanMarkdown(data.plan);
        setPlanTitle(data.title || "Untitled");
        setPlanFolder(data.folder_name || "");
        setStep("plan");
      } else {
        setPlanError(data?.error || `Request failed (${res.status})`);
      }
    } catch (err) {
      setPlanError(err instanceof Error ? err.message : "Network error");
    } finally {
      setPlanLoading(false);
    }
  };

  const handleGenerateProductionSheet = async () => {
    setSheetLoading(true);
    setSheetError(null);
    try {
      const res = await fetch("/api/ai-episode-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate-production-sheet",
          plan: planMarkdown,
          date,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }),
      });
      const data = await safeJson(res);
      if (res.ok && data?.production_sheet) {
        setProductionSheet(data.production_sheet);
        setStep("production");
      } else {
        setSheetError(data?.error || `Request failed (${res.status})`);
      }
    } catch (err) {
      setSheetError(err instanceof Error ? err.message : "Network error");
    } finally {
      setSheetLoading(false);
    }
  };

  /* ------ Download helper ------ */

  const downloadMarkdown = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  /* ------ Print helper ------ */

  const handlePrint = () => {
    window.print();
  };

  /* ------ Simple markdown renderer ------ */

  const renderMarkdown = (md: string) => {
    // Very lightweight markdown → HTML for display
    const lines = md.split("\n");
    const html: string[] = [];
    let inTable = false;
    let inChecklist = false;

    // Sections that should start on a new page when printing
    const PAGE_BREAK_SECTIONS = [
      "discovery targets",
      "discoveries",
      "eos index",
      "tonight",
      "shot list",
      "what to say on camera",
      "discovery targets — what to look",
      "sunrise scoring reference",
    ];

    for (const line of lines) {
      // Headings
      if (line.startsWith("# ")) {
        if (inTable) { html.push("</table>"); inTable = false; }
        // Episode title — no forced break (it's already first on the page after hiding UI)
        html.push(`<h1 class="font-display-ornate text-2xl text-zora-amber mt-8 mb-3">${esc(line.slice(2))}</h1>`);
      } else if (line.startsWith("## ")) {
        if (inTable) { html.push("</table>"); inTable = false; }
        const heading = line.slice(3);
        const needsBreak = PAGE_BREAK_SECTIONS.some((s) => heading.toLowerCase().startsWith(s));
        const breakStyle = needsBreak ? ' style="break-before: page;"' : "";
        html.push(`<h2 class="font-display text-lg text-dawn-mist mt-6 mb-2"${breakStyle}>${esc(heading)}</h2>`);
      } else if (line.startsWith("### ")) {
        if (inTable) { html.push("</table>"); inTable = false; }
        html.push(`<h3 class="font-display text-sm text-zora-amber/80 mt-4 mb-1">${esc(line.slice(4))}</h3>`);
      }
      // HR
      else if (line.match(/^---+$/)) {
        if (inTable) { html.push("</table>"); inTable = false; }
        html.push(`<hr class="border-rule my-6" />`);
      }
      // Table rows
      else if (line.startsWith("|")) {
        const cells = line.split("|").slice(1, -1).map((c) => c.trim());
        // Skip separator rows
        if (cells.every((c) => /^[-:]+$/.test(c))) continue;
        if (!inTable) {
          html.push(`<table class="w-full text-xs border-collapse my-2" style="break-inside: avoid;">`);
          inTable = true;
          // First row is header
          html.push("<tr>" + cells.map((c) =>
            `<th class="text-left px-2 py-1 border-b border-rule text-mist-dim/60 font-mono text-[0.6rem] uppercase tracking-wider">${esc(c)}</th>`
          ).join("") + "</tr>");
          continue;
        }
        html.push("<tr>" + cells.map((c) =>
          `<td class="px-2 py-1 border-b border-dawn-mist/[0.05] text-dawn-mist">${formatInline(c)}</td>`
        ).join("") + "</tr>");
      }
      // Checkboxes
      else if (line.match(/^- \[[ x]\] /)) {
        if (inTable) { html.push("</table>"); inTable = false; }
        if (!inChecklist) { html.push(`<ul class="space-y-1 my-2" style="break-inside: avoid;">`); inChecklist = true; }
        const checked = line.includes("[x]");
        const text = line.replace(/^- \[[ x]\] /, "");
        html.push(`<li class="flex items-start gap-2 text-sm text-dawn-mist"><span class="text-mist-dim/40 mt-0.5">${checked ? "☑" : "☐"}</span><span>${formatInline(text)}</span></li>`);
      }
      // Bullet points
      else if (line.startsWith("- ")) {
        if (inTable) { html.push("</table>"); inTable = false; }
        if (inChecklist) { html.push("</ul>"); inChecklist = false; }
        html.push(`<p class="text-sm text-dawn-mist pl-3 my-0.5">· ${formatInline(line.slice(2))}</p>`);
      }
      // Blockquote
      else if (line.startsWith("> ")) {
        if (inTable) { html.push("</table>"); inTable = false; }
        html.push(`<blockquote class="border-l-2 border-zora-amber/30 pl-3 my-2 text-sm text-dawn-mist/80 italic">${formatInline(line.slice(2))}</blockquote>`);
      }
      // Empty line
      else if (line.trim() === "") {
        if (inTable) { html.push("</table>"); inTable = false; }
        if (inChecklist) { html.push("</ul>"); inChecklist = false; }
      }
      // Regular text
      else {
        if (inTable) { html.push("</table>"); inTable = false; }
        if (inChecklist) { html.push("</ul>"); inChecklist = false; }
        html.push(`<p class="text-sm text-dawn-mist my-1">${formatInline(line)}</p>`);
      }
    }
    if (inTable) html.push("</table>");
    if (inChecklist) html.push("</ul>");

    return html.join("\n");
  };

  /* ------ Render ------ */

  return (
    <div className="mt-8 space-y-8">
      {/* Step indicator */}
      <div className="flex items-center gap-2 font-mono text-[0.6rem] uppercase tracking-wider print-none">
        {(["inspire", "configure", "plan", "production"] as const).map((s, i) => (
          <span key={s} className="flex items-center gap-2">
            {i > 0 && <span className="text-mist-dim/30">→</span>}
            <button
              onClick={() => {
                // Allow navigating back to completed steps
                const order = ["inspire", "configure", "plan", "production"] as const;
                if (order.indexOf(s) <= order.indexOf(step)) setStep(s);
              }}
              className={`${
                s === step
                  ? "text-zora-amber"
                  : s === "inspire" || (s === "configure" && step !== "inspire") || (s === "plan" && (step === "plan" || step === "production"))
                    ? "text-mist-dim hover:text-dawn-mist cursor-pointer"
                    : "text-mist-dim/30 cursor-default"
              }`}
            >
              {s}
            </button>
          </span>
        ))}
      </div>

      {/* ============================================================ */}
      {/*  STEP 1: INSPIRE — location suggestions                      */}
      {/* ============================================================ */}
      {step === "inspire" && (
        <div className="space-y-6">
          <div className="bg-pre-dawn-mid border border-rule rounded-md p-5 space-y-4 print-none">
            <div>
              <label className="block font-mono text-[0.6rem] text-mist-dim/60 uppercase tracking-wider mb-1">
                what are you looking for?
              </label>
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. &quot;good chance to spot bighorn sheep&quot; or &quot;water sunrise&quot; or leave blank for general suggestions"
                className="w-full rounded-md border border-rule bg-pre-dawn-light px-3 py-2 text-sm text-dawn-mist placeholder:text-mist-dim/30 focus:border-zora-amber/50 focus:outline-none font-body"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block font-mono text-[0.6rem] text-mist-dim/60 uppercase tracking-wider mb-1">
                  region / state
                </label>
                <input
                  type="text"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="w-full rounded-md border border-rule bg-pre-dawn-light px-3 py-2 text-sm text-dawn-mist focus:border-zora-amber/50 focus:outline-none font-body"
                />
              </div>
              <div>
                <label className="block font-mono text-[0.6rem] text-mist-dim/60 uppercase tracking-wider mb-1">
                  country
                </label>
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full rounded-md border border-rule bg-pre-dawn-light px-3 py-2 text-sm text-dawn-mist focus:border-zora-amber/50 focus:outline-none font-body"
                />
              </div>
            </div>
            <button
              onClick={handleSuggestLocations}
              disabled={suggestLoading}
              className="w-full rounded-md bg-eos-teal px-4 py-2.5 text-sm font-medium text-pre-dawn transition-colors hover:bg-eos-teal/90 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {suggestLoading ? "scouting locations..." : "suggest locations"}
            </button>
          </div>

          {suggestError && (
            <div className="bg-pre-dawn-mid border border-sunrise-orange/40 rounded-md p-4 print-none">
              <p className="text-sm text-sunrise-orange">{suggestError}</p>
            </div>
          )}

          {/* Location suggestions */}
          {suggestions.length > 0 && (
            <div className="space-y-3 print-none">
              <Ornament label="Suggested locations" />
              {suggestions.map((loc) => (
                <button
                  key={loc.name}
                  onClick={() => handleSelectLocation(loc)}
                  className="w-full text-left bg-pre-dawn-mid border border-rule rounded-md p-5 transition-colors hover:border-zora-amber/40 group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="font-display text-sm text-dawn-mist group-hover:text-zora-amber transition-colors">
                        {loc.name}
                      </p>
                      <p className="text-xs text-mist-dim mt-1">{loc.why}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`font-mono text-[0.6rem] uppercase tracking-wider ${EFFORT_COLORS[loc.effort_level] || "text-mist-dim"}`}>
                        {loc.effort_level}
                      </span>
                      <p className="font-mono text-[0.6rem] text-mist-dim/50 mt-0.5">
                        ~{loc.distance_from_base} mi
                      </p>
                    </div>
                  </div>

                  {/* Notable discoveries */}
                  {loc.notable_discoveries?.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {loc.notable_discoveries.map((d) => (
                        <span
                          key={d.name}
                          className={`inline-flex items-center gap-1 font-mono text-[0.55rem] uppercase tracking-wider px-2 py-0.5 rounded-full border border-dawn-mist/[0.08] ${RARITY_COLORS[d.rarity] || "text-mist-dim"}`}
                        >
                          {d.name}
                          <span className="opacity-50">· {d.rarity.replace("_", " ")}</span>
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="mt-2 flex gap-4 text-[0.6rem] text-mist-dim/50">
                    <span>{loc.trail_info}</span>
                    <span>{loc.fee}</span>
                    <span>best: {loc.best_season}</span>
                  </div>
                </button>
              ))}

              {/* Or use custom location */}
              <div className="bg-pre-dawn-mid border border-rule rounded-md p-4">
                <p className="font-mono text-[0.6rem] text-mist-dim/60 uppercase tracking-wider mb-2">
                  or enter your own location
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customLocation}
                    onChange={(e) => setCustomLocation(e.target.value)}
                    placeholder="Location name"
                    className="flex-1 rounded-md border border-rule bg-pre-dawn-light px-3 py-2 text-sm text-dawn-mist placeholder:text-mist-dim/30 focus:border-zora-amber/50 focus:outline-none font-body"
                  />
                  <button
                    onClick={handleUseCustomLocation}
                    disabled={!customLocation}
                    className="rounded-md bg-pre-dawn-light border border-rule px-4 py-2 text-sm text-dawn-mist hover:border-zora-amber/40 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    use this
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Existing plans */}
          {existingPlans.length > 0 && (
            <div className="print-none">
              <Ornament label="Existing plans" />
              <div className="bg-pre-dawn-mid border border-rule rounded-md">
                {existingPlans.map((p, i) => (
                  <div
                    key={p.folder}
                    className={`flex items-center justify-between px-5 py-3 ${
                      i < existingPlans.length - 1 ? "border-b border-dawn-mist/[0.05]" : ""
                    }`}
                  >
                    <div>
                      <span className="font-display text-sm text-dawn-mist">
                        {p.code} · &ldquo;{p.title}&rdquo;
                      </span>
                    </div>
                    <div className="flex gap-3">
                      {p.hasPlan && (
                        <button
                          onClick={() => handleViewFile(p.folder, "plan.md", `${p.code} — plan`)}
                          disabled={viewingLoading === `${p.folder}/plan.md`}
                          className="font-mono text-[0.6rem] text-eos-teal hover:text-eos-teal/70 transition-colors disabled:opacity-40"
                        >
                          {viewingLoading === `${p.folder}/plan.md` ? "loading..." : "plan"}
                        </button>
                      )}
                      {p.hasProductionSheet && (
                        <button
                          onClick={() => handleViewFile(p.folder, "production-sheet.md", `${p.code} — production sheet`)}
                          disabled={viewingLoading === `${p.folder}/production-sheet.md`}
                          className="font-mono text-[0.6rem] text-zora-amber hover:text-zora-amber/70 transition-colors disabled:opacity-40"
                        >
                          {viewingLoading === `${p.folder}/production-sheet.md` ? "loading..." : "prod sheet"}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Viewing an existing plan/production sheet */}
          {viewingContent && (
            <>
              <div className="print-none">
                <Ornament label={viewingLabel} />
                <div className="flex flex-wrap gap-2 mb-2">
                  <button
                    onClick={() => window.print()}
                    className="rounded-md bg-pre-dawn-mid border border-rule px-4 py-2 text-sm text-dawn-mist hover:border-zora-amber/40 transition-colors"
                  >
                    print
                  </button>
                  <button
                    onClick={() => { setViewingContent(null); setViewingLabel(""); }}
                    className="rounded-md bg-pre-dawn-mid border border-rule px-4 py-2 text-sm text-dawn-mist hover:border-zora-amber/40 transition-colors"
                  >
                    close
                  </button>
                </div>
              </div>
              <div
                className="bg-pre-dawn-mid border border-rule rounded-md p-6 print-only"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(viewingContent) }}
              />
            </>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/*  STEP 2: CONFIGURE — refine details before generating        */}
      {/* ============================================================ */}
      {step === "configure" && (
        <div className="space-y-6">
          {/* Selected location summary */}
          {selectedLocation && (
            <div className="bg-pre-dawn-mid border border-zora-amber/30 rounded-md p-5">
              <p className="font-display text-sm text-zora-amber">{selectedLocation.name}</p>
              <p className="text-xs text-mist-dim mt-1">{selectedLocation.why}</p>
              <div className="mt-2 flex gap-4 text-[0.6rem] text-mist-dim/50">
                <span>~{selectedLocation.distance_from_base} mi</span>
                <span>{selectedLocation.effort_level}</span>
                <span>{selectedLocation.trail_info}</span>
              </div>
            </div>
          )}

          <div className="bg-pre-dawn-mid border border-rule rounded-md p-5 space-y-4">
            {/* Custom location name if no suggestion selected */}
            {!selectedLocation && (
              <div>
                <label className="block font-mono text-[0.6rem] text-mist-dim/60 uppercase tracking-wider mb-1">
                  location
                </label>
                <input
                  type="text"
                  value={customLocation}
                  onChange={(e) => setCustomLocation(e.target.value)}
                  placeholder="Full location name"
                  className="w-full rounded-md border border-rule bg-pre-dawn-light px-3 py-2 text-sm text-dawn-mist placeholder:text-mist-dim/30 focus:border-zora-amber/50 focus:outline-none font-body"
                />
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="block font-mono text-[0.6rem] text-mist-dim/60 uppercase tracking-wider mb-1">
                  target date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-md border border-rule bg-pre-dawn-light px-3 py-2 text-sm text-dawn-mist focus:border-zora-amber/50 focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-mono text-[0.6rem] text-mist-dim/60 uppercase tracking-wider mb-1">
                  season
                </label>
                <input
                  type="number"
                  min={1}
                  value={season}
                  onChange={(e) => setSeason(parseInt(e.target.value, 10) || 1)}
                  className="w-full rounded-md border border-rule bg-pre-dawn-light px-3 py-2 text-sm text-dawn-mist focus:border-zora-amber/50 focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-mono text-[0.6rem] text-mist-dim/60 uppercase tracking-wider mb-1">
                  episode #
                </label>
                <input
                  type="number"
                  min={1}
                  value={episodeNumber}
                  onChange={(e) => setEpisodeNumber(parseInt(e.target.value, 10) || 1)}
                  className="w-full rounded-md border border-rule bg-pre-dawn-light px-3 py-2 text-sm text-dawn-mist focus:border-zora-amber/50 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block font-mono text-[0.6rem] text-mist-dim/60 uppercase tracking-wider mb-1">
                notes / goals for this episode
              </label>
              <textarea
                value={purposeNotes}
                onChange={(e) => setPurposeNotes(e.target.value)}
                placeholder="e.g. &quot;I want to contrast this with E02's water location&quot; or &quot;Focus on desert tortoise habitat&quot;"
                rows={3}
                className="w-full rounded-md border border-rule bg-pre-dawn-light px-3 py-2 text-sm text-dawn-mist placeholder:text-mist-dim/30 focus:border-zora-amber/50 focus:outline-none font-body resize-none"
              />
            </div>

            <button
              onClick={handleGeneratePlan}
              disabled={planLoading || (!selectedLocation && !customLocation)}
              className="w-full rounded-md bg-eos-teal px-4 py-2.5 text-sm font-medium text-pre-dawn transition-colors hover:bg-eos-teal/90 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {planLoading ? "generating plan..." : "generate episode plan"}
            </button>
          </div>

          {planError && (
            <div className="bg-pre-dawn-mid border border-sunrise-orange/40 rounded-md p-4">
              <p className="text-sm text-sunrise-orange">{planError}</p>
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/*  STEP 3: PLAN — view, print, download                        */}
      {/* ============================================================ */}
      {step === "plan" && planMarkdown && (
        <div className="space-y-6">
          {/* Actions bar — hidden in print */}
          <div className="flex flex-wrap gap-2 print-none">
            <button
              onClick={() => downloadMarkdown(planMarkdown, `plan.md`)}
              className="rounded-md bg-pre-dawn-mid border border-rule px-4 py-2 text-sm text-dawn-mist hover:border-zora-amber/40 transition-colors"
            >
              download plan.md
            </button>
            <button
              onClick={handlePrint}
              className="rounded-md bg-pre-dawn-mid border border-rule px-4 py-2 text-sm text-dawn-mist hover:border-zora-amber/40 transition-colors"
            >
              print
            </button>
            <button
              onClick={handleGenerateProductionSheet}
              disabled={sheetLoading}
              className="rounded-md bg-eos-teal px-4 py-2 text-sm font-medium text-pre-dawn transition-colors hover:bg-eos-teal/90 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {sheetLoading ? "generating..." : "generate production sheet"}
            </button>
          </div>

          {sheetError && (
            <div className="bg-pre-dawn-mid border border-sunrise-orange/40 rounded-md p-4 print-none">
              <p className="text-sm text-sunrise-orange">{sheetError}</p>
            </div>
          )}

          {planFolder && (
            <p className="font-mono text-[0.6rem] text-mist-dim/50 print-none">
              save to: episodes/season-{String(season).padStart(2, "0")}/{planFolder}/
            </p>
          )}

          {/* Rendered plan */}
          <div
            ref={printRef}
            className="bg-pre-dawn-mid border border-rule rounded-md p-6 print-only"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(planMarkdown) }}
          />
        </div>
      )}

      {/* ============================================================ */}
      {/*  STEP 4: PRODUCTION SHEET — view, print, download             */}
      {/* ============================================================ */}
      {step === "production" && productionSheet && (
        <div className="space-y-6">
          {/* Actions bar — hidden in print */}
          <div className="flex flex-wrap gap-2 print-none">
            <button
              onClick={() => downloadMarkdown(productionSheet, `production-sheet.md`)}
              className="rounded-md bg-pre-dawn-mid border border-rule px-4 py-2 text-sm text-dawn-mist hover:border-zora-amber/40 transition-colors"
            >
              download production-sheet.md
            </button>
            <button
              onClick={handlePrint}
              className="rounded-md bg-pre-dawn-mid border border-rule px-4 py-2 text-sm text-dawn-mist hover:border-zora-amber/40 transition-colors"
            >
              print
            </button>
            <button
              onClick={() => setStep("plan")}
              className="rounded-md bg-pre-dawn-mid border border-rule px-4 py-2 text-sm text-dawn-mist hover:border-zora-amber/40 transition-colors"
            >
              ← back to plan
            </button>
          </div>

          {/* Rendered production sheet */}
          <div
            className="bg-pre-dawn-mid border border-rule rounded-md p-6 print-only"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(productionSheet) }}
          />
        </div>
      )}

      {/* ============================================================ */}
      {/*  Start over (visible on plan/production steps)                */}
      {/* ============================================================ */}
      {(step === "plan" || step === "production") && (
        <div className="pt-4 border-t border-rule print-none">
          <button
            onClick={() => {
              setStep("inspire");
              setPlanMarkdown("");
              setProductionSheet("");
              setPlanTitle("");
              setPlanFolder("");
              setSuggestions([]);
              setSelectedLocation(null);
              setCustomLocation("");
              setPurposeNotes("");
              setEpisodeNumber(nextEpisodeNumber);
            }}
            className="font-mono text-[0.6rem] text-mist-dim hover:text-zora-amber transition-colors uppercase tracking-wider"
          >
            plan another episode
          </button>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function formatInline(s: string): string {
  let out = esc(s);
  // Bold
  out = out.replace(/\*\*(.+?)\*\*/g, '<strong class="text-dawn-mist">$1</strong>');
  // Italic / underscore
  out = out.replace(/_(.+?)_/g, '<em class="text-mist-dim/70">$1</em>');
  // Inline code
  out = out.replace(/`(.+?)`/g, '<code class="text-zora-amber/80 text-[0.7rem]">$1</code>');
  return out;
}
