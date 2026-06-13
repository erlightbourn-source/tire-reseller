"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function FavoriteButton({ listingId, initial = false, className = "", labelled = false }) {
  const router = useRouter();
  const [fav, setFav] = useState(initial);
  const [busy, setBusy] = useState(false);

  async function toggle(e) {
    e.preventDefault();
    e.stopPropagation();
    if (busy) return;
    setBusy(true);
    const next = !fav;
    setFav(next); // optimistic
    const res = await fetch("/api/favorites", {
      method: next ? "POST" : "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId }),
    });
    setBusy(false);
    if (res.status === 401) {
      router.push(`/login?next=/listings/${listingId}`);
      return;
    }
    if (!res.ok) setFav(!next); // revert on failure
    else router.refresh();
  }

  if (labelled) {
    return (
      <button onClick={toggle} className={`btn-secondary ${className}`} aria-pressed={fav}>
        <Heart filled={fav} />
        {fav ? "Saved" : "Save"}
      </button>
    );
  }

  return (
    <button
      onClick={toggle}
      aria-label={fav ? "Remove from favorites" : "Save to favorites"}
      aria-pressed={fav}
      className={`grid h-8 w-8 place-items-center rounded-full bg-ink-950/60 backdrop-blur ring-1 ring-white/15 transition hover:bg-ink-950/80 ${className}`}
    >
      <Heart filled={fav} />
    </button>
  );
}

function Heart({ filled }) {
  return (
    <svg viewBox="0 0 20 20" className={`h-4 w-4 transition ${filled ? "fill-red-500" : "fill-none stroke-white"}`} strokeWidth="1.6">
      <path d="M10 17s-6-4.35-8-8.5C.8 5.9 2.5 3.5 5 3.5c1.7 0 2.8 1 3.5 2 .7-1 1.8-2 3.5-2 2.5 0 4.2 2.4 3 5-2 4.15-8 8.5-8 8.5Z" />
    </svg>
  );
}
