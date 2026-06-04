const CACHE_NAME = "iiht-alumni-mobile-v1";
const CORE_FILES = ["index.html", "styles.css", "app.js", "manifest.json"];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(CORE_FILES)));
});

self.addEventListener("fetch", event => {
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
