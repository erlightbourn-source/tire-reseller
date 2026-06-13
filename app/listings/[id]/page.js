import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { formatPrice, timeAgo } from "@/lib/format";
import MessageSeller from "@/components/MessageSeller";
import DeleteListingButton from "@/components/DeleteListingButton";
import PhotoGallery from "@/components/PhotoGallery";

export const dynamic = "force-dynamic";

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
  }

  const isNew = listing.condition === "new";

  return (
    <div className="space-y-4">
      <nav className="flex items-center gap-1.5 text-sm text-slate-500">
        <Link href="/" className="hover:text-brand-600">Marketplace</Link>
        <span>/</span>
        <span className="truncate font-medium text-slate-700">{listing.brand} {listing.size}</span>
      </nav>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <PhotoGallery photos={listing.photos} alt={`${listing.brand} ${listing.size}`} />
        </div>

        <div className="space-y-4 lg:col-span-2">
          <div className="card p-5">
            <div className="flex items-center gap-2">
              <span className={isNew ? "badge-new" : "badge-used"}>{isNew ? "New" : "Used"}</span>
              {listing.status === "sold" && <span className="badge bg-ink-900 text-white">Sold</span>}
            </div>
            <h1 className="mt-3 font-display text-2xl font-extrabold text-slate-900">{listing.brand}</h1>
            <p className="font-mono text-lg text-slate-500">{listing.size}</p>
            <p className="mt-3 font-display text-4xl font-extrabold text-slate-900">
              {formatPrice(listing.priceCents)}
              <span className="ml-2 align-middle text-sm font-medium text-slate-400">for {listing.quantity}</span>
            </p>

            <dl className="mt-4 grid grid-cols-2 gap-2.5">
              <Spec label="Quantity" value={listing.quantity} />
              <Spec label="Condition" value={isNew ? "New" : "Used"} />
              <Spec label="Tread depth" value={listing.treadDepth || "—"} />
              <Spec label="Per tire" value={formatPrice(Math.round(listing.priceCents / listing.quantity))} />
            </dl>

            <p className="mt-4 flex items-center gap-1.5 text-sm text-slate-500">
              <svg viewBox="0 0 16 16" className="h-4 w-4 fill-slate-400"><path d="M8 1a5 5 0 0 0-5 5c0 3.5 5 9 5 9s5-5.5 5-9a5 5 0 0 0-5-5Zm0 7a2 2 0 1 1 0-4 2 2 0 0 1 0 4Z"/></svg>
              {listing.location}
            </p>
          </div>

          {listing.description && (
            <div className="card p-5">
              <h2 className="text-sm font-bold text-slate-700">Description</h2>
              <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-slate-600">{listing.description}</p>
            </div>
          )}

          <div className="card flex items-center gap-3 p-4">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 font-bold text-white">
              {listing.seller.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-slate-900">{listing.seller.name}</p>
              <p className="text-xs text-slate-400">
                {listing.seller.location ? `${listing.seller.location} · ` : ""}
                Member since {new Date(listing.seller.createdAt).getFullYear()} · Listed {timeAgo(listing.createdAt)}
              </p>
            </div>
          </div>

          {isOwner ? (
            <div className="card p-5">
              <p className="mb-3 text-sm font-bold text-slate-700">Your listing</p>
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
    </div>
  );
}

function Spec({ label, value }) {
  return (
    <div className="rounded-xl bg-slate-50 px-3 py-2 ring-1 ring-inset ring-slate-100">
      <dt className="text-xs text-slate-400">{label}</dt>
      <dd className="font-semibold text-slate-800">{value}</dd>
    </div>
  );
}
