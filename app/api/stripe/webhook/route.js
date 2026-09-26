import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStripe, stripeConfigured } from "@/lib/stripe";
import { sendEmail } from "@/lib/email";
import { logAudit } from "@/lib/audit";
import { SITE_URL } from "@/lib/site";
import { renewalAckEmail } from "@/lib/renewalAck";

// Stripe requires the raw body to verify the signature.
export const dynamic = "force-dynamic";

// CA BPC 17602(a)(3) acknowledgment: ONE email per Checkout Session with the
// renewal terms + how to cancel. Stripe retries webhooks, so the AuditLog row
// (written before sending) is the idempotency key. Never throws: a mail
// failure must not fail the webhook and trigger a retry storm.
async function sendRenewalAck(session, sub) {
  try {
    const already = await prisma.auditLog.findFirst({
      where: { action: "renewal_ack", meta: { contains: session.id } },
      select: { id: true },
    });
    if (already) return;
    const user = await prisma.user.findFirst({ where: { stripeCustomerId: session.customer } });
    const to = session.customer_details?.email || user?.email;
    if (!to) return;
    const price = sub.items.data[0]?.price;
    await logAudit("renewal_ack", { userId: user?.id ?? null, meta: { sessionId: session.id } });
    const { subject, text } = renewalAckEmail({
      unitAmount: price?.unit_amount ?? 0,
      currency: price?.currency,
      interval: price?.recurring?.interval || "month",
      trialEnd: sub.status === "trialing" ? sub.trial_end : null,
      siteUrl: SITE_URL,
    });
    const delivered = await sendEmail({ to, subject, text });
    if (!delivered) console.error("[stripe] renewal acknowledgment NOT delivered for session", session.id);
  } catch (err) {
    console.error("[stripe] renewal acknowledgment failed:", err.message);
  }
}

async function activateForCustomer(customerId, { status, priceId, currentPeriodEnd }) {
  const user = await prisma.user.findFirst({ where: { stripeCustomerId: customerId } });
  if (!user) return;
  await prisma.user.update({
    where: { id: user.id },
    data: {
      subscriptionStatus: status,
      subscriptionPriceId: priceId ?? user.subscriptionPriceId,
      subscriptionCurrentEnd: currentPeriodEnd ? new Date(currentPeriodEnd * 1000) : user.subscriptionCurrentEnd,
      // ONE plan: an active subscription includes the perks, and they can't
      // outlive it — grant on activation, clear whenever billing lapses.
      pro: status === "active",
    },
  });
  // Mirror onto listings for DB-side ranked placement. A founding seller keeps
  // placement even when billing lapses.
  await prisma.listing.updateMany({
    where: { sellerId: user.id },
    data: { sellerPro: status === "active" || !!user.foundingSeller },
  });
}

export async function POST(req) {
  if (!stripeConfigured()) {
    return NextResponse.json({ error: "Stripe not configured." }, { status: 400 });
  }
  const stripe = getStripe();
  const sig = req.headers.get("stripe-signature");
  const whSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const raw = await req.text();

  let event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig, whSecret);
  } catch (err) {
    // Don't reflect the specific verification failure — it's a forgery/replay
    // oracle. Log server-side, return a generic message.
    console.error("[stripe] webhook signature verification failed:", err.message);
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      if (session.mode === "subscription" && session.customer) {
        const sub = await stripe.subscriptions.retrieve(session.subscription);
        await activateForCustomer(session.customer, {
          status: sub.status === "active" || sub.status === "trialing" ? "active" : sub.status,
          priceId: sub.items.data[0]?.price?.id,
          currentPeriodEnd: sub.current_period_end,
        });
        await sendRenewalAck(session, sub);
      }
      break;
    }
    case "customer.subscription.updated":
    case "customer.subscription.created": {
      const sub = event.data.object;
      await activateForCustomer(sub.customer, {
        status: sub.status === "active" || sub.status === "trialing" ? "active" : sub.status,
        priceId: sub.items.data[0]?.price?.id,
        currentPeriodEnd: sub.current_period_end,
      });
      break;
    }
    case "customer.subscription.deleted": {
      const sub = event.data.object;
      await activateForCustomer(sub.customer, { status: "canceled", currentPeriodEnd: sub.current_period_end });
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
