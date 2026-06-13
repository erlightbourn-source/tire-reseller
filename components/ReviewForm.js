"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ReviewForm({ sellerId, existing }) {
  const router = useRouter();
  const [rating, setRating] = useState(existing?.rating || 0);
  const [hover, setHover] = useState(0);
  const [body, setBody] = useState(existing?.body || "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (!rating) return setErr("Pick a star rating.");
    setBusy(true);
    setErr("");
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sellerId, rating, body }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) return setErr(data.error || "Could not save review.");
    setDone(true);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="card space-y-3 p-4">
      <p className="text-sm font-bold text-slate-200">{existing ? "Update your review" : "Rate this seller"}</p>
      {err && <div className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">{err}</div>}
      {done && <div className="rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">Thanks — your review was saved.</div>}
      <div className="flex gap-1" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            onMouseEnter={() => setHover(n)}
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
          >
            <svg viewBox="0 0 20 20" className={`h-7 w-7 transition ${n <= (hover || rating) ? "fill-accent-400" : "fill-white/15"}`}>
              <path d="M10 1.6l2.47 5.01 5.53.8-4 3.9.94 5.5L10 14.2l-4.94 2.6.94-5.5-4-3.9 5.53-.8L10 1.6Z" />
            </svg>
          </button>
        ))}
      </div>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        className="input"
        placeholder="How was the transaction? (optional)"
      />
      <button disabled={busy} className="btn-primary">{busy ? "Saving…" : existing ? "Update review" : "Post review"}</button>
    </form>
  );
}
