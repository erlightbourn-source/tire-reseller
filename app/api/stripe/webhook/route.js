import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStripe, stripeConfigured } from "@/lib/stripe";

// Stripe requires the raw body to verify the signature.
export const dynamic = "force-dynamic";

async function activateForCustomer(customerId, { status, priceId, currentPeriodEnd }) {
  const user = await prisma.user.findFirst({ where: { stripeCustomerId: customerId } });
  if (!user) return;
  await prisma.user.update({
    where: { id: user.id },
    data: {
      subscriptionStatus: status,
      subscriptionPriceId: priceId ?? user.subscriptionPriceId,
      subscriptionCurrentEnd: currentPeriodEnd ? new Date(currentPeriodEnd * 1000) : user.subscriptionCurrentEnd,
      // Pro can't outlive the subscription: clear it whenever billing lapses.
      ...(status === "active" ? {} : { pro: false }),
    },
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
