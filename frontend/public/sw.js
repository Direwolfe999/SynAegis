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

// Pass everything to network in demo mode to prevent Next.js UI chunks failing to load
self.addEventListener("fetch", (event) => {
    // Avoid caching Next.js dev bundles or layout CSS, simply pass through
    event.respondWith(
      fetch(event.request).catch((err) => {
        console.warn("SW fetch error", err);
        return new Response("Offline", { status: 503 });
      })
    );
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
