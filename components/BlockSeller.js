"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function BlockSeller({ sellerId, initial }) {
  const router = useRouter();
  const [blocked, setBlocked] = useState(initial);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    if (!blocked && !confirm("Block this seller? You won't see their listings or be able to message them.")) return;
    setBusy(true);
    const res = await fetch("/api/block", {
      method: blocked ? "DELETE" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: sellerId }),
    });
    setBusy(false);
    if (res.ok) {
      setBlocked(!blocked);
      router.refresh();
    }
  }

  return (
    <button onClick={toggle} disabled={busy} className={blocked ? "btn-secondary" : "btn-ghost text-slate-400"}>
      {blocked ? "Unblock seller" : "🚫 Block seller"}
    </button>
  );
}
