import { prisma } from "@/lib/db";
import { SITE_URL, brandSlug, sizeSlug } from "@/lib/site";
import { STATES } from "@/lib/states";
import { CITIES } from "@/lib/cities";

export const dynamic = "force-dynamic";

export default async function sitemap() {
  const now = new Date();
  const url = (path) => `${SITE_URL}${path}`;

  const staticPages = [
    "/", "/browse", "/locations", "/states", "/guide", "/sell-tires",
    "/how-it-works", "/founding-seller", "/trust-safety", "/about", "/app",
  ].map((p) => ({
    url: url(p),
    lastModified: now,
    changeFrequency: p === "/" || p === "/browse" ? "daily" : "weekly",
    priority: p === "/" ? 1 : 0.7,
  }));

  // Programmatic Broward city landing pages — the core local-SEO play.
  const cityPages = CITIES.map((c) => ({
    url: url(`/used-tires/${c.slug}`),
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  let statePages = [];
  let brandPages = [];
  let sizePages = [];
  let listingPages = [];
  try {
    // Per-state browse pages — only states with at least one active listing,
    // so we don't hand crawlers 50 empty result pages. One grouped count query
    // (same shape /states uses), filtered to the same visibility rules as the
    // listing/brand/size entries below.
    const grouped = await prisma.listing.groupBy({
      by: ["state"],
      where: { status: "active", hidden: false, seller: { deletedAt: null } },
      _count: { _all: true },
    });
    const populated = new Set(grouped.filter((g) => g.state && g._count._all > 0).map((g) => g.state));
    statePages = STATES.filter((s) => populated.has(s.abbr)).map((s) => ({
      url: url(`/browse?state=${s.abbr}`),
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.6,
    }));

    const brands = await prisma.listing.findMany({
      where: { status: "active", hidden: false, seller: { deletedAt: null } },
      select: { brand: true },
      distinct: ["brand"],
    });
    brandPages = brands.map((b) => ({
      url: url(`/tires/${brandSlug(b.brand)}`),
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.6,
    }));

    // Per-size landing pages (distinct sizes that have structured columns set).
    const sizes = await prisma.listing.findMany({
      where: { status: "active", hidden: false, seller: { deletedAt: null }, rimDiameter: { not: null } },
      select: { size: true },
      distinct: ["size"],
    });
    sizePages = sizes.map((s) => ({
      url: url(`/sizes/${sizeSlug(s.size)}`),
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.6,
    }));

    const listings = await prisma.listing.findMany({
      where: { status: "active", hidden: false, seller: { deletedAt: null } },
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
    // DB unavailable at build time — static + city pages are still emitted.
  }

  return [...staticPages, ...cityPages, ...statePages, ...brandPages, ...sizePages, ...listingPages];
}
