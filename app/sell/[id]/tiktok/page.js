import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { formatPrice } from "@/lib/format";
import { isOwnedMediaUrl, photoExt, tiktokShareEnabledFor } from "@/lib/tiktok";
import TikTokShare from "@/components/TikTokShare";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Share your listing to TikTok — TireKind",
  robots: { index: false, follow: false },
};

export default async function ShareToTikTokPage({ params, searchParams }) {
  const { id } = await params;
  const sp = await searchParams;
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/sell/${encodeURIComponent(id)}/tiktok`);
  if (!tiktokShareEnabledFor(user)) notFound();

  const listing = await prisma.listing.findUnique({
    where: { id },
    select: {
      id: true, sellerId: true, brand: true, size: true, quantity: true, condition: true,
      treadDepth: true, priceCents: true, location: true, status: true, hidden: true,
      photos: { orderBy: { sort: "asc" }, select: { id: true, url: true } },
    },
  });
  if (!listing) notFound();
  if (listing.sellerId !== user.id) redirect("/dashboard");

  const photos = listing.photos.map((p) => ({
    id: p.id,
    url: p.url,
    eligible: isOwnedMediaUrl(p.url) && !!photoExt(p.url),
  }));
  const qty = listing.quantity > 1 ? `Set of ${listing.quantity}` : "Single";
  const summary = `${listing.brand} ${listing.size} · ${qty} · ${listing.condition === "new" ? "New" : "Used"} · ${formatPrice(listing.priceCents)} · ${listing.location}`;

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/dashboard" className="text-sm text-slate-400 hover:underline">← Back to dashboard</Link>
      <h1 className="mt-2 font-display text-2xl font-bold text-white">Share your listing to TikTok</h1>
      <p className="mt-1 text-sm text-slate-400">
        Post this listing&apos;s photos to your own TikTok account. You choose the photos, caption and who can see it,
        and nothing is sent to TikTok until you press Post.
      </p>
      <div className="card mt-4 p-4 text-sm text-slate-300">{summary}</div>
      {listing.status !== "active" || listing.hidden ? (
        <div className="card mt-4 p-6 text-slate-300">Only active listings can be shared.</div>
      ) : (
        <TikTokShare
          listingId={listing.id}
          photos={photos}
          suggestion={{
            title: `${listing.brand} ${listing.size} tires for sale`.slice(0, 90),
            description: summary,
          }}
          notice={typeof sp?.tiktok === "string" ? sp.tiktok : null}
        />
      )}
    </div>
  );
}
