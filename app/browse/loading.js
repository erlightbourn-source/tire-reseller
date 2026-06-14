// Skeleton for the marketplace while listings load.
export default function BrowseLoading() {
  return (
    <div className="space-y-4" aria-busy="true">
      <div className="h-8 w-64 animate-pulse rounded-lg bg-white/5" />
      <div className="lg:grid lg:grid-cols-[260px_1fr] lg:gap-6">
        <div className="hidden h-[28rem] animate-pulse rounded-2xl bg-white/5 lg:block" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="card overflow-hidden">
              <div className="aspect-[4/3] w-full animate-pulse bg-white/5" />
              <div className="space-y-2 p-3.5">
                <div className="h-4 w-2/3 animate-pulse rounded bg-white/5" />
                <div className="h-3 w-1/2 animate-pulse rounded bg-white/5" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
