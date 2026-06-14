import { SITE_URL } from "@/lib/site";

// Allow crawling of public marketplace pages; keep private/account areas and the
// API out of the index (privacy + crawl-budget hygiene).
export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/dashboard", "/messages", "/favorites", "/saved", "/subscribe", "/sell"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
