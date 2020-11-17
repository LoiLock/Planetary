// Service worker

var cacheName = "planetary-pwa"

var filesToCache = [ // Files necessary for the dashboard to function
    "/",
    "/sw.js",
    "/js/client.js", // Mainly for development
    "/js/dist/dist.js", // For production
    "/js/handleevents.js",
    "/manifest.json",
    "/js/clientutils.js",
    "/css/style.css"
]

self.addEventListener("install", (e) => {
    console.log("v0.1.3")
    e.waitUntil(
        caches.open(cacheName).then((cache) => {
            return cache.addAll(filesToCache)
        })
        .then(() => {
            // Everything is cached, serviceworker is ready to be used
            return self.skipWaiting();
        })
    )
})

self.addEventListener('activate', function(event) {
    // Prevent needing to refresh page to activate serviceworker
    event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', function(event) {
    var reqPath = new URL (event.request.url)
    // Check if it's an event stream, if so let the browser handle it and not the service worker.
    if (reqPath.pathname.startsWith("/events") || reqPath.pathname.startsWith("/u/") || reqPath.pathname.startsWith("/info")) return;

    // ! It is very possible that the user will get lots of errors in the console when he's offline, this means that the thumbnails haven't been cached due to lazyloading
    event.respondWith(
        caches.open(cacheName).then(cache => {
            var reqPath = new URL(event.request.url)
            if (reqPath.pathname.startsWith("/thumbs/") || reqPath.pathname.startsWith("/svg/") || reqPath.pathname == "/") { // for thumbnails, SVGs and the homepage (start_url) always prefer cache over network response
                return cache.match(event.request).then((cachedThumb) => { // If cachedThumb is not undefined, serve the cached request
                    if(cachedThumb) {
                        console.log(`Serving asset: ${cachedThumb.url} from cache`)
                        return cachedThumb
                    } else { // Thumbnail isn't cached yet, fetch it, clone the response and put it in the cache for next time
                        return fetch(event.request).then((response) => {
                            console.log(`Adding asset: ${event.request.url} to cache and serving network response`)
                            cache.put(event.request, response.clone())
                            return response
                        })
                    }
                })
            }
            
            return fetch(event.request).then(function(response) { // For any other requests, Always prefer serving the server response and use the cache as a fallback
                console.log(`Adding request to ${event.request.url} to cache and serving network response`)
                cache.put(event.request, response.clone())
                return response
            }).catch(function() {
                console.log(`No internet connection, serving ${event.request.url} from cache`)
                return caches.match(event.request)
            })
        })
    );
});