self.addEventListener('install', (event) => {
  event.waitUntil(caches.open('jmk18-v1').then((cache) => cache.addAll(['./', './index.html', './styles.css', './app.js', './manifest.json'])));
  self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
