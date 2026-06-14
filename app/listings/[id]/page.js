import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { formatPrice, timeAgo } from "@/lib/format";
import MessageSeller from "@/components/MessageSeller";
import DeleteListingButton from "@/components/DeleteListingButton";
import PhotoGallery from "@/components/PhotoGallery";
import FavoriteButton from "@/components/FavoriteButton";
import Stars from "@/components/Stars";
import ListingCard from "@/components/ListingCard";

export const dynamic = "force-dynamic";

const SEASON_LABEL = { summer: "Summer", winter: "Winter", "all-season": "All-season", "all-weather": "All-weather" };

export default async function ListingDetail({ params }) {
  const user = await getCurrentUser();
  const listing = await prisma.listing.findUnique({
    where: { id: params.id },
    include: {
      photos: { orderBy: { sort: "asc" } },
      seller: { select: { id: true, name: true, location: true, createdAt: true } },
      _count: { select: { threads: true } },
    },
  });
  if (!listing) notFound();

  const isOwner = user?.id === listing.sellerId;
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

  // "More like this" — same size first, then same brand
  const candidates = await prisma.listing.findMany({
    where: {
      status: "active",
      id: { not: listing.id },
      OR: [{ size: listing.size }, { brand: listing.brand }],
    },
    include: { photos: { take: 1, orderBy: { sort: "asc" } } },
    take: 8,
  });
  const similar = candidates
    .sort((a, b) => (b.size === listing.size) - (a.size === listing.size) || b.featured - a.featured)
    .slice(0, 4);

  const isNew = listing.condition === "new";
  const ageYears = listing.dotYear ? new Date().getFullYear() - listing.dotYear : null;

  return (
    <div className="space-y-4">
      <nav className="flex items-center gap-1.5 text-sm text-slate-400">
        <Link href="/browse" className="hover:text-brand-300">Marketplace</Link>
        <span>/</span>
        <span className="truncate font-medium text-slate-200">{listing.brand} {listing.size}</span>
      </nav>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <PhotoGallery photos={listing.photos} alt={`${listing.brand} ${listing.size}`} />
        </div>

        <div className="space-y-4 lg:col-span-2">
          <div className="card p-5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {listing.featured && <span className="badge bg-accent-500 text-ink-950">★ Featured</span>}
                <span className={isNew ? "badge-new" : "badge-used"}>{isNew ? "New" : "Used"}</span>
                {listing.status === "sold" && <span className="badge bg-ink-900 text-white">Sold</span>}
              </div>
              {!isOwner && <FavoriteButton listingId={listing.id} initial={favorited} />}
            </div>
            <h1 className="mt-3 font-display text-2xl font-extrabold text-white">{listing.brand}</h1>
            <p className="font-mono text-lg text-slate-400">{listing.size}</p>
            <p className="mt-3 font-display text-4xl font-extrabold text-white">
              {formatPrice(listing.priceCents)}
              <span className="ml-2 align-middle text-sm font-medium text-slate-500">for {listing.quantity}</span>
            </p>

            <dl className="mt-4 grid grid-cols-2 gap-2.5">
              <Spec label="Quantity" value={listing.quantity} />
              <Spec label="Condition" value={isNew ? "New" : "Used"} />
              <Spec label="Tread depth" value={listing.treadDepth || "—"} />
              <Spec label="Per tire" value={formatPrice(Math.round(listing.priceCents / listing.quantity))} />
              {listing.season && <Spec label="Season" value={SEASON_LABEL[listing.season] || listing.season} />}
              {(listing.loadIndex || listing.speedRating) && (
                <Spec label="Load / Speed" value={`${listing.loadIndex || "—"}${listing.speedRating || ""}`} />
              )}
              {listing.runFlat && <Spec label="Run-flat" value="Yes" />}
              {listing.dotYear && <Spec label="Mfg. year" value={`${listing.dotYear}${ageYears != null ? ` · ${ageYears}y old` : ""}`} />}
            </dl>

            <p className="mt-4 flex items-center gap-1.5 text-sm text-slate-400">
              <svg viewBox="0 0 16 16" className="h-4 w-4 fill-slate-500"><path d="M8 1a5 5 0 0 0-5 5c0 3.5 5 9 5 9s5-5.5 5-9a5 5 0 0 0-5-5Zm0 7a2 2 0 1 1 0-4 2 2 0 0 1 0 4Z"/></svg>
              {listing.location}
            </p>
          </div>

          {listing.description && (
            <div className="card p-5">
              <h2 className="text-sm font-bold text-slate-200">Description</h2>
              <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-slate-400">{listing.description}</p>
            </div>
          )}

          <Link href={`/sellers/${listing.seller.id}`} className="card flex items-center gap-3 p-4 transition hover:border-white/20">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 font-bold text-white">
              {listing.seller.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-white">{listing.seller.name}</p>
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Stars value={avgRating} size="h-3 w-3" />
                <span>{reviewCount ? `${avgRating.toFixed(1)} (${reviewCount})` : "No reviews yet"}</span>
              </div>
              <p className="text-xs text-slate-500">
                {listing.seller.location ? `${listing.seller.location} · ` : ""}Listed {timeAgo(listing.createdAt)}
              </p>
            </div>
            <svg viewBox="0 0 20 20" className="h-4 w-4 shrink-0 fill-slate-500"><path d="M7 5l5 5-5 5" stroke="currentColor" strokeWidth="1.5" fill="none"/></svg>
          </Link>

          {isOwner ? (
            <div className="card p-5">
              <p className="mb-3 text-sm font-bold text-slate-200">Your listing</p>
              <div className="mb-4 grid grid-cols-2 gap-2.5">
                <Spec label="Views" value={listing.views} />
                <Spec label="Conversations" value={listing._count.threads} />
              </div>
              <div className="flex gap-2">
                <Link href={`/sell/${listing.id}/edit`} className="btn-secondary flex-1">Edit listing</Link>
                <DeleteListingButton id={listing.id} />
              </div>
            </div>
          ) : (
            <MessageSeller listingId={listing.id} loggedIn={!!user} />
          )}
        </div>
      </div>

      {similar.length > 0 && (
        <div className="pt-2">
          <h2 className="mb-3 font-display text-lg font-bold text-white">More like this</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {similar.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Spec({ label, value }) {
  return (
    <div className="rounded-xl bg-white/[0.04] px-3 py-2 ring-1 ring-inset ring-white/10">
      <dt className="text-xs text-slate-400">{label}</dt>
      <dd className="font-semibold text-slate-100">{value}</dd>
    </div>
  );
}
