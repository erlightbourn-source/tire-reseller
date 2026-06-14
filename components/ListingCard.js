import Link from "next/link";
import { formatPrice } from "@/lib/format";
import { seasonLabel, treadLabel, perTire, milesLabel, conditionMeta, tireAge } from "@/lib/tire";
import FavoriteButton from "@/components/FavoriteButton";
import Badge from "@/components/Badge";

export default function ListingCard({ listing, favorited = false, distance = null, rating = null, fair = null }) {
  const dealTone = fair && fair.tone !== "fair" ? fair.tone : null;
  const photo = listing.photos?.[0]?.url;
  const sold = listing.status === "sold";
  const cond = conditionMeta(listing.condition);
  const tread = treadLabel(listing.treadDepth);
  const age = tireAge(listing.dotYear);
  const dist = milesLabel(distance);

  return (
    <div className="card card-hover group relative flex flex-col overflow-hidden">
      <FavoriteButton listingId={listing.id} initial={favorited} className="absolute right-2.5 top-2.5 z-10" />
      <Link href={`/listings/${listing.id}`} className="flex flex-1 flex-col" aria-label={`${listing.brand} ${listing.size} — ${formatPrice(listing.priceCents)}`}>
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-ink-900">
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photo}
              alt={`${listing.brand} ${listing.size} tires`}
              loading="lazy"
              className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.06]"
            />
          ) : (
            <Placeholder />
          )}

          <div className="absolute inset-x-0 top-0 flex flex-wrap items-start gap-1.5 p-2.5">
            {listing.featured && <Badge tone="featured">★ Featured</Badge>}
            {listing.seller?.pro && <Badge tone="pro">PRO</Badge>}
            <Badge tone={cond.tone}>{cond.label}</Badge>
            {sold && <Badge tone="sold">Sold</Badge>}
          </div>

          <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 bg-gradient-to-t from-black/70 to-transparent p-2.5">
            <span className="font-mono text-sm font-semibold text-white drop-shadow">{listing.size}</span>
            {dist && <span className="rounded-md bg-black/40 px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur">{dist}</span>}
          </div>
        </div>

        <div className="flex flex-1 flex-col p-3.5">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-display font-bold leading-tight text-white">{listing.brand}</h3>
            <div className="text-right">
              <span className="block whitespace-nowrap font-display text-lg font-extrabold text-white">
                {formatPrice(listing.priceCents)}
              </span>
              {listing.quantity > 1 && (
                <span className="block text-[11px] text-slate-400">{formatPrice(perTire(listing.priceCents, listing.quantity))}/tire</span>
              )}
            </div>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-300">
            <Spec icon="qty">Qty {listing.quantity}</Spec>
            {tread && <><Dot /><Spec icon="tread">{tread}</Spec></>}
            {age && <><Dot /><Spec icon="cal">DOT {listing.dotYear}{age.aging ? " ⚠" : ""}</Spec></>}
          </div>

          {(listing.season || listing.runFlat || listing.shipping) && (
            <div className="mt-2 flex flex-wrap gap-1">
              {listing.season && (
                <span className="rounded-md bg-white/5 px-1.5 py-0.5 text-[10px] font-medium text-slate-200 ring-1 ring-inset ring-white/10">
                  {seasonLabel(listing.season)}
                </span>
              )}
              {listing.runFlat && (
                <span className="rounded-md bg-brand-500/15 px-1.5 py-0.5 text-[10px] font-medium text-brand-200 ring-1 ring-inset ring-brand-400/30">
                  Run-flat
                </span>
              )}
              {listing.shipping && (
                <span className="rounded-md bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-medium text-emerald-200 ring-1 ring-inset ring-emerald-400/30">
                  Ships
                </span>
              )}
            </div>
          )}

          {dealTone && (
            <p className={`mt-2 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${dealTone === "good" ? "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30" : "bg-amber-500/15 text-amber-300 ring-amber-400/30"}`}>
              {dealTone === "good" ? `▼ ${Math.abs(fair.deltaPct)}% below avg` : `▲ ${fair.deltaPct}% above avg`}
            </p>
          )}

          {rating?.count > 0 && (
            <p className="mt-2 flex items-center gap-1 text-[11px] text-slate-400">
              <svg viewBox="0 0 20 20" className="h-3 w-3 fill-accent-400" aria-hidden="true"><path d="M10 1.6l2.47 5.01 5.53.8-4 3.9.94 5.5L10 14.2l-4.94 2.6.94-5.5-4-3.9 5.53-.8L10 1.6Z"/></svg>
              <span className="font-semibold text-slate-300">{rating.avg.toFixed(1)}</span>
              <span>seller rating ({rating.count})</span>
            </p>
          )}

          <div className="mt-auto flex items-center justify-between gap-2 pt-3">
            <p className="flex min-w-0 items-center gap-1 text-xs text-slate-400">
              <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 shrink-0 fill-slate-400" aria-hidden="true"><path d="M8 1a5 5 0 0 0-5 5c0 3.5 5 9 5 9s5-5.5 5-9a5 5 0 0 0-5-5Zm0 7a2 2 0 1 1 0-4 2 2 0 0 1 0 4Z"/></svg>
              <span className="truncate">{listing.location}</span>
            </p>
            <span className="shrink-0 text-xs font-semibold text-brand-300 transition group-hover:text-brand-200">View →</span>
          </div>
        </div>
      </Link>
    </div>
  );
}

function Placeholder() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-800 to-ink-900">
      <svg viewBox="0 0 64 64" className="h-16 w-16 text-slate-700" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
        <circle cx="32" cy="32" r="26" />
        <circle cx="32" cy="32" r="11" />
        <circle cx="32" cy="32" r="2.5" fill="currentColor" stroke="none" />
        {Array.from({ length: 12 }).map((_, i) => {
          const a = (i * Math.PI) / 6;
          return <line key={i} x1={32 + 19 * Math.cos(a)} y1={32 + 19 * Math.sin(a)} x2={32 + 25 * Math.cos(a)} y2={32 + 25 * Math.sin(a)} strokeWidth="2" />;
        })}
      </svg>
    </div>
  );
}

const SPEC_ICONS = {
  qty: '<path d="M2 4h12v2H2zm0 3h12v2H2zm0 3h12v2H2z"/>',
  tread: '<path d="M3 2h2v12H3zm4 0h2v12H7zm4 0h2v12h-2z"/>',
  cal: '<path d="M4 2v2H3a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1h-1V2h-1.5v2h-5V2H4Zm-.5 5h9v6h-9V7Z"/>',
};

function Spec({ icon, children }) {
  return (
    <span className="inline-flex items-center gap-1">
      <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 fill-slate-500" aria-hidden="true" dangerouslySetInnerHTML={{ __html: SPEC_ICONS[icon] }} />
      {children}
    </span>
  );
}

function Dot() {
  return <span className="text-slate-600">·</span>;
}
