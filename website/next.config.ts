import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The stay finder lives at /lookouts; these open it pre-filtered.
  async redirects() {
    return [
      { source: "/cabins", destination: "/lookouts?type=cabin", permanent: false },
      { source: "/guard-stations", destination: "/lookouts?type=guard_station", permanent: false },
    ];
  },
  images: {
    // AVIF where supported, WebP otherwise. Photos are served at the width
    // each screen needs instead of straight off the camera.
    formats: ["image/avif", "image/webp"],
    qualities: [75],
    // Sunrise photos rarely change once published.
    minimumCacheTTL: 2678400, // 31 days
    remotePatterns: [
      // Supabase storage for this project (episode thumbnails, media, discoveries,
      // member photos). The old custom domain site.thezorafiles.com is retired.
      { protocol: "https", hostname: "bdszbuchldnxlywxylbo.supabase.co", pathname: "/storage/v1/object/public/**", search: "" },
      // YouTube fallback thumbnails
      { protocol: "https", hostname: "i.ytimg.com", pathname: "/vi/**", search: "" },
    ],
  },
};

export default nextConfig;
