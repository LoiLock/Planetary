import { humanDate, generateShareXConfig } from './clientutils.js'

window.onload = function() {
    if ('serviceWorker' in navigator) { //register service worker
        navigator.serviceWorker.register('sw.js', {
            scope: '/'
        });
    }
    getUploads() // Get uploads on dashboard load
    initComponents() // Add event listeners to buttons and such
}


async function getUploads() {
    var gridElement = document.querySelector(".dashboard__content")
    // caches.open('planetary-pwa').then(function(cache) {
        
    // })
    var response = await fetch("/uploads")
    let data = await response.json()
    console.log(data)
    data = data.reverse()
    data.forEach(element => {
        console.log(element)
        addImageToGrid(gridElement, element)
    });
    feather.replace() // reload icons
    return data
}

function addImageToGrid(gridElement, element) { // Creates image element to be added to the image grid, gridElement is the element to which the grid items will be added
    var thumbnailContainer = document.createElement("div") // Container for the actual image grid item
    var containerChild = document.createElement("img") // backgroun image or video or audio

    var buttonWrapper = document.createElement("div") // This div is a wrapper for the share, download, open (in new tab) button
    var summaryCover = document.createElement("div") // This div is a cover for when the user hovers over the image container
    // Populate summaryCover
    var summaryHeader = document.createElement("h3") // Filename
    var summaryTime = document.createElement("span") // Upload time
    var filename = document.createTextNode(element.filename)
    var timestamp = document.createTextNode(humanDate(element.unixtime))
    summaryHeader.appendChild(filename)
    summaryTime.appendChild(timestamp)

    // Apply child elements
    summaryCover.appendChild(summaryHeader)
    summaryCover.appendChild(summaryTime)

    thumbnailContainer.classList.add("thumbnail-container")
    summaryCover.classList.add("thumbnail-container__summary")
    containerChild.classList.add("thumbnail-container__child")
    buttonWrapper.classList.add("thumbnail-container__summary__actions")


    // Create video player or use default background image
    if (element.thumbnail && element.thumbnail != "") { // If the file has a thumbnail
        var fileExt = element.thumbnail.split('.').pop()
        fileExt = fileExt.toLowerCase()
        console.log(fileExt)
        var fullFileExt = element.filename.split('.').pop() // The file extension of the FILE not the thumbnail
        fullFileExt =  fullFileExt.toLowerCase()
        switch(fileExt) {
            case "mp4": // ? Create video player
                summaryCover.appendChild(createIcon("film")) // Add filetype icon

                thumbnailContainer.addEventListener("click", function(event) {
                    toggleVideo(event.currentTarget) // Why did no one tell me about event.currentTarget before????
                }, false)
                thumbnailContainer.setAttribute("data-filename", element.filename) // Set Filename, used for opening in new tab

                var videoContainer = document.createElement("video")
                videoContainer.preload = "metadata"
                videoContainer.classList.add("thumbnail-container__video")
                var videoSource = document.createElement("source")
                videoSource.type = "video/mp4"
                videoSource.src = `thumbs/${element.thumbnail}`
                videoContainer.appendChild(videoSource)
                thumbnailContainer.appendChild(videoContainer)

                break;
            case "jpg": // Set background image of containerChild to the thumbnail
                if (fullFileExt == "pdf") {
                    summaryCover.appendChild(createIcon("file")) // Add filetype icon
                } else {
                    summaryCover.appendChild(createIcon("image")) // Add filetype icon
                }
                thumbnailContainer.addEventListener("click", function(event) {
                    openFile(event.currentTarget) // Why did no one tell me about event.currentTarget before????
                }, false)
                thumbnailContainer.setAttribute("data-filename", element.filename) // Set Filename, used for opening in new tab
                containerChild.setAttribute("loading", "lazy") // Use lazy loading where possible
                containerChild.src = `thumbs/${element.thumbnail}` // Set img.src for the thumbnail
                break;
            case "opus":
                summaryCover.appendChild(createIcon("music")) // Add filetype icon              

                thumbnailContainer.setAttribute("data-filename", element.filename) // Set Filename, used for opening in new tab
                
                var soundContainer = document.createElement("audio")
                soundContainer.preload = "metadata"
                // soundContainer.classList.add("thumbnail-container__video")
                var soundSource = document.createElement("source")
                soundSource.type = "audio/ogg"
                soundSource.src = `thumbs/${element.thumbnail}`

                var progressBar = document.createElement("div")
                progressBar.classList.add("audio-progress")

                // add fancy audioplayer
                soundContainer.addEventListener('timeupdate', function(e) {
                    console.log(this.currentTime)
                    console.log(this.duration)
                    // Interestingly enough, Chrome doesn't support percentages for transform scaleX, so we'll divide the percentages by 100
                    var progression = ((100 / this.duration) * this.currentTime) / 100
                    progressBar.setAttribute("style", "transform: scaleX(" + progression + ");")
                    console.log(progression)
                }, false)
                thumbnailContainer.addEventListener("click", function(event) { // Toggle playstate
                    toggleMusic(event.currentTarget) // Why did no one tell me about event.currentTarget before????
                }, false)
                var iconBG = document.createElement("i") // Sets background of music player to music icon
                iconBG.setAttribute("data-feather", "play")
                iconBG.classList.add("thumbnailicon-bg")
                thumbnailContainer.appendChild(progressBar)
                thumbnailContainer.appendChild(iconBG)
                soundContainer.appendChild(soundSource)
                thumbnailContainer.prepend(soundContainer)

                break;
            default:
                summaryCover.appendChild(createIcon("file")) // Add filetype icon

                thumbnailContainer.addEventListener("click", function(event) {
                    openFile(event.currentTarget) // Why did no one tell me about event.currentTarget before????
                }, false)
                thumbnailContainer.setAttribute("data-filename", element.filename) // Set Filename, used for opening in new tab
        }
    } else {
        summaryCover.appendChild(createIcon("file")) // Add filetype icon

        thumbnailContainer.addEventListener("click", function(event) {
            openFile(event.currentTarget) // Why did no one tell me about event.currentTarget before????
        }, false)
        thumbnailContainer.setAttribute("data-filename", element.filename) // Set Filename, used for opening in new tab
    }



    // thumbnailContainer.addEventListener("click", handleThumbnailClick, false)
    
    // add buttons to summarycover
    buttonWrapper.appendChild(createDeleteButton(element.deletionkey))
    buttonWrapper.appendChild(createShareButton(element.filename))
    buttonWrapper.appendChild(createDownloadButton(element.filename))

    summaryCover.appendChild(buttonWrapper)

    if (containerChild.src == "") { // Hide image container if src is empty, prevents weird border
        containerChild.style.display = "none"
    }


    thumbnailContainer.appendChild(containerChild)
    thumbnailContainer.appendChild(summaryCover)
    gridElement.appendChild(thumbnailContainer)
}

function openFile(elem) {
    console.log(elem.dataset.filename)
    window.open('/u/' + elem.dataset.filename, '_blank')
}

function toggleVideo(elem) {
    console.log(elem)
    if (elem.firstChild.paused) {
        elem.firstChild.play()
    } else {
        elem.firstChild.pause()
    }
}

function toggleMusic(elem) {
    console.log(elem)
    if (elem.firstChild.paused) {
        elem.firstChild.play()
    } else {
        elem.firstChild.pause()
    }
}

function createDownloadButton(filename) {
    var dlButton = document.createElement("a")
    dlButton.classList.add("summary-action")

    // Download attribute
    dlButton.setAttribute("download", filename)
    dlButton.setAttribute("href", '/u/' + filename)

    var icon = document.createElement("i")
    icon.setAttribute("data-feather", "download-cloud")
    dlButton.appendChild(icon)
    dlButton.addEventListener("click", function(event) {
        event.stopImmediatePropagation() // prevent Parent element click event being triggered
    }, false)
    return dlButton
}

function createShareButton(filename) {
    var shareButton = document.createElement("button")
    shareButton.classList.add("summary-action")
    var icon = document.createElement("i")
    icon.setAttribute("data-feather", "share-2")
    shareButton.appendChild(icon)
    shareButton.addEventListener("click", function(event) {
        event.stopImmediatePropagation() // prevent Parent element click event being triggered
        console.log(event.currentTarget)
        this.disable = true
        var summaryCover = event.currentTarget.parentNode.parentNode
        var fullURL = location.protocol + '//' + location.hostname + (location.port ? ':' + location.port : '') + '/u/' + filename
        navigator.clipboard.writeText(fullURL).then(() => {
            console.log("Copied URL to clipboard")
            summaryCover.classList.add("clipboard-copied")
            setTimeout(() => {
                summaryCover.classList.remove("clipboard-copied")
                this.disable = false
            }, 5000)
        }, () => {
            console.log("Failed to copy URL to clipboard")
        })
    }, false)
    return shareButton
}

function createDeleteButton(deletionkey) {
    var deleteButton = document.createElement("a")
    deleteButton.classList.add("summary-action")
    var icon = document.createElement("i")
    icon.setAttribute("data-feather", "trash")
    deleteButton.appendChild(icon)
    deleteButton.addEventListener("click", function(event) {
        event.stopImmediatePropagation() // prevent Parent element click event being triggered
        window.open("/delete/" + deletionkey, '_blank')
    }, false)
    return deleteButton
}

function createIcon(iconName) {
    var iconContainer = document.createElement("div")
    iconContainer.classList.add("icon-container")
    var icon = document.createElement("i")
    icon.setAttribute("data-feather", iconName)
    iconContainer.style.pointerEvents = "none"
    iconContainer.appendChild(icon)
    return iconContainer
}

function initComponents() {
    document.querySelector(".generate-sharex-config").addEventListener("click", generateShareXConfig, false) // Generate sharex config file
}