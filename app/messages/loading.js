// Skeleton for the inbox while threads (+ unread counts) load — the page is
// force-dynamic with two sequential Prisma queries and no cache, so a slow
// DB round-trip previously rendered a blank page.
export default function MessagesLoading() {
  return (
    <div className="mx-auto max-w-2xl" aria-busy="true">
      <div className="mb-4">
        <p className="eyebrow">Inbox</p>
        <h1 className="font-display text-2xl font-extrabold text-white">Messages</h1>
      </div>
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="card flex items-center gap-3 p-3">
            <div className="h-14 w-14 shrink-0 animate-pulse bg-white/5" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-4 w-1/3 animate-pulse bg-white/5" />
              <div className="h-3 w-2/3 animate-pulse bg-white/5" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
