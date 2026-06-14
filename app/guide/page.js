import Link from "next/link";
import Faq from "@/components/Faq";
import Badge from "@/components/Badge";
import { BUYER_FAQ, BUYER_CHECKLIST } from "@/lib/content";
import { CONDITIONS } from "@/lib/tire";

export const metadata = {
  title: "How to buy used tires safely — TireTrader buying guide",
  description:
    "What to check before buying used tires: tread depth in 32nds, DOT manufacture date, even wear, and damage. Plus a tire condition glossary and FAQ.",
  alternates: { canonical: "/guide" },
  openGraph: { title: "Used tire buying guide — TireTrader", type: "article" },
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: BUYER_FAQ.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

export default function GuidePage() {
  return (
    <div className="mx-auto max-w-3xl space-y-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      <header>
        <nav className="flex items-center gap-1.5 text-sm text-slate-400" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-brand-300">Home</Link>
          <span aria-hidden="true">/</span>
          <span className="font-medium text-slate-200">Buying guide</span>
        </nav>
        <p className="eyebrow mt-3">Buyer guide</p>
        <h1 className="mt-1 font-display text-3xl font-extrabold text-white sm:text-4xl">What to check before buying used tires</h1>
        <p className="mt-3 text-lg text-slate-300">
          Used tires can be a great deal — if you know what to look for. Here's how to vet a set in five minutes
          so you drive away confident.
        </p>
      </header>

      {/* Checklist */}
      <section>
        <h2 className="font-display text-2xl font-extrabold text-white">The 6-point inspection</h2>
        <ol className="mt-4 space-y-3">
          {BUYER_CHECKLIST.map(([title, body], i) => (
            <li key={title} className="card flex gap-4 p-4">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-600 font-display font-bold text-white">{i + 1}</span>
              <div>
                <p className="font-display font-bold text-white">{title}</p>
                <p className="mt-0.5 text-sm leading-relaxed text-slate-400">{body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Condition glossary */}
      <section>
        <h2 className="font-display text-2xl font-extrabold text-white">Tire condition glossary</h2>
        <p className="mt-1 text-sm text-slate-400">What each condition label on a listing actually means.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {Object.entries(CONDITIONS).map(([key, c]) => (
            <div key={key} className="card p-4">
              <Badge tone={c.tone}>{c.label}</Badge>
              <p className="mt-2 text-sm text-slate-300">{c.blurb}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Tread depth reference */}
      <section className="card p-5 sm:p-6">
        <h2 className="font-display text-xl font-extrabold text-white">Tread depth, in plain numbers</h2>
        <div className="mt-4 space-y-3 text-sm">
          {[
            ["10–12/32\"", "Brand new", "emerald", 100],
            ["6–8/32\"", "Plenty of life left", "emerald", 70],
            ["4–5/32\"", "Usable, plan ahead", "amber", 40],
            ["3/32\"", "Replace soon", "amber", 20],
            ["2/32\"", "Legally worn out", "rose", 8],
          ].map(([depth, label, tone, pct]) => (
            <div key={depth} className="flex items-center gap-3">
              <span className="w-20 shrink-0 font-mono font-semibold text-slate-200">{depth}</span>
              <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-white/10">
                <div className={`h-full rounded-full ${tone === "emerald" ? "bg-emerald-500" : tone === "amber" ? "bg-amber-500" : "bg-rose-500"}`} style={{ width: `${pct}%` }} />
              </div>
              <span className="w-36 shrink-0 text-right text-slate-400">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section>
        <h2 className="font-display text-2xl font-extrabold text-white">Frequently asked questions</h2>
        <div className="card mt-4 px-5 py-2">
          <Faq items={BUYER_FAQ} />
        </div>
      </section>

      {/* CTA */}
      <section className="rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 p-6 text-center text-white shadow-lift">
        <h2 className="font-display text-2xl font-extrabold">Ready to find your set?</h2>
        <p className="mt-1 text-white/80">Browse new &amp; used tires from local resellers near you.</p>
        <Link href="/browse" className="btn mt-4 bg-white text-ink-950 hover:bg-slate-100">Browse tires</Link>
      </section>
    </div>
  );
}
