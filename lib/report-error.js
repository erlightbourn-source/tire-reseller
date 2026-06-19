// Best-effort client-side error reporter. Sends render/runtime errors caught by
// the React error boundaries to /api/client-error, which logs them (captured by
// the host's stdout, e.g. Vercel) and optionally forwards to ERROR_WEBHOOK_URL.
// Zero dependencies; never throws (it runs on the error path).
export function reportClientError(error, extra = {}) {
  try {
    // Always surface to the browser console too.
    // eslint-disable-next-line no-console
    console.error(error);
    const body = JSON.stringify({
      message: String(error?.message ?? error ?? "Unknown error").slice(0, 1000),
      stack: String(error?.stack ?? "").slice(0, 4000),
      digest: error?.digest ?? null,
      url: typeof location !== "undefined" ? location.href : null,
      ua: typeof navigator !== "undefined" ? navigator.userAgent : null,
      ...extra,
    });
    if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
      navigator.sendBeacon("/api/client-error", new Blob([body], { type: "application/json" }));
    } else if (typeof fetch === "function") {
      fetch("/api/client-error", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true,
      }).catch(() => {});
    }
  } catch {
    /* swallow — reporting must never break the error UI */
  }
}
