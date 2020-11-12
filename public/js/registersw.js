window.addEventListener('load', (event) => {
    if ('serviceWorker' in navigator) { //register service worker
        navigator.serviceWorker.register('sw.js', {
            scope: '/'
        });
        console.log("sw should be registered")
    }
}, false)