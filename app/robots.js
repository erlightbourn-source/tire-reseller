import { SITE_URL } from "@/lib/site";

// Allow crawling of public marketplace pages; keep private/account areas and the
// API out of the index (privacy + crawl-budget hygiene).
export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // "/sell" alone is a PREFIX rule: it also blocked /sell-tires (the seller landing page, in the
        // sitemap) and /sellers/* (public seller pages). GSC live test 2026-09-24 17:12: /sell-tires
        // "Blocked by robots.txt". Block only the listing form (/sell, /sell?...) and its sub-routes (/sell/...).
        disallow: ["/api/", "/dashboard", "/messages", "/favorites", "/saved", "/subscribe", "/sell$", "/sell?", "/sell/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
