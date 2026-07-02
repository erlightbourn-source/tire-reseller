import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { formatPrice, timeAgo } from "@/lib/format";
import { seasonLabel, treadLabel, treadLifePct, perTire, conditionMeta, tireAge } from "@/lib/tire";
import { priceContext } from "@/lib/pricing";
import { jsonLdHtml } from "@/lib/jsonld";
import { sizeSlug } from "@/lib/site";
import { parseTireSize } from "@/lib/tiresize";
import MessageSeller from "@/components/MessageSeller";
import DeleteListingButton from "@/components/DeleteListingButton";
import PhotoGallery from "@/components/PhotoGallery";
import FavoriteButton from "@/components/FavoriteButton";
import Stars from "@/components/Stars";
import ListingCard from "@/components/ListingCard";
import ReportListing from "@/components/ReportListing";
import ShareListing from "@/components/ShareListing";
import TrackView from "@/components/TrackView";
import Badge, { ProBadge } from "@/components/Badge";
import { detectOffPlatform, SAFETY_WARNING } from "@/lib/safety";

export const dynamic = "force-dynamic";

async function fetchListing(id) {
  return prisma.listing.findUnique({
    where: { id },
    include: {
      photos: { orderBy: { sort: "asc" } },
      seller: { select: { id: true, name: true, location: true, createdAt: true, pro: true, deletedAt: true } },
      _count: { select: { threads: true } },
    },
  });
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const l = await prisma.listing.findUnique({
    where: { id },
    select: { brand: true, size: true, condition: true, quantity: true, priceCents: true, location: true, hidden: true, seller: { select: { deletedAt: true } }, photos: { take: 1, orderBy: { sort: "asc" }, select: { url: true } } },
  });
  if (!l || l.hidden || l.seller?.deletedAt) return { title: "Listing not found — TireTrader" };
  const cond = conditionMeta(l.condition).label;
  const title = `${cond} ${l.brand} ${l.size} (Qty ${l.quantity}) — ${formatPrice(l.priceCents)} | TireTrader`;
  const description = `${cond} set of ${l.quantity} ${l.brand} ${l.size} tires for ${formatPrice(l.priceCents)} in ${l.location}. Message the seller directly on TireTrader.`;
  return {
    title,
    description,
    alternates: { canonical: `/listings/${id}` },
    openGraph: { title, description, type: "website", images: l.photos[0]?.url ? [l.photos[0].url] : [] },
  };
}

export default async function ListingDetail({ params }) {
  const { id } = await params;
  const user = await getCurrentUser();
  const listing = await fetchListing(id);
  if (!listing) notFound();

  const isOwner = user?.id === listing.sellerId;
  // Hidden (moderation/auto-hide) or soft-deleted-seller listings must not be
  // reachable by direct URL for anyone but the owner — otherwise the report
  // auto-hide and account-deletion takedowns are trivially bypassed.
  if (!isOwner && (listing.hidden || listing.seller?.deletedAt)) notFound();

  if (!isOwner) {
    await prisma.listing.update({ where: { id: listing.id }, data: { views: { increment: 1 } } });
    await prisma.listingView.create({ data: { listingId: listing.id } }).catch(() => {});
  }

  let favorited = false;
  if (user) {
    favorited = !!(await prisma.favorite.findUnique({
      where: { userId_listingId: { userId: user.id, listingId: listing.id } },
    }));
  }

  const sellerRating = await prisma.review.aggregate({
    where: { sellerId: listing.sellerId },
    _avg: { rating: true },
    _count: { _all: true },
  });
  const avgRating = sellerRating._avg.rating || 0;
  const reviewCount = sellerRating._count._all;

  const candidates = await prisma.listing.findMany({
    where: { status: "active", hidden: false, seller: { deletedAt: null }, id: { not: listing.id }, OR: [{ size: listing.size }, { brand: listing.brand }] },
    include: { photos: { take: 1, orderBy: { sort: "asc" } }, seller: { select: { pro: true } } },
    take: 8,
  });
  const similar = candidates
    .sort((a, b) => (b.size === listing.size) - (a.size === listing.size) || b.featured - a.featured)
    .slice(0, 4);

  // Fair-price context: compare per-tire price to other same-size listings.
  const sizeComps = await prisma.listing.findMany({
    where: { status: "active", hidden: false, size: listing.size, id: { not: listing.id }, seller: { deletedAt: null } },
    select: { priceCents: true, quantity: true },
    take: 100,
  });
  const fairPrice = priceContext(
    perTire(listing.priceCents, listing.quantity),
    sizeComps.map((c) => perTire(c.priceCents, c.quantity))
  );

  const cond = conditionMeta(listing.condition);
  const isUsed = listing.condition !== "new";
  const age = tireAge(listing.dotYear);
  const lifePct = treadLifePct(listing.treadDepth);
  const sellerSince = new Date(listing.seller.createdAt).getFullYear();
  const initials = listing.seller.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  // Link the Size spec to its SEO landing page when it's a parseable metric size.
  const sz = parseTireSize(listing.size);
  const sizeHref = sz.width && sz.aspect && sz.rim ? `/sizes/${sizeSlug(`${sz.width}/${sz.aspect}R${sz.rim}`)}` : null;

  // Full spec list for the table.
  const specs = [
    ["Brand", listing.brand],
    ["Size", listing.size],
    ["Quantity", `${listing.quantity} tire${listing.quantity > 1 ? "s" : ""}`],
    ["Condition", cond.label],
    ["Tread depth", treadLabel(listing.treadDepth) || "—"],
    listing.season && ["Season", seasonLabel(listing.season)],
    (listing.loadIndex || listing.speedRating) && ["Load / Speed", `${listing.loadIndex || "—"}${listing.speedRating || ""}`],
    ["Run-flat", listing.runFlat ? "Yes" : "No"],
    ["Delivery", listing.shipping ? "Local pickup or shipping" : "Local pickup only"],
    listing.dotYear && ["DOT year", `${listing.dotYear}${age ? ` · ${age.label}` : ""}`],
    ["Total price", formatPrice(listing.priceCents)],
    listing.quantity > 1 && ["Price per tire", formatPrice(perTire(listing.priceCents, listing.quantity))],
  ].filter(Boolean);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${cond.label} ${listing.brand} ${listing.size} tires`,
    brand: { "@type": "Brand", name: listing.brand },
    category: "Tires",
    ...(listing.photos[0]?.url ? { image: listing.photos.map((p) => p.url) } : {}),
    ...(listing.description ? { description: listing.description } : {}),
    offers: {
      "@type": "Offer",
      price: (listing.priceCents / 100).toFixed(2),
      priceCurrency: "USD",
      availability: listing.status === "sold" ? "https://schema.org/SoldOut" : "https://schema.org/InStock",
      itemCondition: listing.condition === "new" ? "https://schema.org/NewCondition" : "https://schema.org/UsedCondition",
      areaServed: listing.location,
    },
  };

  return (
    <div className="space-y-5">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdHtml(jsonLd) }} />

      <nav className="flex items-center gap-1.5 text-sm text-slate-400" aria-label="Breadcrumb">
        <Link href="/browse" className="hover:text-brand-300">Marketplace</Link>
        <span aria-hidden="true">/</span>
        {listing.state && <><Link href={`/browse?state=${listing.state}`} className="hover:text-brand-300">{listing.location}</Link><span aria-hidden="true">/</span></>}
        <span className="truncate font-medium text-slate-200">{listing.brand} {listing.size}</span>
      </nav>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <PhotoGallery photos={listing.photos} alt={`${listing.brand} ${listing.size} tires`} />
        </div>

        <div className="space-y-4 lg:col-span-2">
          {/* Buy box */}
          <div className="card p-5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                {listing.featured && <Badge tone="featured">★ Featured</Badge>}
                {listing.seller.pro && <Badge tone="pro">PRO</Badge>}
                <Badge tone={cond.tone}>{cond.label}</Badge>
                {listing.status === "sold" && <Badge tone="sold">Sold</Badge>}
              </div>
              {!isOwner && <FavoriteButton listingId={listing.id} initial={favorited} />}
            </div>

            <h1 className="mt-3 font-display text-2xl font-extrabold text-white">{listing.brand}</h1>
            <p className="font-mono text-lg text-slate-400">{listing.size}</p>

            <p className="mt-3 font-display text-4xl font-extrabold text-white">
              {formatPrice(listing.priceCents)}
              <span className="ml-2 align-middle text-sm font-medium text-slate-400">for {listing.quantity}</span>
            </p>
            {listing.quantity > 1 && (
              <p className="text-sm text-slate-400">{formatPrice(perTire(listing.priceCents, listing.quantity))} per tire</p>
            )}

            {fairPrice && listing.status !== "sold" && (
              <div className={`mt-3 inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
                fairPrice.tone === "good" ? "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30"
                : fairPrice.tone === "high" ? "bg-amber-500/15 text-amber-300 ring-amber-400/30"
                : "bg-white/5 text-slate-300 ring-white/10"}`}>
                <svg viewBox="0 0 20 20" className="h-3.5 w-3.5 fill-current" aria-hidden="true"><path d="M3 3h2v12h12v2H3V3Zm12.7 2.3-3.2 3.2-2-2-3.5 3.5 1.4 1.4 2.1-2.1 2 2 4.6-4.6-1.4-1.4Z"/></svg>
                {fairPrice.tone === "good" ? "Good deal — " : ""}{fairPrice.label}
                <span className="font-normal text-slate-400">· avg {formatPrice(fairPrice.avg)}/tire ({fairPrice.count} listings)</span>
              </div>
            )}

            <dl className="mt-4 grid grid-cols-2 gap-2.5">
              <Spec label="Quantity" value={listing.quantity} />
              <Spec label="Tread" value={treadLabel(listing.treadDepth) || "—"} hint={lifePct != null ? `~${lifePct}% life` : null} />
              {listing.season && <Spec label="Season" value={seasonLabel(listing.season)} />}
              {listing.dotYear && <Spec label="DOT year" value={listing.dotYear} hint={age?.label} warn={age?.aging} />}
            </dl>

            <p className="mt-4 flex items-center gap-1.5 text-sm text-slate-300">
              <svg viewBox="0 0 16 16" className="h-4 w-4 fill-slate-400" aria-hidden="true"><path d="M8 1a5 5 0 0 0-5 5c0 3.5 5 9 5 9s5-5.5 5-9a5 5 0 0 0-5-5Zm0 7a2 2 0 1 1 0-4 2 2 0 0 1 0 4Z"/></svg>
              {listing.location} · {listing.shipping ? "Local pickup or shipping" : "Local pickup"}
            </p>
          </div>

          {/* Seller trust card */}
          <Link href={`/sellers/${listing.seller.id}`} className="card block p-4 transition hover:border-white/20">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 font-bold text-black">{initials}</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate font-semibold text-white">{listing.seller.name}</p>
                  {listing.seller.pro && <ProBadge />}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Stars value={avgRating} size="h-3 w-3" />
                  <span>{reviewCount ? `${avgRating.toFixed(1)} (${reviewCount} review${reviewCount > 1 ? "s" : ""})` : "No reviews yet"}</span>
                </div>
              </div>
              <svg viewBox="0 0 20 20" className="h-4 w-4 shrink-0 stroke-slate-500" fill="none" aria-hidden="true"><path d="M7 5l5 5-5 5" strokeWidth="1.5"/></svg>
            </div>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
              <span>📅 Member since {sellerSince}</span>
              {listing.seller.pro && <span>⚡ Usually responds within a day</span>}
              <span>📍 {listing.seller.location || listing.location}</span>
            </div>
          </Link>

          {isOwner ? (
            <div className="card p-5">
              <p className="mb-3 text-sm font-bold text-slate-200">Your listing</p>
              <div className="mb-4 grid grid-cols-2 gap-2.5">
                <Spec label="Views" value={listing.views} />
                <Spec label="Conversations" value={listing._count.threads} />
              </div>
              <div className="flex gap-2">
                <Link href={`/sell/${listing.id}/edit`} className="btn-secondary flex-1 justify-center">Edit listing</Link>
                <DeleteListingButton id={listing.id} />
              </div>
            </div>
          ) : (
            <MessageSeller listingId={listing.id} loggedIn={!!user} />
          )}

          <div className="flex items-center justify-between gap-2">
            <ShareListing brand={listing.brand} size={listing.size} />
            {!isOwner && <ReportListing listingId={listing.id} loggedIn={!!user} />}
          </div>
        </div>
      </div>

      {/* Details: specs + description + condition + safety */}
      <div className="grid gap-5 lg:grid-cols-5">
        <div className="space-y-5 lg:col-span-3">
          {listing.description && (
            <div className="card p-5">
              <h2 className="text-sm font-bold text-slate-200">Seller's description</h2>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-300">{listing.description}</p>
              {detectOffPlatform(listing.description).flagged && (
                <p className="mt-3 flex items-start gap-2 rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-100 ring-1 ring-inset ring-amber-400/20">
                  <svg viewBox="0 0 20 20" className="mt-0.5 h-4 w-4 shrink-0 fill-amber-300" aria-hidden="true"><path d="M10 1 1 18h18L10 1Zm0 6 .9 6h-1.8L10 7Zm0 8a1 1 0 1 1 0 2 1 1 0 0 1 0-2Z"/></svg>
                  <span><strong>Safety tip:</strong> {SAFETY_WARNING}</span>
                </p>
              )}
            </div>
          )}

          <div className="card overflow-hidden">
            <h2 className="border-b border-white/10 bg-white/[0.02] px-5 py-3 text-sm font-bold text-slate-200">Tire specifications</h2>
            <dl className="divide-y divide-white/5">
              {specs.map(([label, value]) => (
                <div key={label} className="flex items-center justify-between gap-4 px-5 py-2.5 text-sm">
                  <dt className="text-slate-400">{label}</dt>
                  <dd className="font-semibold text-slate-100">
                    {label === "Size" && sizeHref ? (
                      <Link href={sizeHref} className="text-brand-300 hover:underline">{value}</Link>
                    ) : (
                      value
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        <div className="space-y-5 lg:col-span-2">
          {/* Condition explainer */}
          <div className="card p-5">
            <div className="flex items-center gap-2">
              <Badge tone={cond.tone}>{cond.label}</Badge>
              <h2 className="text-sm font-bold text-slate-200">What this means</h2>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">{cond.blurb}</p>
            {lifePct != null && (
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Estimated tread life left</span>
                  <span className="font-semibold text-slate-200">~{lifePct}%</span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-white/10">
                  <div className={`h-full rounded-full ${lifePct >= 60 ? "bg-emerald-500" : lifePct >= 30 ? "bg-amber-500" : "bg-rose-500"}`} style={{ width: `${Math.max(4, lifePct)}%` }} />
                </div>
              </div>
            )}
          </div>

          {/* Safety / buyer protection */}
          <div className="rounded-2xl border border-amber-400/20 bg-amber-500/5 p-5">
            <h2 className="flex items-center gap-2 text-sm font-bold text-amber-200">
              <svg viewBox="0 0 20 20" className="h-4 w-4 fill-current" aria-hidden="true"><path d="M10 1 1 18h18L10 1Zm0 6 .9 6h-1.8L10 7Zm0 8a1 1 0 1 1 0 2 1 1 0 0 1 0-2Z"/></svg>
              Before you buy{isUsed ? " used tires" : ""}
            </h2>
            <ul className="mt-2 space-y-1.5 text-sm text-amber-100/80">
              <li>• Inspect in person for cracks, bulges, and uneven wear.</li>
              <li>• Confirm the DOT date — avoid tires over ~6 years old.</li>
              <li>• Meet in a public place and pay only once satisfied.</li>
            </ul>
            <Link href="/guide" className="mt-3 inline-block text-sm font-semibold text-amber-200 underline-offset-2 hover:underline">Read the full buying guide →</Link>
          </div>
        </div>
      </div>

      <TrackView id={listing.id} brand={listing.brand} size={listing.size} priceCents={listing.priceCents} photo={listing.photos[0]?.url} />

      {similar.length > 0 && (
        <div className="pt-2">
          <h2 className="mb-3 font-display text-lg font-bold text-white">More like this</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {similar.map((l) => <ListingCard key={l.id} listing={l} />)}
          </div>
        </div>
      )}
    </div>
  );
}

function Spec({ label, value, hint, warn }) {
  return (
    <div className="rounded-xl bg-white/[0.04] px-3 py-2 ring-1 ring-inset ring-white/10">
      <dt className="text-xs text-slate-400">{label}</dt>
      <dd className="font-semibold text-slate-100">
        {value}
        {hint && <span className={`ml-1 text-xs font-medium ${warn ? "text-amber-300" : "text-slate-400"}`}>· {hint}</span>}
      </dd>
    </div>
  );
}
