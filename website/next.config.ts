import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // AVIF where supported, WebP otherwise. Photos are served at the width
    // each screen needs instead of straight off the camera.
    formats: ["image/avif", "image/webp"],
    qualities: [75],
    // Sunrise photos rarely change once published.
    minimumCacheTTL: 2678400, // 31 days
    remotePatterns: [
      // Supabase storage on the custom domain (episode thumbnails, media, discoveries)
      { protocol: "https", hostname: "site.thezorafiles.com", pathname: "/storage/v1/object/public/**", search: "" },
      // Default Supabase domains, in case a URL was saved before the custom domain
      { protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**", search: "" },
      // YouTube fallback thumbnails
      { protocol: "https", hostname: "i.ytimg.com", pathname: "/vi/**", search: "" },
    ],
  },
};

export default nextConfig;
