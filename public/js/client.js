import { humanDate } from './clientutils.js'

window.onload = function() {
    getUploads() // Get uploads on dashboard load
}


async function getUploads() {
    var gridElement = document.querySelector(".dashboard__content")
    var response = await fetch("/uploads")
    let data = await response.json()
    console.log(data)
    data.forEach(element => {
        console.log(element)
        addImageToGrid(gridElement, element)
    });
    return data
}

function addImageToGrid(gridElement, element) { // Creates image element to be added to the image grid, gridElement is the element to which the grid items will be added
    var imageContainer = document.createElement("div") // Container for the actual image grid item
    var containerChild = document.createElement("div") // Element which has the thumbnail as background image

    var summaryCover = document.createElement("div") // This div is a cover for when the user hovers over the image container
    var summaryHeader = document.createElement("h3") // Filename
    var summaryTime = document.createElement("span") // Upload time

    imageContainer.classList.add("image-container")
    summaryCover.classList.add("image-container__summary")
    containerChild.classList.add("image-container__child")

    // Populate summaryCover


    containerChild.style.backgroundImage = `url('u/${element.filename}')`

    imageContainer.appendChild(containerChild)
    imageContainer.appendChild(summaryCover)
    gridElement.appendChild(imageContainer)
}