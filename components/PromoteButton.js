"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PromoteButton({ id, initial }) {
  const router = useRouter();
  const [featured, setFeatured] = useState(initial);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    const next = !featured;
    const res = await fetch(`/api/listings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ featured: next }),
    });
    setBusy(false);
    if (res.ok) {
      setFeatured(next);
      router.refresh();
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={busy}
      className={`btn shrink-0 px-3 py-1.5 ${
        featured
          ? "bg-accent-500 text-ink-950 hover:bg-accent-400"
          : "bg-white/5 text-slate-200 ring-1 ring-inset ring-white/10 hover:bg-white/10"
      }`}
      title="Promote this listing to the top of search (demo: free)"
    >
      ★ {featured ? "Featured" : "Promote"}
    </button>
  );
}
