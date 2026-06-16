import Link from "next/link";

export const metadata = { title: "Alerts confirmed — TireTrader", robots: { index: false } };

export default function AlertsConfirmedPage() {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <span className="text-4xl">🔔</span>
      <h1 className="mt-3 font-display text-2xl font-bold text-white">You're all set</h1>
      <p className="mt-1 text-sm text-slate-400">
        We'll email you when new tires match your search. You can unsubscribe from any alert email.
      </p>
      <Link href="/browse" className="btn-primary mt-5">Browse tires</Link>
    </div>
  );
}
