"use client";
import Link from "next/link";

export default function Error({ error, reset }) {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <span className="text-4xl">🛞</span>
      <h1 className="mt-3 font-display text-2xl font-bold text-white">Something went wrong</h1>
      <p className="mt-1 text-sm text-slate-400">
        That page hit a snag. You can try again or head back to the marketplace.
      </p>
      <div className="mt-5 flex justify-center gap-2">
        <button onClick={() => reset()} className="btn-primary">Try again</button>
        <Link href="/browse" className="btn-secondary">Browse tires</Link>
      </div>
    </div>
  );
}
