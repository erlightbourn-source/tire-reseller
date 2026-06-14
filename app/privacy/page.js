import Link from "next/link";
import { PRIVACY, LAST_UPDATED } from "@/lib/legal";

export const metadata = {
  title: "Privacy Policy — TireTrader",
  description: "What data TireTrader collects, how it's used, and your controls.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <p className="eyebrow">Legal</p>
        <h1 className="mt-1 font-display text-3xl font-extrabold text-white">Privacy Policy</h1>
        <p className="mt-1 text-sm text-slate-400">Last updated {LAST_UPDATED}</p>
      </div>
      <div className="space-y-5">
        {PRIVACY.map(([h, body]) => (
          <section key={h}>
            <h2 className="font-display text-lg font-bold text-white">{h}</h2>
            <p className="mt-1 text-sm leading-relaxed text-slate-300">{body}</p>
          </section>
        ))}
      </div>
      <p className="text-sm text-slate-400">
        Manage or export your data anytime in <Link href="/settings" className="font-semibold text-brand-300 hover:underline">Settings</Link>.
        See also our <Link href="/terms" className="font-semibold text-brand-300 hover:underline">Terms of Service</Link>.
      </p>
    </div>
  );
}
