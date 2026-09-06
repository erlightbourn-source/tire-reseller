"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

// `label` = the tier-aware monthly price string from lib/pricing.js (server-resolved).
export default function BecomeSeller({ expired, label }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function start() {
    setBusy(true);
    setErr("");

    if (expired) {
      // Launch listing window is over → take payment via Stripe (or simulated dev mode).
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setBusy(false);
        return setErr(data.error || "Could not start checkout.");
      }
      if (data.url.startsWith("http")) {
        window.location.href = data.url;
      } else {
        router.push(data.url);
        router.refresh();
      }
      return;
    }

    // Free to list during launch → just flip the account to a seller, no payment.
    const res = await fetch("/api/seller/start", { method: "POST" });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) return setErr(data.error || "Something went wrong.");
    router.push("/dashboard?welcome=seller");
    router.refresh();
  }

  return (
    <>
      {err && <div className="mb-2 bg-red-500/10 px-3 py-2 text-sm text-red-300 ring-1 ring-red-400/30">{err}</div>}
      <button onClick={start} disabled={busy} className="btn-primary w-full">
        {busy ? "One sec…" : expired ? `Subscribe for ${label || "the seller plan"}` : "Start selling free"}
      </button>
    </>
  );
}
