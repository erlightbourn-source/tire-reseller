import Link from "next/link";
import { formatPrice } from "@/lib/format";
import FavoriteButton from "@/components/FavoriteButton";

const SEASON_LABEL = {
  summer: "Summer",
  winter: "Winter",
  "all-season": "All-season",
  "all-weather": "All-weather",
};

export default function ListingCard({ listing, favorited = false }) {
  const photo = listing.photos?.[0]?.url;
  const sold = listing.status === "sold";
  const isNew = listing.condition === "new";

  return (
    <div className="card card-hover group relative block overflow-hidden">
      <FavoriteButton listingId={listing.id} initial={favorited} className="absolute right-2.5 top-2.5 z-10" />
      <Link href={`/listings/${listing.id}`} className="block">
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-ink-900">
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photo}
              alt={`${listing.brand} ${listing.size}`}
              className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.06]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-800 to-ink-900 text-slate-600">
              <span className="text-4xl">◎</span>
            </div>
          )}

          <div className="absolute inset-x-0 top-0 flex flex-wrap items-start gap-1.5 p-2.5">
            {listing.featured && (
              <span className="badge bg-accent-500 text-ink-950">★ Featured</span>
            )}
            {listing.seller?.pro && (
              <span className="badge bg-gradient-to-r from-amber-400 to-accent-500 text-ink-950">PRO</span>
            )}
            <span className={isNew ? "badge-new" : "badge-used"}>{isNew ? "New" : "Used"}</span>
            {sold && <span className="badge bg-ink-900/90 text-white">Sold</span>}
          </div>

          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/55 to-transparent p-2.5">
            <span className="font-mono text-sm font-semibold text-white drop-shadow">{listing.size}</span>
          </div>
        </div>

        <div className="p-3.5">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-display font-bold leading-tight text-white">{listing.brand}</h3>
            <span className="whitespace-nowrap font-display text-lg font-extrabold text-white">
              {formatPrice(listing.priceCents)}
            </span>
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-400">
            <span className="inline-flex items-center gap-1">
              <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 fill-slate-500"><path d="M2 4h12v2H2zm0 3h12v2H2zm0 3h12v2H2z"/></svg>
              Qty {listing.quantity}
            </span>
            {listing.treadDepth && <span className="text-slate-600">·</span>}
            {listing.treadDepth && <span>{listing.treadDepth} tread</span>}
          </div>
          {(listing.season || listing.runFlat) && (
            <div className="mt-2 flex flex-wrap gap-1">
              {listing.season && (
                <span className="rounded-md bg-white/5 px-1.5 py-0.5 text-[10px] font-medium text-slate-300 ring-1 ring-inset ring-white/10">
                  {SEASON_LABEL[listing.season] || listing.season}
                </span>
              )}
              {listing.runFlat && (
                <span className="rounded-md bg-brand-500/15 px-1.5 py-0.5 text-[10px] font-medium text-brand-200 ring-1 ring-inset ring-brand-400/30">
                  Run-flat
                </span>
              )}
            </div>
          )}
          <p className="mt-2 flex items-center gap-1 truncate text-xs text-slate-500">
            <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 shrink-0 fill-slate-400"><path d="M8 1a5 5 0 0 0-5 5c0 3.5 5 9 5 9s5-5.5 5-9a5 5 0 0 0-5-5Zm0 7a2 2 0 1 1 0-4 2 2 0 0 1 0 4Z"/></svg>
            {listing.location}
          </p>
        </div>
      </Link>
    </div>
  );
}
