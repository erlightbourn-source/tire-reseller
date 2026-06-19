"use client";
import { useEffect } from "react";
import { reportClientError } from "@/lib/report-error";

// Catches errors thrown in the root layout itself. Must render its own
// <html>/<body> because it replaces the whole document tree.
export default function GlobalError({ error, reset }) {
  useEffect(() => { reportClientError(error, { fatal: true }); }, [error]);
  return (
    <html lang="en">
      <body style={{ background: "#070809", color: "#e2e8f0", fontFamily: "system-ui, sans-serif" }}>
        <div style={{ maxWidth: 420, margin: "12vh auto", textAlign: "center", padding: "0 1rem" }}>
          <div style={{ fontSize: 40 }}>🛞</div>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginTop: 12 }}>Something went wrong</h1>
          <p style={{ color: "#94a3b8", marginTop: 6 }}>The app ran into an unexpected error.</p>
          <button
            onClick={() => reset()}
            style={{ marginTop: 20, padding: "10px 18px", borderRadius: 12, border: 0, background: "#2545e6", color: "#fff", fontWeight: 600, cursor: "pointer" }}
          >
            Reload
          </button>
        </div>
      </body>
    </html>
  );
}
