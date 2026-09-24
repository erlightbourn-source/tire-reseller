import Link from "next/link";

// Pre-charge auto-renewal disclosure (ROSCA 15 U.S.C. §8403; CA auto-renewal law
// as the design ceiling). Render directly above any button that starts a PAID
// Stripe Checkout. Same size as the surrounding copy on purpose, not fine print.
// Wording: Quinn draft 2026-09-24 (legal/tirekind-legal-copy-review…md §D).
export default function RenewalDisclosure({ plan }) {
  return (
    <p className="mb-3 text-sm text-slate-300">
      <strong className="font-semibold text-slate-100">Renews automatically at {plan.label} until you cancel.</strong>{" "}
      By subscribing you authorize TireKind to charge your card {plan.label} when billing starts and on that date each
      month. Cancel anytime from your Dashboard (&ldquo;Manage or cancel plan&rdquo;); cancellation takes effect at the
      end of your paid month. No refunds for partial months.
      {plan.locked ? " Your Founding price stays locked while your plan stays active." : ""}{" "}
      <Link href="/terms" className="font-semibold text-brand-300 hover:underline">Terms</Link>
    </p>
  );
}
