// Shown during server-render navigations that don't define their own loading UI.
export default function Loading() {
  return (
    <div className="grid place-items-center py-24" role="status" aria-label="Loading">
      <span className="h-9 w-9 animate-spin rounded-full border-2 border-white/15 border-t-brand-400" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}
