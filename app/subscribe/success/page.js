import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getStripe, stripeConfigured } from "@/lib/stripe";

export const dynamic = "force-dynamic";

// After Stripe Checkout redirects back, verify the session server-side and
// activate the subscription. This makes the gate work even if the local
// webhook listener (stripe CLI) isn't running.
export default async function SuccessPage({ searchParams }) {
  const { session_id } = await searchParams;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  if (stripeConfigured() && session_id) {
    try {
      const stripe = getStripe();
      const session = await stripe.checkout.sessions.retrieve(session_id, {
        expand: ["subscription"],
      });
      if (
        session.client_reference_id === user.id &&
        (session.payment_status === "paid" || session.status === "complete")
      ) {
        const sub = session.subscription;
        await prisma.user.update({
          where: { id: user.id },
          data: {
            subscriptionStatus: "active",
            stripeCustomerId: session.customer || user.stripeCustomerId,
            subscriptionPriceId: sub?.items?.data?.[0]?.price?.id || process.env.STRIPE_PRICE_ID,
            subscriptionCurrentEnd: sub?.current_period_end
              ? new Date(sub.current_period_end * 1000)
              : null,
          },
        });
      }
    } catch {
      // fall through — webhook will reconcile
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="card p-8 text-center">
        <p className="text-5xl">🎉</p>
        <h1 className="mt-3 font-display text-xl font-bold text-white">You're a TireTrader seller!</h1>
        <p className="mt-2 text-slate-400">Your subscription is active. Time to list some tires.</p>
        <div className="mt-5 flex justify-center gap-2">
          <Link href="/sell" className="btn-primary">List your first set</Link>
          <Link href="/dashboard" className="btn-secondary">Go to dashboard</Link>
        </div>
      </div>
    </div>
  );
}
