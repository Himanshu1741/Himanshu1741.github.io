// CollabHub Service Worker — offline support + cache-first for static assets
const CACHE_NAME = "collabhub-v2";
const OFFLINE_PAGE = "/offline";

const PRECACHE = [
  "/",
  "/offline",
  "/dashboard",
  "/projects",
  "/deadlines",
  "/profile",
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

// ─── Install: pre-cache core pages ───────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) =>
        Promise.allSettled(
          PRECACHE.map((url) => cache.add(url).catch(() => {})),
        ),
      ),
  );
  self.skipWaiting();
});

// ─── Activate: clean up old caches ───────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)),
        ),
      ),
  );
  self.clients.claim();
});

// ─── Helpers ─────────────────────────────────────────────────────────────────
function isNavigationRequest(request) {
  return request.mode === "navigate";
}

function isAPIRequest(url) {
  return url.pathname.startsWith("/api/") || url.pathname.startsWith("/socket");
}

function isStaticAsset(url) {
  return /\.(?:js|css|png|jpg|jpeg|gif|svg|ico|woff2?|ttf|eot)$/i.test(
    url.pathname,
  );
}

// ─── Fetch ───────────────────────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET, chrome-extension, and cross-origin (except fonts)
  if (request.method !== "GET") return;
  if (url.protocol === "chrome-extension:") return;
  if (
    url.origin !== self.location.origin &&
    !url.hostname.includes("fonts.googleapis.com") &&
    !url.hostname.includes("fonts.gstatic.com")
  )
    return;

  // ── API: network-first, cache fallback ──────────────────────────────────
  if (isAPIRequest(url)) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((c) => c.put(request, clone));
          }
          return res;
        })
        .catch(() => caches.match(request)),
    );
    return;
  }

  // ── Static assets: cache-first ───────────────────────────────────────────
  if (isStaticAsset(url)) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((res) => {
            if (res.ok) {
              const clone = res.clone();
              caches.open(CACHE_NAME).then((c) => c.put(request, clone));
            }
            return res;
          }),
      ),
    );
    return;
  }

  // ── Page navigation: network-first → cached → offline fallback ───────────
  if (isNavigationRequest(request)) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((c) => c.put(request, clone));
          }
          return res;
        })
        .catch(() =>
          caches
            .match(request)
            .then((cached) => cached || caches.match(OFFLINE_PAGE)),
        ),
    );
    return;
  }

  // ── Everything else: stale-while-revalidate ───────────────────────────────
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) =>
      cache.match(request).then((cached) => {
        const fetchPromise = fetch(request).then((res) => {
          if (res.ok) cache.put(request, res.clone());
          return res;
        });
        return cached || fetchPromise;
      }),
    ),
  );
});

// ─── Background sync ─────────────────────────────────────────────────────────
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-updates") {
    console.log("[SW] Background sync — flushing queued updates");
  }
});

// ─── Push notifications ──────────────────────────────────────────────────────
self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || "CollabHub";
  const body = data.body || "You have a new notification";
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      tag: data.tag || "collabhub",
      renotify: true,
      data: { url: data.url || "/dashboard" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/dashboard";
  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((wins) => {
        const existing = wins.find((w) => w.url.includes(url));
        if (existing) return existing.focus();
        return clients.openWindow(url);
      }),
  );
});
