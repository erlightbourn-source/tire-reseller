"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ProButton({ isPro }) {
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
      {err && <div className="mb-2 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">{err}</div>}
      <button onClick={go} disabled={busy} className={isPro ? "btn-secondary w-full" : "btn-accent w-full"}>
        {busy ? "One sec…" : isPro ? "Cancel Pro" : "Upgrade to Pro — $25/mo"}
      </button>
    </>
  );
}
