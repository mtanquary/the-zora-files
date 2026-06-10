import { getEpisodeByNumber, getEpisodes, getDiscoveriesByEpisode, getEpisodeMedia } from "@/lib/queries";
import { EFFORT_LEVELS, LEVELS } from "@/lib/types";
import { ZoraExpandable } from "@/components/zora-expandable";
import { MedallionEmblem } from "@/components/medallion-emblem";
import { Ornament } from "@/components/atmosphere";
import { groupDiscoveries } from "@/components/discovery-card";
import { DiscoveriesGrid } from "@/components/discoveries-grid";
import { MediaGallery } from "@/components/media-gallery";
import { youtubeEmbedUrl } from "@/lib/youtube";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function EpisodeDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Parse slug like "s01e01"
  const match = slug.match(/^s(\d+)e(\d+)$/i);
  if (!match) return notFound();

  const season = parseInt(match[1], 10);
  const episodeNumber = parseInt(match[2], 10);
  const ep = await getEpisodeByNumber(season, episodeNumber);

  if (!ep) return notFound();

  const mediaRows = await getEpisodeMedia(ep.id);
  const photoCount = mediaRows.filter((m) => m.kind === "photo").length;
  const videoCount = mediaRows.filter((m) => m.kind === "video").length;

  const effort = EFFORT_LEVELS.find((e) => e.level === ep.effort_rating);
  const eos = ep.eos_index as {
    sky: { color_intensity: { score: number; rationale?: string }; cloud_engagement: { score: number; rationale?: string }; horizon_definition: { score: number; rationale?: string } };
    setting: { foreground_composition: { score: number; rationale?: string }; location_uniqueness: { score: number; rationale?: string } };
    conditions: { access_difficulty: { score: number; rationale?: string }; weather_challenge: { score: number; rationale?: string } };
  };

  const skyTotal = eos.sky.color_intensity.score + eos.sky.cloud_engagement.score + eos.sky.horizon_definition.score;
  const settingTotal = eos.setting.foreground_composition.score + eos.setting.location_uniqueness.score;
  const conditionsTotal = eos.conditions.access_difficulty.score + eos.conditions.weather_challenge.score;

  // Medallion reflects level AT TIME of this episode
  const allEpisodes = await getEpisodes();
  const episodesAtTime = allEpisodes.filter(
    (e) => new Date(e.shoot_date) <= new Date(ep.shoot_date)
  ).length;
  const levelAtTime = LEVELS.filter((l) => episodesAtTime >= l.expeditions).pop()!;
  const nextLevelAtTime = LEVELS.find((l) => l.expeditions > episodesAtTime);
  const gemsAtTime = episodesAtTime - levelAtTime.expeditions;

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <div className="flex items-start gap-4 mb-1">
        <div className="flex-1">
          <p className="text-sm text-dawn-mist/40 mb-1">
            S{String(ep.season).padStart(2, "0")}E{String(ep.episode_number).padStart(2, "0")}
          </p>
          <h1 className="font-display text-3xl font-bold text-zora-amber">
            &ldquo;{ep.title}&rdquo;
          </h1>
        </div>
        <MedallionEmblem level={nextLevelAtTime ? nextLevelAtTime.level : levelAtTime.level} gems={gemsAtTime} size={72} />
      </div>
      <p className="text-dawn-mist/50 mb-8">
        {ep.location_name} · {new Date(ep.shoot_date).toLocaleDateString()}
      </p>

      {/* Sunrise photo */}
      {ep.thumbnail_url && (
        <div className="mb-10 rounded-xl overflow-hidden">
          <img
            src={ep.thumbnail_url}
            alt={`Sunrise at ${ep.location_name}`}
            className="w-full object-cover max-h-96"
          />
        </div>
      )}

      {/* YouTube episode */}
      {(() => {
        const url = ep.youtube_url;
        const embed = youtubeEmbedUrl(url);
        if (!embed || !url) return null;
        return (
          <section className="mb-10">
            <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-dawn-mist/10 bg-pre-dawn-light">
              <iframe
                src={embed}
                title={`${ep.title} — watch on YouTube`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
                className="absolute inset-0 w-full h-full"
              />
            </div>
            <p className="mt-2 text-right">
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-[0.6rem] uppercase tracking-wider text-mist-dim hover:text-zora-amber transition-colors"
              >
                watch on youtube ↗
              </a>
            </p>
          </section>
        );
      })()}

      {/* Score summary */}
      <div className="grid grid-cols-3 gap-4 mb-10">
        <div className="rounded-xl border border-dawn-mist/10 bg-dawn-mist/5 p-6 text-center">
          <p className="text-xs text-dawn-mist/40 mb-1">eos index</p>
          <p className="font-mono text-3xl text-eos-teal">{ep.eos_total}</p>
        </div>
        <div className="rounded-xl border border-dawn-mist/10 bg-dawn-mist/5 p-6 text-center">
          <p className="text-xs text-dawn-mist/40 mb-1">effort</p>
          <p className="font-mono text-3xl text-sunrise-orange">{ep.effort_points}</p>
          <p className="text-xs text-dawn-mist/40 mt-1">{effort?.label}</p>
        </div>
        <div className="rounded-xl border border-dawn-mist/10 bg-dawn-mist/5 p-6 flex flex-col items-center">
          <p className="text-xs text-dawn-mist/40 mb-1">zora score</p>
          <ZoraExpandable
            total={ep.zora_score.total}
            eosIndex={ep.zora_score.eos_index}
            effortPoints={ep.zora_score.effort_points}
            effortLabel={effort?.label || ""}
            discoveryPoints={ep.zora_score.discovery_points}
            size="lg"
          />
        </div>
      </div>

      {/* Eos Index breakdown */}
      <section className="mb-10">
        <h2 className="font-display text-lg font-semibold text-eos-teal mb-4">
          eos index breakdown
        </h2>
        <div className="space-y-4">
          {/* Sky */}
          <div className="rounded-xl border border-dawn-mist/10 p-4">
            <div className="flex justify-between mb-3">
              <h3 className="text-sm font-semibold text-dawn-mist">sky</h3>
              <span className="font-mono text-sm text-dawn-mist/50">{skyTotal}/50</span>
            </div>
            <div className="space-y-2 text-xs">
              <ScoreRow label="color intensity" score={eos.sky.color_intensity.score} max={20} rationale={eos.sky.color_intensity.rationale} />
              <ScoreRow label="cloud engagement" score={eos.sky.cloud_engagement.score} max={15} rationale={eos.sky.cloud_engagement.rationale} />
              <ScoreRow label="horizon definition" score={eos.sky.horizon_definition.score} max={15} rationale={eos.sky.horizon_definition.rationale} />
            </div>
          </div>

          {/* Setting */}
          <div className="rounded-xl border border-dawn-mist/10 p-4">
            <div className="flex justify-between mb-3">
              <h3 className="text-sm font-semibold text-dawn-mist">setting</h3>
              <span className="font-mono text-sm text-dawn-mist/50">{settingTotal}/30</span>
            </div>
            <div className="space-y-2 text-xs">
              <ScoreRow label="foreground composition" score={eos.setting.foreground_composition.score} max={15} rationale={eos.setting.foreground_composition.rationale} />
              <ScoreRow label="location uniqueness" score={eos.setting.location_uniqueness.score} max={15} rationale={eos.setting.location_uniqueness.rationale} />
            </div>
          </div>

          {/* Conditions */}
          <div className="rounded-xl border border-dawn-mist/10 p-4">
            <div className="flex justify-between mb-3">
              <h3 className="text-sm font-semibold text-dawn-mist">conditions</h3>
              <span className="font-mono text-sm text-dawn-mist/50">{conditionsTotal}/20</span>
            </div>
            <div className="space-y-2 text-xs">
              <ScoreRow label="access difficulty" score={eos.conditions.access_difficulty.score} max={10} rationale={eos.conditions.access_difficulty.rationale} />
              <ScoreRow label="weather challenge" score={eos.conditions.weather_challenge.score} max={10} rationale={eos.conditions.weather_challenge.rationale} />
            </div>
          </div>
        </div>
      </section>

      {/* Discoveries */}
      <DiscoveriesSection episodeId={ep.id} />

      {/* Field notes */}
      {ep.notes && (
        <section className="mb-10">
          <h2 className="font-display text-lg font-semibold text-dawn-mist mb-4">
            field notes
          </h2>
          <p className="text-dawn-mist/60 whitespace-pre-wrap">{ep.notes}</p>
        </section>
      )}

      {/* Companion media gallery */}
      {mediaRows.length > 0 && (
        <section>
          <Ornament label="Official record media" />
          <p className="text-xs text-dawn-mist/40 mb-4 -mt-4 font-mono uppercase tracking-wider">
            {photoCount > 0 && `${photoCount} photo${photoCount !== 1 ? "s" : ""}`}
            {photoCount > 0 && videoCount > 0 && " · "}
            {videoCount > 0 && `${videoCount} video${videoCount !== 1 ? "s" : ""}`}
          </p>
          <MediaGallery
            media={mediaRows.map((m) => ({
              id: m.id,
              kind: m.kind,
              url: m.url,
              caption: m.caption,
            }))}
          />
        </section>
      )}
    </div>
  );
}

async function DiscoveriesSection({ episodeId }: { episodeId: string }) {
  const discoveries = await getDiscoveriesByEpisode(episodeId);
  if (discoveries.length === 0) return null;

  const grouped = groupDiscoveries(discoveries);

  return (
    <section className="mb-10">
      <Ornament label="Discoveries" />
      <DiscoveriesGrid discoveries={grouped} showUnlockBadge />
    </section>
  );
}

function ScoreRow({
  label,
  score,
  max,
  rationale,
}: {
  label: string;
  score: number;
  max: number;
  rationale?: string;
}) {
  const pct = (score / max) * 100;
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-dawn-mist/60">{label}</span>
        <span className="font-mono text-dawn-mist/40">{score}/{max}</span>
      </div>
      <div className="h-1.5 rounded-full bg-dawn-mist/10">
        <div
          className="h-full rounded-full bg-eos-teal/60"
          style={{ width: `${pct}%` }}
        />
      </div>
      {rationale && (
        <p className="mt-1 text-dawn-mist/30 italic">{rationale}</p>
      )}
    </div>
  );
}
