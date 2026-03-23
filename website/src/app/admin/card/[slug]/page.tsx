import { getEpisodeByNumber, getEpisodes } from "@/lib/queries";
import { notFound } from "next/navigation";
import { CardExport } from "./card-export";

export const dynamic = "force-dynamic";

export default async function CardPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const match = slug.match(/^s(\d+)e(\d+)$/i);
  if (!match) return notFound();

  const season = parseInt(match[1], 10);
  const episodeNumber = parseInt(match[2], 10);
  const ep = await getEpisodeByNumber(season, episodeNumber);
  if (!ep) return notFound();

  const allEpisodes = await getEpisodes();
  const totalExpeditions = allEpisodes.length;

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="font-display text-2xl font-bold text-zora-amber mb-2">
        export share card
      </h1>
      <p className="text-dawn-mist/50 text-sm mb-8">
        S{String(ep.season).padStart(2, "0")}E
        {String(ep.episode_number).padStart(2, "0")} — &ldquo;{ep.title}&rdquo;
      </p>
      <CardExport
        data={{
          title: ep.title,
          episode_number: ep.episode_number,
          season: ep.season,
          location_name: ep.location_name,
          shoot_date: ep.shoot_date,
          eos_total: ep.eos_total,
          effort_rating: ep.effort_rating,
          effort_points: ep.effort_points,
          streak_active: ep.streak_active,
          thumbnail_url: ep.thumbnail_url,
          distance_miles: ep.distance_miles,
          elevation_gain_ft: ep.elevation_gain_ft,
          minutes_before_sunrise: ep.minutes_before_sunrise,
          weather_notes: ep.weather_notes,
          total_expeditions: totalExpeditions,
        }}
      />
    </div>
  );
}
