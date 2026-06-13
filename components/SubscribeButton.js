"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SubscribeButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function go() {
    setBusy(true);
    setErr("");
    const res = await fetch("/api/stripe/checkout", { method: "POST" });
    const data = await res.json();
    if (!res.ok) {
      setBusy(false);
      return setErr(data.error || "Could not start checkout.");
    }
    // Real Stripe returns an absolute checkout URL; dev mode returns an internal path.
    if (data.url.startsWith("http")) {
      window.location.href = data.url;
    } else {
      router.push(data.url);
      router.refresh();
    }
  }

  return (
    <>
      {err && <div className="mb-2 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300 ring-1 ring-red-400/30">{err}</div>}
      <button onClick={go} disabled={busy} className="btn-primary w-full">
        {busy ? "Starting checkout…" : "Subscribe for $10/month"}
      </button>
    </>
  );
}
