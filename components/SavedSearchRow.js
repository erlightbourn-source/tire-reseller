"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SavedSearchRow({ search }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function act(method, extra) {
    setBusy(true);
    await fetch("/api/saved-searches", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: search.id, ...extra }),
    });
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="card flex items-center gap-3 p-4">
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-white">{search.label}</p>
        <p className="text-xs text-slate-400">Saved {new Date(search.createdAt).toLocaleDateString()}</p>
      </div>
      {search.newCount > 0 && (
        <span className="badge bg-brand-600 text-white">{search.newCount} new</span>
      )}
      <Link
        href={`/browse?${search.query}`}
        onClick={() => act("PATCH", {})}
        className="btn-secondary"
      >
        View
      </Link>
      <button onClick={() => act("DELETE", {})} disabled={busy} className="btn-ghost px-2" aria-label="Delete saved search">
        <svg viewBox="0 0 20 20" className="h-4 w-4 fill-current"><path d="M7 2h6l1 2h3v2H3V4h3l1-2Zm-2 5h10l-1 11H6L5 7Z"/></svg>
      </button>
    </div>
  );
}
