import Link from "next/link";
import { TERMS, LAST_UPDATED } from "@/lib/legal";

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
        {TERMS.map(([h, body], i) => (
          <section key={h}>
            <h2 className="font-display text-lg font-bold text-white">{i + 1}. {h}</h2>
            <p className="mt-1 text-sm leading-relaxed text-slate-300">{body}</p>
          </section>
        ))}
      </div>
      <p className="text-sm text-slate-400">
        See also our <Link href="/privacy" className="font-semibold text-brand-300 hover:underline">Privacy Policy</Link>.
      </p>
    </div>
  );
}
