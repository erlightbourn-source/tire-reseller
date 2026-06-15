// Client-side custom event tracking. No-op unless the analytics script has loaded
// (window.plausible). Safe to call anywhere in client components.
export function track(event, props) {
  if (typeof window !== "undefined" && typeof window.plausible === "function") {
    window.plausible(event, props ? { props } : undefined);
  }
}
