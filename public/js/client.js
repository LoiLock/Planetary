import { humanDate } from './clientutils.js'

window.onload = function() {
    getUploads() // Get uploads on dashboard load
}


async function getUploads() {
    var gridElement = document.querySelector(".dashboard__content")
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
    var containerChild = document.createElement("div") // Element which has the thumbnail as background image or video or audio

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
        switch(fileExt) {
            case "mp4": // ? Create video player
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
                thumbnailContainer.addEventListener("click", function(event) {
                    openFile(event.currentTarget) // Why did no one tell me about event.currentTarget before????
                }, false)
                thumbnailContainer.setAttribute("data-filename", element.filename) // Set Filename, used for opening in new tab
                containerChild.style.backgroundImage = `url('thumbs/${element.thumbnail}')`
                break;
            default:
                thumbnailContainer.addEventListener("click", function(event) {
                    openFile(event.currentTarget) // Why did no one tell me about event.currentTarget before????
                }, false)
                thumbnailContainer.setAttribute("data-filename", element.filename) // Set Filename, used for opening in new tab
        }
    }



    // thumbnailContainer.addEventListener("click", handleThumbnailClick, false)

    // add buttons to summarycover
    buttonWrapper.appendChild(createShareButton(element.filename))
    buttonWrapper.appendChild(createDownloadButton(element.filename))
    summaryCover.appendChild(buttonWrapper)

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