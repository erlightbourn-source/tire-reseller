import { prisma } from "@/lib/db";
import { SITE_URL, brandSlug } from "@/lib/site";
import { STATES } from "@/lib/states";

export const dynamic = "force-dynamic";

export default async function sitemap() {
  const now = new Date();
  const url = (path) => `${SITE_URL}${path}`;

  const staticPages = ["/", "/browse", "/states", "/guide", "/sell-tires", "/app", "/pro"].map((p) => ({
    url: url(p),
    lastModified: now,
    changeFrequency: p === "/" || p === "/browse" ? "daily" : "weekly",
    priority: p === "/" ? 1 : 0.7,
  }));

  // Per-state browse pages
  const statePages = STATES.map((s) => ({
    url: url(`/browse?state=${s.abbr}`),
    lastModified: now,
    changeFrequency: "daily",
    priority: 0.6,
  }));

  let brandPages = [];
  let listingPages = [];
  try {
    const brands = await prisma.listing.findMany({
      where: { status: "active", hidden: false },
      select: { brand: true },
      distinct: ["brand"],
    });
    brandPages = brands.map((b) => ({
      url: url(`/tires/${brandSlug(b.brand)}`),
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.6,
    }));

    const listings = await prisma.listing.findMany({
      where: { status: "active", hidden: false },
      select: { id: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
      take: 5000,
    });
    listingPages = listings.map((l) => ({
      url: url(`/listings/${l.id}`),
      lastModified: l.updatedAt,
      changeFrequency: "weekly",
      priority: 0.5,
    }));
  } catch {
    // DB unavailable at build time — static pages are still emitted.
  }

  return [...staticPages, ...statePages, ...brandPages, ...listingPages];
}
