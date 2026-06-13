"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DeleteListingButton({ id }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function del() {
    if (!confirm("Delete this listing permanently? This cannot be undone.")) return;
    setBusy(true);
    const res = await fetch(`/api/listings/${id}`, { method: "DELETE" });
    setBusy(false);
    if (res.ok) {
      router.push("/dashboard");
      router.refresh();
    } else {
      alert("Could not delete listing.");
    }
  }

  return (
    <button onClick={del} disabled={busy} className="btn-danger">
      {busy ? "Deleting…" : "Delete"}
    </button>
  );
}
