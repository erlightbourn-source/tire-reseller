"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

// Toggles the seller-plan perks flag via /api/pro. Labels come from the caller
// (no dollar figures here — see lib/pricing.js).
export default function ProButton({ isPro = false, label = "Activate plan perks" }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function go() {
    setBusy(true);
    setErr("");
    const res = await fetch("/api/pro", { method: isPro ? "DELETE" : "POST" });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      if (data.code === "become_seller") return router.push("/subscribe");
      return setErr(data.error || "Something went wrong.");
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <>
      {err && <div className="mb-2 bg-red-500/10 px-3 py-2 text-sm text-red-300">{err}</div>}
      <button onClick={go} disabled={busy} className={isPro ? "btn-secondary w-full" : "btn-accent w-full"}>
        {busy ? "One sec…" : isPro ? "Deactivate plan perks" : label}
      </button>
    </>
  );
}
