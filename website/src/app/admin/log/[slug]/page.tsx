import type { Metadata } from "next";
import { LogForm } from "../log-form";
import { getEpisodeById, getEpisodes } from "@/lib/queries";
import { notFound } from "next/navigation";

export const metadata: Metadata = { title: "edit expedition" };
export const dynamic = "force-dynamic";

export default async function EditEpisodePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug: id } = await params;
  const hasApiKey = !!process.env.ANTHROPIC_API_KEY;
  const episodes = await getEpisodes();
  const totalExpeditions = episodes.length;
  const shootDates = episodes.map((e) => e.shoot_date).sort();

  const ep = await getEpisodeById(id);
  if (!ep) return notFound();

  const eos = ep.eos_index as {
    sky: { color_intensity: { score: number; rationale?: string }; cloud_engagement: { score: number; rationale?: string }; horizon_definition: { score: number; rationale?: string } };
    setting: { foreground_composition: { score: number; rationale?: string }; location_uniqueness: { score: number; rationale?: string } };
    conditions: { access_difficulty: { score: number; rationale?: string }; weather_challenge: { score: number; rationale?: string } };
  };

  const editData = {
    id: ep.id,
    episodeNumber: ep.episode_number,
    season: ep.season,
    title: ep.title,
    location: ep.location_name,
    country: ep.country,
    region: ep.region || "",
    trail: "",
    shootDate: typeof ep.shoot_date === "string"
      ? ep.shoot_date.split("T")[0]
      : new Date(ep.shoot_date).toISOString().split("T")[0],
    effortLevel: ep.effort_rating as 1 | 2 | 3 | 4 | 5,
    notes: ep.notes || "",
    thumbnailUrl: ep.thumbnail_url || "",
    scores: {
      color_intensity: eos.sky.color_intensity.score,
      cloud_engagement: eos.sky.cloud_engagement.score,
      horizon_definition: eos.sky.horizon_definition.score,
      foreground_composition: eos.setting.foreground_composition.score,
      location_uniqueness: eos.setting.location_uniqueness.score,
      access_difficulty: eos.conditions.access_difficulty.score,
      weather_challenge: eos.conditions.weather_challenge.score,
    },
    rationales: {
      color_intensity: eos.sky.color_intensity.rationale,
      cloud_engagement: eos.sky.cloud_engagement.rationale,
      horizon_definition: eos.sky.horizon_definition.rationale,
      foreground_composition: eos.setting.foreground_composition.rationale,
      location_uniqueness: eos.setting.location_uniqueness.rationale,
      access_difficulty: eos.conditions.access_difficulty.rationale,
      weather_challenge: eos.conditions.weather_challenge.rationale,
    },
  };

  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <h1 className="font-display text-3xl font-bold text-zora-amber mb-2">
        edit expedition
      </h1>
      <p className="text-dawn-mist/60 mb-8">
        S{String(ep.season).padStart(2, "0")}E
        {String(ep.episode_number).padStart(2, "0")} · &ldquo;{ep.title}&rdquo;
      </p>
      <LogForm
        hasApiKey={hasApiKey}
        totalExpeditions={totalExpeditions}
        shootDates={shootDates}
        editData={editData}
      />
    </div>
  );
}
