// Minimal service worker — enables installability + a basic offline note.
// It caches NOTHING: page responses can hold a signed-in user's dashboard or
// messages, and a cached copy would outlive logout on a shared device (audit
// L1624). The new cache name makes activate() delete the old v1 page cache.
const CACHE = "tirekind-v2";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

// Network only for navigations, with a tiny offline note when the network is gone.
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET" || req.mode !== "navigate") return;
  e.respondWith(
    fetch(req).catch(
      () => new Response("<h1>Offline</h1><p>Reconnect to use TireKind.</p>", { headers: { "Content-Type": "text/html" } })
    )
  );
});
