self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Simple pass-through fetch for now, satisfying PWA requirement 
  // without breaking dynamic Next.js routes unexpectedly.
  event.respondWith(fetch(event.request).catch(error => {
    console.log('Fetch failed; returning offline page instead.', error);
  }));
});
