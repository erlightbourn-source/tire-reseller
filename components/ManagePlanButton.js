"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ManagePlanButton({ label = "Manage or cancel plan", className = "btn bg-white text-slate-900 hover:bg-slate-100" }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function go() {
    setBusy(true);
    setErr("");
    const res = await fetch("/api/stripe/portal", { method: "POST" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.url) {
      setBusy(false);
      return setErr(data.error || "Couldn't open billing right now.");
    }
    // Real Stripe returns an absolute portal URL; dev mode returns an internal path.
    if (data.url.startsWith("http")) {
      window.location.href = data.url;
    } else {
      router.push(data.url);
      router.refresh();
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button onClick={go} disabled={busy} className={className}>
        {busy ? "Opening billing…" : label}
      </button>
      {err && <p className="max-w-xs text-right text-xs font-semibold">{err}</p>}
    </div>
  );
}
