"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

// One-click moderator action that POSTs to /api/admin and refreshes the page.
export default function AdminButton({ action, id, label, className = "btn-secondary", confirm }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function run() {
    if (confirm && !window.confirm(confirm)) return;
    setBusy(true);
    const res = await fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, id }),
    });
    setBusy(false);
    if (res.ok) router.refresh();
    else window.alert((await res.json().catch(() => ({}))).error || "Action failed.");
  }

  return (
    <button onClick={run} disabled={busy} className={`${className} px-3 py-1 text-xs`}>
      {busy ? "…" : label}
    </button>
  );
}
