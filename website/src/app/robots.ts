import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Host tools, member pages, auth flows, and APIs aren't for search results.
      disallow: ["/admin", "/api/", "/account", "/auth/", "/login", "/signup", "/reset-password"],
    },
    sitemap: "https://thezorafiles.com/sitemap.xml",
  };
}
