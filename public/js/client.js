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
    return data
}

function addImageToGrid(gridElement, element) { // Creates image element to be added to the image grid, gridElement is the element to which the grid items will be added
    var thumbnailContainer = document.createElement("div") // Container for the actual image grid item
    var containerChild = document.createElement("div") // Element which has the thumbnail as background image or video or audio

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


    // Create video player or use default background image
    if (element.thumbnail && element.thumbnail != "") { // If the file has a thumbnail
        var fileExt = element.thumbnail.split('.').pop()
        fileExt = fileExt.toLowerCase()
        console.log(fileExt)
        switch(fileExt) {
            case "mp4": // ? Create video player
                thumbnailContainer.addEventListener("click", toggleVideo, false)

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
                containerChild.style.backgroundImage = `url('thumbs/${element.thumbnail}')`
                break;
            default:
                thumbnailContainer.setAttribute("data-thumbtype", "file") // Set thumbnail type to image
        }
    }

    // thumbnailContainer.addEventListener("click", handleThumbnailClick, false)

    thumbnailContainer.appendChild(containerChild)
    thumbnailContainer.appendChild(summaryCover)
    gridElement.appendChild(thumbnailContainer)
}

function handleThumbnailClick(elem) { // Toggle play/pause of the video thumbnails
    // console.log(elem)

}

function toggleVideo(elem) {
    if (this.firstChild.paused) {
        this.firstChild.play()
    } else {
        this.firstChild.pause()
    }
}