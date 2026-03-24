const CACHE_NAME = "synaegis-v1";

const ASSETS_TO_CACHE = [
  "/",
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png",
  "/apple-touch-icon.png",
  "/logos/logo.png",
  "/logos/wording.png",
  "/logos/full.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  // Network first strategy for API, Cache slightly for others
  const url = new URL(event.request.url);
  
  if (url.pathname.startsWith('/api') || url.pathname.startsWith('/ws')) {
      event.respondWith(
          fetch(event.request).catch(() => {
              return new Response(JSON.stringify({ error: "offline mode" }), { headers: { 'Content-Type': 'application/json' }});
          })
      );
  } else {
      event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          return fetch(event.request).then(response => {
              return caches.open(CACHE_NAME).then(cache => {
                  if (event.request.method === "GET") {
                      cache.put(event.request, response.clone());
                  }
                  return response;
              });
          }).catch(() => {
              // offline fallback page logic if requested html
          });
        })
      );
  }
});

self.addEventListener("push", (event) => {
    let rawData = event.data ? event.data.text() : "{}";
    let data;
    try {
        data = JSON.parse(rawData);
    } catch {
        data = { title: "SynAegis Alert", body: rawData };
    }
  
    const options = {
        body: data.body || "New event recorded.",
        icon: "/icon-192.png",
        badge: "/icon-192.png",
        data: { url: "/" }
    };
  
    event.waitUntil(
        self.registration.showNotification(data.title || "SynAegis", options)
    );
});

self.addEventListener("notificationclick", (event) => {
    event.notification.close();
    event.waitUntil(
        self.clients.matchAll({ type: "window" }).then((clientsArr) => {
            if (clientsArr.length) {
                clientsArr[0].focus();
            } else {
                self.clients.openWindow("/");
            }
        })
    );
});
