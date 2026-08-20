// Centered spinner shared by route-level loading.js files.
//
// DO NOT wire this (or any loading.js) onto a segment whose page — or ANY
// descendant page in its route subtree — calls notFound() or redirect().
// Verified live (2026-08-20, next start -p, curl -D) on this exact app:
// a loading.js creates a streaming Suspense boundary, which commits the
// HTTP 200 status before the async page component runs far enough to throw
// NEXT_NOT_FOUND / NEXT_REDIRECT — so the real 404 / 307 silently degrades
// to a soft-200 (the page prints "Page not found" but the browser/curl sees
// 200; an unauthenticated redirect ships full page HTML instead of a 307).
// This isn't limited to an ancestor *layout* — it reproduced with loading.js
// colocated in the SAME segment as the notFound()-calling page.js
// (app/listings/[id]/), and via a PARENT segment's loading.js inherited by
// a notFound()/redirect()-calling child route (app/messages/loading.js ->
// app/messages/[threadId]/page.js). Only wire loading.js onto segments
// where neither that page nor any nested page ever calls notFound()/
// redirect() — see safety-reports/2026-08-20-*.md and BACKLOG.md #5.
export default function PageLoading() {
  return (
    <div className="grid place-items-center py-24" role="status" aria-label="Loading">
      <span className="h-9 w-9 animate-spin border-2 border-white/15 border-t-brand-400" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}
