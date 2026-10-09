import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getStripe, stripeConfigured } from "@/lib/stripe";
import { priceFor, resolvePriceId } from "@/lib/pricing";
import { checkoutActivation } from "@/lib/checkoutSession";

export const dynamic = "force-dynamic";

// After Stripe Checkout redirects back, verify the session server-side and
// activate the subscription. This makes the gate work even if the local
// webhook listener (stripe CLI) isn't running. It only ever ACTIVATES, and only
// for a live subscription that belongs to this user (lib/checkoutSession.js) —
// a replayed old session_id must not undo a cancellation. Downgrades are the
// webhook's job.
export default async function SuccessPage({ searchParams }) {
  const { session_id } = await searchParams;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  let active = user.subscriptionStatus === "active";
  if (stripeConfigured() && typeof session_id === "string" && session_id.length <= 200) {
    try {
      const stripe = getStripe();
      const session = await stripe.checkout.sessions.retrieve(session_id, {
        expand: ["subscription"],
      });
      if (checkoutActivation(session, user).activate) {
        const sub = session.subscription;
        await prisma.user.update({
          where: { id: user.id },
          data: {
            subscriptionStatus: "active",
            stripeCustomerId: session.customer || user.stripeCustomerId,
            subscriptionPriceId: sub?.items?.data?.[0]?.price?.id || resolvePriceId(priceFor(user).tier),
            subscriptionCurrentEnd: sub?.current_period_end
              ? new Date(sub.current_period_end * 1000)
              : null,
            // ONE plan: paying includes the perks (mirrors the webhook).
            pro: true,
          },
        });
        await prisma.listing.updateMany({ where: { sellerId: user.id }, data: { sellerPro: true } });
        active = true;
      }
    } catch {
      // fall through — webhook will reconcile
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="card p-8 text-center">
        <p className="text-5xl">🎉</p>
        <h1 className="mt-3 font-display text-xl font-bold text-white">You're a TireKind seller!</h1>
        <p className="mt-2 text-slate-400">
          {active
            ? "Your subscription is active. Time to list some tires."
            : "We're confirming your payment with Stripe. This usually takes a few seconds; refresh in a moment."}
        </p>
        <div className="mt-5 flex justify-center gap-2">
          <Link href="/sell" className="btn-primary">List your first set</Link>
          <Link href="/dashboard" className="btn-secondary">Go to dashboard</Link>
        </div>
      </div>
    </div>
  );
}
