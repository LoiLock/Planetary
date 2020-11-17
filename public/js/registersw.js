window.addEventListener('load', async (event) => {
    if ('serviceWorker' in navigator) { //register service worker
        navigator.serviceWorker.register('sw.js', {
            scope: '/'
        });
        console.log("sw should be registered")
    }


    // Prefer cache, update on network response
    if(window.location.pathname == "/") { // Only do this on the homescreen
        const SiteInfoResponse = fetch("/info") // Start response promise
        const CachedSiteInfo = await caches.match("/info") // Check if we have a previous response cached, if so serve that
        if(CachedSiteInfo) await setSiteInfo(CachedSiteInfo);


        try {
            const ServerResponse = await SiteInfoResponse; // Once the network info promise resolves, update the cache and update the footer
            const cache = await caches.open("planetary-pwa")
            cache.put("/info", ServerResponse.clone())
            await setSiteInfo(ServerResponse)
            
        } catch {
            // ! probably offline
        }
    }

}, false)

async function setSiteInfo(response) { // Sets footer of siteinfo from server or cache response
    const SiteInfo = await response.json()
    var footerLinks = document.getElementsByClassName("homepage__footer__links__link")
    footerLinks[0].textContent = "Users: " + SiteInfo.UserCount
    footerLinks[1].textContent = "Files: " + SiteInfo.FileCount

    footerLinks[2].firstElementChild.setAttribute("title", SiteInfo.FileSize + "KB")
    let filesizewrapper = footerLinks[2].firstElementChild
    filesizewrapper.textContent = SiteInfo.FileSizeHuman
    
    footerLinks[3].firstElementChild.setAttribute("href", "https://github.com/loilock/planetary/commit/" + SiteInfo.CommitHash)
    let commitwrapper = footerLinks[3].firstElementChild
    commitwrapper.textContent = SiteInfo.ShortCommitHash

}