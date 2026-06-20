// Centered spinner shared by route-level loading.js files. Colocated per-segment
// (not at the app root) so dynamic detail routes that call notFound() can still
// return a real 404 — a loading boundary above them flushes a 200 shell first,
// which would otherwise turn every miss into a soft-404.
export default function PageLoading() {
  return (
    <div className="grid place-items-center py-24" role="status" aria-label="Loading">
      <span className="h-9 w-9 animate-spin rounded-full border-2 border-white/15 border-t-brand-400" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}
