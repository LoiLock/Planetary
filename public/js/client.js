import { humanDate, generateShareXConfig, logout, TIME } from './clientutils.js'
import { initSSE } from './handleevents.js'

var isInEditor = false // Used to check if click events
window.onload = function() {
    initComponents() // Add event listeners to buttons and such
    initSSE()
}

window.addEventListener('DOMContentLoaded', (event) => {
    getUploads()
    document.body.classList.remove("preload") // Prevent any transitions firing on page load
    // getAlbums()
})

var previousUploads = [] // Empty array to compare against in getUploads
export async function getUploads() { // Get all the uploads, compare them to the previous upload array, and only add the new uploads
    var response = await fetch("/uploads")
    var data = await response.json()

    // Check which files are actually new (From SSE for example)
    // And only add the new files to the dom
    var newUploads = data.filter(({deletionkey: value1 }) => { // loop request array and grab deletion key as value1, as function function argument
        return !previousUploads.some(({deletionkey: value2}) => value2 === value1 ) // is the current filtered array entry NOT ANYWHERE in previous uploads
    })
    previousUploads = data

    // Using only the new uploads, append files to gridElement
    var gridFragment = document.createDocumentFragment() // Create temporary document fragment
    newUploads.forEach(element => {
        gridFragment.prepend(thumbnailContainer(element))
    });
    var gridElement = document.querySelector(".dashboard__content")
    gridElement.prepend(gridFragment) // Consume the gridFragment and append it to the body
    
    initFilters() // After everything is loaded, add filters
}

function thumbnailContainer(element) { // Creates image element to be added to the image grid, gridElement is the element to which the grid items will be added
    var thumbnailContainer = document.createElement("div") // Container for the actual image grid item
    var containerChild = document.createElement("img") // background image or video or audio

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

    thumbnailContainer.addEventListener("click", (event) => { selectThumbnailContainer(event) }, false) // first event listener will be the one for the editor, so that it can stop immediate propagation if isInEditor equals true


    // Create video player or use default background image
    if (element.thumbnail && element.thumbnail != "") { // If the file has a thumbnail
        var fileExt = element.thumbnail.split('.').pop()
        fileExt = fileExt.toLowerCase()
        var fullFileExt = element.filename.split('.').pop() // The file extension of the FILE not the thumbnail
        fullFileExt =  fullFileExt.toLowerCase()
        switch(fileExt) { // Add the appropriate icon and child elements to the thumbnailContainer
            case "mp4": // ? Create video player
                summaryCover.classList.add("type", "type__video")

                thumbnailContainer.addEventListener("click", function(event) {
                    toggleVideo(event.currentTarget) // Why did no one tell me about event.currentTarget before????
                }, false)
                thumbnailContainer.setAttribute("data-filename", element.filename) // Set Filename, used for opening in new tab

                var videoContainer = document.createElement("video")
                if(fullFileExt == "gif") {
                    videoContainer.setAttribute("loop", "")
                }
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
                    summaryCover.classList.add("type", "type__file")
                } else {
                    summaryCover.classList.add("type", "type__image")
                }
                thumbnailContainer.addEventListener("click", function(event) {
                    openFile(event.currentTarget) // Why did no one tell me about event.currentTarget before????
                }, false)
                thumbnailContainer.setAttribute("data-filename", element.filename) // Set Filename, used for opening in new tab
                containerChild.setAttribute("loading", "lazy") // Use lazy loading where possible
                containerChild.setAttribute("alt", element.thumbnail) // Use lazy loading where possible
                containerChild.src = `thumbs/${element.thumbnail}` // Set img.src for the thumbnail
                break;
            case "opus":
                summaryCover.classList.add("type", "type__sound")

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
                    // Interestingly enough, Chrome doesn't support percentages for transform scaleX, so we'll divide the percentages by 100
                    var progression = ((100 / this.duration) * this.currentTime) / 100
                    progressBar.setAttribute("style", "transform: scaleX(" + progression + ");")
                }, false)
                thumbnailContainer.addEventListener("click", function(event) { // Toggle playstate
                    toggleMusic(event.currentTarget) // Why did no one tell me about event.currentTarget before????
                }, false)
                var iconBG = document.createElement("i") // Sets background of music player to music icon
                iconBG.classList.add("icon-bg", "icon-bg__sound")
                thumbnailContainer.appendChild(progressBar)
                thumbnailContainer.appendChild(iconBG)
                soundContainer.appendChild(soundSource)
                thumbnailContainer.prepend(soundContainer)

                break;
            default:
                summaryCover.classList.add("type", "type__file")

                thumbnailContainer.addEventListener("click", function(event) {
                    openFile(event.currentTarget) // Why did no one tell me about event.currentTarget before????
                }, false)
                thumbnailContainer.setAttribute("data-filename", element.filename) // Set Filename, used for opening in new tab
        }
    } else {
        summaryCover.classList.add("type", "type__file")


        thumbnailContainer.addEventListener("click", function(event) {
            openFile(event.currentTarget) // Why did no one tell me about event.currentTarget before????
        }, false)
        thumbnailContainer.setAttribute("data-filename", element.filename) // Set Filename, used for opening in new tab
    }
    
    // add buttons to summarycover (delete, share/copy-to-clipboard, download/open-externally)
    buttonWrapper.appendChild(createDeleteButton(element.deletionkey))
    buttonWrapper.appendChild(createShareButton(element.filename))
    buttonWrapper.appendChild(createDownloadButton(element.filename))

    summaryCover.appendChild(buttonWrapper)

    if(element.isdeleted == 1) { // make summary cover slightly red if the file is deleted
        thumbnailContainer.setAttribute("data-isdeleted", true)
        summaryCover.style.backgroundColor = "rgba(153, 30, 38, 0.3)"
    }

    // Set data attributes
    thumbnailContainer.setAttribute("data-deletionkey", element.deletionkey)
    if (!containerChild.src == "") { // Hide image container if src is empty, prevents weird border
        thumbnailContainer.appendChild(containerChild)
        // containerChild.style.display = "none"
    }
    thumbnailContainer.appendChild(summaryCover)
    // fragment.append(thumbnailContainer)
    return thumbnailContainer
}

function openFile(elem) {
    if(isInEditor) return;
    window.open('/u/' + elem.dataset.filename, '_blank')
}

function toggleVideo(elem) { // Toggles video playback
    if(isInEditor) return;
    if (elem.firstChild.paused) {
        elem.firstChild.play()
    } else {
        elem.firstChild.pause()
    }
}

function toggleMusic(elem) { // Toggles music playback
    if(isInEditor) return;
    if (elem.firstChild.paused) {
        elem.firstChild.play()
    } else {
        elem.firstChild.pause()
    }
}

function createDownloadButton(filename) {
    var dlButton = document.createElement("a")
    dlButton.classList.add("icon-btn", "icon-btn__download")

    // Download attribute
    dlButton.setAttribute("download", filename)
    dlButton.setAttribute("href", '/u/' + filename)
    dlButton.setAttribute("target", "_blank")
    dlButton.setAttribute("aria-label", "Download file")

    dlButton.addEventListener("click", function(event) {
        event.stopImmediatePropagation() // prevent Parent element click event being triggered
    }, false)
    return dlButton
}

function createShareButton(filename) { // Creates button that copies the filename to the user's clipboard
    var shareButton = document.createElement("button")
    shareButton.classList.add("icon-btn", "icon-btn__share")
    shareButton.setAttribute("aria-label", "Copy link to file")
    shareButton.addEventListener("click", function(event) {
        event.stopImmediatePropagation() // prevent Parent element click event being triggered
        this.disable = true
        var summaryCover = event.currentTarget.parentNode.parentNode
        var fullURL = location.protocol + '//' + location.hostname + (location.port ? ':' + location.port : '') + '/u/' + filename
        navigator.clipboard.writeText(fullURL).then(() => {
            summaryCover.classList.add("clipboard-copied")
            setTimeout(() => {
                summaryCover.classList.remove("clipboard-copied")
                this.disable = false
            }, 5 * TIME.SECONDS)
        }, () => {
            // ! failed to copy url to clipboard
        })
    }, false)
    return shareButton
}

function createDeleteButton(deletionkey) { // Sends user to deletionpage
    var deleteButton = document.createElement("a")
    deleteButton.classList.add("icon-btn", "icon-btn__delete")
    
    deleteButton.addEventListener("click", function(event) {
        event.stopImmediatePropagation() // prevent Parent element click event being triggered
        window.open("/delete/" + deletionkey, '_blank')
    }, false)
    return deleteButton
}



function toggleColorTheme(e) { // ? Change color theme toggle switch, save to localstorage
    document.body.classList.toggle("dark")
    e.currentTarget.classList.toggle("dark")
    if(e.currentTarget.classList.contains("dark")) {
        localStorage.setItem("color-theme", "dark")
    } else {
        localStorage.setItem("color-theme", "light")
    }
}

function setSavedColorTheme() { // ? Load the currently saved color-theme
    var currentTheme = localStorage.getItem("color-theme")
    if (!currentTheme) { // If localstorage item for theme is empty
        localStorage.setItem("color-theme", "dark")
        currentTheme = "dark"
    }
    if (currentTheme == "dark") { // Make sure the toggle switch is set to the right position onload as well
        document.querySelector(".toggle-colortheme").classList.add("dark")
    } else {
        document.querySelector(".toggle-colortheme").classList.remove("dark")
        document.body.classList.remove("dark")
    }
    document.body.classList.add(currentTheme)
}




var applyFilter = { // adds or removes classes based on the boolean "show"
    showFilenames: function(doAction) {
        var thumbnailContainers = document.getElementsByClassName("thumbnail-container")
        for (var i = 0; i < thumbnailContainers.length; i++) {
            if (doAction) {
                thumbnailContainers[i].classList.add("show-info")
            } else {
                thumbnailContainers[i].classList.remove("show-info")
            }
        }
    },
    hideDeleted: function(doAction) {
        var deletedContainers = document.querySelectorAll('.thumbnail-container[data-isdeleted="true"]')
        for (var i = 0; i < deletedContainers.length; i++) {
            if(doAction) {
                deletedContainers[i].style.display = "none"
            } else {
                deletedContainers[i].style.display = "inline-block"
            }
        }
    }
}

function handleCheckbox(e) { // Fires the correct function if a .toggle-filter updates
    var checkbox = e.currentTarget
    var filtername = checkbox.getAttribute("data-value")
    if (checkbox.getAttribute("data-checked") == "true") {
        checkbox.setAttribute("data-checked", "false")
        applyFilter[filtername](false) // Call function with the same name as the data-value attribute's value
    } else {
        checkbox.setAttribute("data-checked", "true")
        applyFilter[filtername](true)
    }
}

function initFilters() { // adds event listeners to filter values
    var checkboxElems = document.querySelectorAll(".toggle-filter")
    for (var i = 0; i < checkboxElems.length; i++) {
        var isChecked = checkboxElems[i].getAttribute("data-checked")
        var filterType = checkboxElems[i].getAttribute("data-value")
        if (isChecked && isChecked == "true") {
            applyFilter[filterType](isChecked)
        }
    }
}

function initComponents() { // Add events listeners to components and set other values on body load
    setSavedColorTheme()
    document.querySelector(".generate-sharex-config").addEventListener("click", generateShareXConfig, false) // Generate sharex config file
    document.querySelector(".toggle-colortheme").addEventListener("click", (event) => {toggleColorTheme(event)}, false)
    document.querySelector(".start-editor").addEventListener("click", (event) => { startEditor(event) }, false)
    document.querySelector(".submit-deletion").addEventListener("click", submitDeleteSelection, false)
    document.querySelector(".editor-controls__album-select").addEventListener("change", albumSelectionHandler, false)
    document.querySelector(".editor-controls__submit-album").addEventListener("click", submitAlbum, false)
    document.querySelector(".page-header__user__logout").addEventListener("click", logout, false)
    var checkboxElems = document.querySelectorAll(".toggle-filter")
    for (var i = 0; i < checkboxElems.length; i++) {
        checkboxElems[i].addEventListener("click", function(e) {
            handleCheckbox(e)
        }, false)
    }
}



// ? Here we create the dashboard editor, allows selecting multiple files and deleting them, or add them to an album
function startEditor(e) {
    isInEditor = !isInEditor
    var editorControls = document.querySelector(".editor-controls")
    var editorBtn = document.querySelector(".start-editor")
    if (isInEditor) { // Pause all videos and audio players
        editorBtn.classList.add("selected")
        editorControls.style.display = "flex"
        var vidPlayers = document.getElementsByTagName("video")
        var musicPlayers = document.getElementsByTagName("audio")
        for(var i = 0; i < vidPlayers.length; i++) {
            vidPlayers[i].pause()
        }
        for(var x = 0; x < musicPlayers.length; x++) {
            musicPlayers[x].pause()
        }
    } else {
        editorBtn.classList.remove("selected")
        editorControls.style.display = "none"
        var selectedThumbs = document.querySelectorAll(".thumbnail-container.selected")
        for(var i = 0; i < selectedThumbs.length; i++) {
            selectedThumbs[i].classList.remove("selected")
        }
    }
}

function selectThumbnailContainer(e) { // ? If isInEditor, then stop other (click) events on the thumbnail-containers, this way
    if (!isInEditor) { return }
    e.stopImmediatePropagation()

    var thumbnailContainer = e.currentTarget
    thumbnailContainer.classList.toggle("selected")
}

async function submitDeleteSelection() { // Submits selected files as an array of files to be deleted
    showConfirmation("Delete the selected files?")
    .then(async (result) => {
        if (result) {
            removeAllElementsByQuery(".popup-container")
            var fileContainers = document.querySelectorAll(".thumbnail-container.selected")
            var deletionkeys = []
        
            for (let i = 0; i < fileContainers.length; i++) { // Create list with deletionkeys
                var deletionkey = fileContainers[i].getAttribute("data-deletionkey")
                deletionkeys.push(deletionkey)
            }
            if(deletionkeys.length == 0) return
            
            var response = await fetch("/deleteselection", {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    keys: deletionkeys
                })
            })
            var data = await response.json()
            if(data && data.success) { // If deletion was successful
                for (var i = 0; i < fileContainers.length; i++) { // Set attribute and styling of deleted files
                    fileContainers[i].setAttribute("data-isdeleted", "true")
                    fileContainers[i].getElementsByClassName("thumbnail-container__summary")[0].style.backgroundColor = "rgba(153, 30, 38, 0.3)"
                }
                var hideDeletedFiles = document.getElementById("hideDeleted").getAttribute("data-checked")
                if(hideDeletedFiles === "true") { // If hidedeleted is checked
                    applyFilter["hideDeleted"](true)
                }
            }
        }
    })
    .catch((result) => {
        return
    })
}


async function showConfirmation(message) { // Creates confirmation popup for file deletion
    removeAllElementsByQuery(".popup-container")
    var popupContainer = document.createElement("div")
    popupContainer.classList.add("popup-container")

    var popupHeader = document.createElement("h2")
    popupHeader.classList.add("popup-container__header")
    var popupText = document.createTextNode(message)
    popupHeader.appendChild(popupText)

    var confirmBtn = document.createElement("button")
    confirmBtn.classList.add("confirm-btn")
    var cancelBtn = document.createElement("button")
    cancelBtn.classList.add("cancel-btn")

    var confirmText = document.createTextNode("Yes, delete")
    var cancelText = document.createTextNode("No, cancel")

    confirmBtn.appendChild(confirmText)
    cancelBtn.appendChild(cancelText)
    
    confirmBtn.classList.add("btn-danger")
    cancelBtn.classList.add("btn-secondary")

    popupContainer.appendChild(popupHeader)
    popupContainer.appendChild(confirmBtn)
    popupContainer.appendChild(cancelBtn)
    document.body.appendChild(popupContainer)


    var result = new Promise((resolve, reject) => {
        confirmBtn.addEventListener("click", function() {
            resolve(true)
        }, false)
        cancelBtn.addEventListener("click", function() {
            popupContainer.remove()
            reject(false)
        }, false)
    })
    var res = await result
    return res
}

function removeAllElementsByQuery(query) { // Used to remove .popup-container
    document.querySelectorAll(query).forEach(elem => elem.remove())
}

function albumSelectionHandler(e) {
    var albumSelection = e.target
    var selectedOption = albumSelection.value
    var albumNameInput = document.querySelector(".editor-controls__album-name-input")
    albumNameInput.addEventListener("paste", validateAlbumName, false)
    albumNameInput.addEventListener("input", validateAlbumName, false)
    if(selectedOption == "newalbum") {
        albumNameInput.style.display = "block"
    } else {
        albumNameInput.style.display = "none"
    }
}


// ! WIP Not implemented

function validateAlbumName(e) {
    var inputStr = e.target.value
    var submitAlbumBtn = document.querySelector(".editor-controls__submit-album")
    if (inputStr.match(/^[a-z0-9]+$/i) && inputStr.length <= 14) { // Validate user input and change the input color
        submitAlbumBtn.style.display = "block"
        e.target.style.color = "var(--fg-color-text)"
    } else {
        submitAlbumBtn.style.display = "none"
        e.target.style.color = "var(--color-medium-red)"
    }
    if (inputStr.length == 0) {
        e.target.style.color = "var(--fg-color-text)"
    }
}

async function submitAlbum() { // Not implemented yet
    var albumName = document.querySelector(".editor-controls__album-name-input").value

    var response = await fetch("/albums/add", {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-type": "application/json"
        },
        body: JSON.stringify({
            albumname: albumName
        })
    })
    // TODO: show feedback in UI
    var data = await response.json()
    console.log(data)
}



// async function getAlbums() {
//     var response = await fetch("/albums/get", {
//         credentials: "include",
//     })

//     var data = await response.json()
//     console.log(data)
// }