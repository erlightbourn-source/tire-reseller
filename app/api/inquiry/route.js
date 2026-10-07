import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { enforceRateLimit } from "@/lib/security";
import { sendEmail } from "@/lib/email";
import { SITE_URL } from "@/lib/site";
import { SAFETY_WARNING } from "@/lib/safety";
import { guestInquiryEnabled, parseGuestInquiry, buildInquiryEmail } from "@/lib/guestInquiry";

// Guest question to a seller, relayed by email (no account needed). Dark by default: 404 unless
// GUEST_INQUIRY=on. Stores nothing; the seller's address is never returned to the caller.
export async function POST(req) {
  if (!guestInquiryEnabled()) return NextResponse.json({ error: "Not found." }, { status: 404 });

  // Per-IP throttle first, so junk never reaches the DB or the mail provider.
  const limited = await enforceRateLimit(req, "inquiry-ip", { limit: 5, windowMs: 60 * 60_000 });
  if (limited) return limited;

  let raw;
  try { raw = await req.json(); } catch { return NextResponse.json({ error: "Bad request." }, { status: 400 }); }
  const parsed = parseGuestInquiry(raw);
  if (!parsed.ok) {
    return NextResponse.json(parsed.silent ? { ok: true } : { error: parsed.error }, { status: parsed.status });
  }
  const { listingId, email, question } = parsed.data;

  // Per-address caps: 3/day overall, 1 per listing per hour (no re-sending the same ask).
  const dayLimited = await enforceRateLimit(req, "inquiry-email", { key: email, limit: 3, windowMs: 24 * 60 * 60_000 });
  if (dayLimited) return dayLimited;
  const dupLimited = await enforceRateLimit(req, "inquiry-pair", { key: `${email}:${listingId}`, limit: 1, windowMs: 60 * 60_000 });
  if (dupLimited) return dupLimited;

  const listing = await prisma.listing.findFirst({
    where: { id: listingId, status: "active", hidden: false, seller: { deletedAt: null } },
    select: { id: true, brand: true, size: true, seller: { select: { email: true } } },
  });
  if (!listing || !listing.seller?.email) return NextResponse.json({ error: "Listing not found." }, { status: 404 });

  const mail = buildInquiryEmail({
    listingTitle: `${listing.brand} ${listing.size}`,
    buyerEmail: email,
    question,
    listingUrl: `${SITE_URL}/listings/${listing.id}`,
    safetyNote: SAFETY_WARNING,
  });
  const sent = await sendEmail({ to: listing.seller.email, ...mail });
  if (!sent) return NextResponse.json({ error: "We couldn't send that right now. Please try again shortly." }, { status: 502 });
  return NextResponse.json({ ok: true });
}
