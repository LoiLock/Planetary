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
    console.log("v0.1.3")
    e.waitUntil(
        caches.open(cacheName).then((cache) => {
            return cache.addAll(filesToCache)
        })
    )
})

self.addEventListener('fetch', function(event) {
    event.respondWith(
        fetch(event.request).then(function(response) { // If we have internet, don't access the cache and just continue as normal
            // ? Get url pathname, check if starts with /u/, if it does, return the response of the fetch request and do NOT cache the /u/ file
            var reqPath = new URL(event.request.url)
            if (reqPath.pathname.startsWith("/u/")) {
                // console.log("not caching " + reqPath.pathname)
                return response
            }

            return caches.open(cacheName).then((cache) => {
                cache.put(event.request, response.clone())
                return response
            })
        }).catch(function() { // If we don't have internet, use the cache
            return caches.match(event.request);
        })
    );
});
  