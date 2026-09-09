import Link from "next/link";
import { TERMS, LAST_UPDATED } from "@/lib/legal";

// Rendered conspicuously (bold + uppercase + set off) so the warranty and
// liability disclaimers meet UCC §2-316 conspicuousness — a disclaimer buried
// in ordinary body text is the textbook fact pattern for being held ineffective.
const CONSPICUOUS = new Set([
  "No warranties",
  "Used tires — assumption of risk",
  "Limitation of liability",
  "Arbitration & class-action waiver",
]);

export const metadata = {
  title: "Terms of Service — TireTrader",
  description: "The terms that govern using the TireTrader marketplace.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <p className="eyebrow">Legal</p>
        <h1 className="mt-1 font-display text-3xl font-extrabold text-white">Terms of Service</h1>
        <p className="mt-1 text-sm text-slate-400">Last updated {LAST_UPDATED}</p>
      </div>
      <div className="space-y-5">
        {TERMS.map(([h, body], i) => {
          const conspicuous = CONSPICUOUS.has(h);
          return (
            <section key={h} className={conspicuous ? "border-l-2 border-brand-500 bg-white/[0.03] px-4 py-3" : ""}>
              <h2 className="font-display text-lg font-bold text-white">{i + 1}. {h}</h2>
              <p className={`mt-1 text-sm leading-relaxed ${conspicuous ? "font-bold uppercase tracking-wide text-white" : "text-slate-300"}`}>{body}</p>
            </section>
          );
        })}
      </div>
      <p className="text-sm text-slate-400">
        See also our <Link href="/privacy" className="font-semibold text-brand-300 hover:underline">Privacy Policy</Link>.
      </p>
    </div>
  );
}
