/**
 * Service worker PWA ¡QUE NOTICIA! — vanilla, sin Workbox.
 *
 * Estrategias:
 *  - Navegaciones: NetworkFirst (timeout 3s) → cache → fallback "/" precacheada.
 *  - _next/static: CacheFirst (immutable).
 *  - Imágenes (_next/image, R2, storage Supabase): CacheFirst con LRU 60.
 *  - /api/** y RSC: NetworkOnly (nunca cachear datos).
 *  - Push: notificación "Última Hora" con tag breaking (colapsa consecutivas).
 */

const VERSION = "v1";
const PAGES_CACHE = `qn-pages-${VERSION}`;
const STATIC_CACHE = `qn-static-${VERSION}`;
const IMG_CACHE = `qn-img-${VERSION}`;
const IMG_LRU = 60;

/** Endpoints de imágenes cacheables. */
const IMG_HOSTS = [
  "pub-7d90620b77a845bcbb1bf3fee8f467a2.r2.dev",
  "uhuidlistqoonyqtpyvh.supabase.co",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(PAGES_CACHE)
      .then((cache) =>
        Promise.allSettled([
          cache.add("/"),
          cache.add("/icon-192.png"),
        ]),
      )
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => ![PAGES_CACHE, STATIC_CACHE, IMG_CACHE].includes(k))
            .map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

/** LRU manual para el cache de imágenes: si excede el tope, borra la más vieja. */
async function cacheImgLRU(request, response) {
  const cache = await caches.open(IMG_CACHE);
  const keys = await cache.keys();
  if (keys.length >= IMG_LRU) {
    await cache.delete(keys[0]);
  }
  await cache.put(request, response);
}

async function networkFirstPage(request) {
  const cache = await caches.open(PAGES_CACHE);
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(request, { signal: controller.signal });
    clearTimeout(timer);
    if (res.ok) cache.put(request, res.clone());
    return res;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    const home = await cache.match("/");
    if (home) return home;
    return new Response("Sin conexión", { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // API y RSC: siempre red (datos frescos).
  if (url.pathname.startsWith("/api/") || url.searchParams.has("_rsc")) return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirstPage(request));
    return;
  }

  // estáticos de Next (immutable)
  if (url.origin === self.location.origin && url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ||
          fetch(request).then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(STATIC_CACHE).then((c) => c.put(request, copy));
            }
            return res;
          }),
      ),
    );
    return;
  }

  // imágenes (R2 / storage / _next/image)
  const isImg =
    (url.origin === self.location.origin && url.pathname.startsWith("/_next/image")) ||
    IMG_HOSTS.includes(url.hostname);
  if (isImg) {
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ||
          fetch(request).then((res) => {
            if (res.ok || res.type === "opaque") {
              const copy = res.clone();
              cacheImgLRU(request, copy);
            }
            return res;
          }),
      ),
    );
  }
});

/* ============ push ============ */

self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { title: "¡QUE NOTICIA!", body: event.data ? event.data.text() : "" };
  }
  event.waitUntil(
    self.registration.showNotification(payload.title || "¡QUE NOTICIA!", {
      body: payload.body || "",
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      tag: "breaking",
      data: { url: payload.url || "/" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || "/", self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === target && "focus" in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(target);
      return undefined;
    }),
  );
});