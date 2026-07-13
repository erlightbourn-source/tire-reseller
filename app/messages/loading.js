// Skeleton for the inbox while threads + unread counts load. The inbox runs two
// sequential DB queries (findMany threads with heavy includes, then a groupBy for
// unread), so a slow request otherwise shows a blank screen. Safe to add here: the
// route redirects unauth'd users and never calls notFound(), so no soft-404 risk
// (see components/PageLoading.js on why detail/[id] routes deliberately have none).
export default function MessagesLoading() {
  return (
    <div className="mx-auto max-w-2xl" aria-busy="true">
      <div className="mb-4">
        <div className="h-3 w-16 animate-pulse bg-white/5" />
        <div className="mt-2 h-7 w-40 animate-pulse bg-white/5" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="card flex items-center gap-3 p-3">
            <div className="h-14 w-14 shrink-0 animate-pulse bg-white/5 ring-1 ring-white/10" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-4 w-2/3 animate-pulse bg-white/5" />
              <div className="h-3 w-1/2 animate-pulse bg-white/5" />
              <div className="h-3 w-3/4 animate-pulse bg-white/5" />
            </div>
          </div>
        ))}
      </div>
      <span className="sr-only">Loading messages…</span>
    </div>
  );
}
