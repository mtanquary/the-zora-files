/** Pull the video id out of any common YouTube URL shape. */
export function extractYouTubeId(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.hostname === "youtu.be") {
      return u.pathname.slice(1) || null;
    }
    if (u.hostname.endsWith("youtube.com") || u.hostname.endsWith("youtube-nocookie.com")) {
      if (u.pathname === "/watch") return u.searchParams.get("v");
      if (u.pathname.startsWith("/embed/")) return u.pathname.slice("/embed/".length) || null;
      if (u.pathname.startsWith("/shorts/")) return u.pathname.slice("/shorts/".length) || null;
      if (u.pathname.startsWith("/live/")) return u.pathname.slice("/live/".length) || null;
    }
  } catch {
    return null;
  }
  return null;
}

export function youtubeEmbedUrl(url: string | null | undefined): string | null {
  const id = extractYouTubeId(url);
  return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
}
