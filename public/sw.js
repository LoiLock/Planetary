// Service worker

var cacheName = "planetary-pwa"

var filesToCache = [ // Files necessary for the dashboard to function
    "/sw.js",
    "/dashboard",
    "/js/client.js",
    "/js/clientutils.js",
    "/css/style.css",
    "/js/feather-min.js"
]

self.addEventListener("install", (e) => {
    console.log("v0.1.1")
    e.waitUntil(
        caches.open(cacheName).then((cache) => {
            return cache.addAll(filesToCache)
        })
    )
})

self.addEventListener('fetch', function(event) {
    event.respondWith(
        // fetch(event.request).catch(function() {
        //     console.log("matches")
        //     return caches.match(event.request);
        // }),
        fetch(event.request).then(function(response) { // If we have internet, don't access the cache and just continue as normal
            return caches.open(cacheName).then((cache) => {
                cache.put(event.request, response.clone())
                return response
            })
        }).catch(function() { // If we don't have internet, use the cache
            return caches.match(event.request);
        })
    );
});
  