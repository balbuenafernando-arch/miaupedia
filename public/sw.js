const CACHE = "miaupedia-offline-v2";
const FALLBACK = "/sin-conexion.html";

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll([FALLBACK, "/icons/miaupedia-wordmark.png"])).then(() => self.skipWaiting()));
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith("miaupedia-offline-") && key !== CACHE)
      .map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", event => {
  const { request } = event;
  if (request.method === "GET" && request.url === new URL("/icons/miaupedia-wordmark.png",self.location.origin).href) {
    event.respondWith(caches.open(CACHE).then(cache=>cache.match(request)).then(hit=>hit ?? fetch(request)));
    return;
  }
  if (request.method !== "GET" || request.mode !== "navigate" ||
      new URL(request.url).origin !== self.location.origin) return;

  // Cache only the static offline page. Auth and private data always use the network.
  event.respondWith(fetch(request).catch(async () => {
    const cache = await caches.open(CACHE);
    return await cache.match(FALLBACK) ?? Response.error();
  }));
});
