import Link from "next/link";

export const metadata = { title: "Unsubscribed — TireTrader", robots: { index: false } };

export default function UnsubscribedPage() {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <span className="text-4xl">🛞</span>
      <h1 className="mt-3 font-display text-2xl font-bold text-white">You're unsubscribed</h1>
      <p className="mt-1 text-sm text-slate-400">You won't get any more emails for that saved search.</p>
      <Link href="/browse" className="btn-primary mt-5">Back to browsing</Link>
    </div>
  );
}
