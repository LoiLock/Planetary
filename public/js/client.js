import { humanDate, generateShareXConfig, svgValues } from './clientutils.js'
import { initSSE } from './handleevents.js'

var isInEditor = false // Used to check if click events
window.onload = function() {
    if ('serviceWorker' in navigator) { //register service worker
        navigator.serviceWorker.register('sw.js', {
            scope: '/'
        });
    }
    getUploads() // Get uploads on dashboard load
    initComponents() // Add event listeners to buttons and such
    initSSE()
}

var previousUploads = [] // Empty array to compare against in getUploads
var gridFragment = document.createDocumentFragment() // Use gridfragment to prevent constant repainting
export async function getUploads() {
    console.time("startrequest")
    var gridElement = document.querySelector(".dashboard__content")
    // caches.open('planetary-pwa').then(function(cache) {
        
    // })
    var response = await fetch("/uploads")
    let data = await response.json()

    // data = data.reverse()
    console.log(data)
    console.log(previousUploads)

    // Check which files are actually new (From SSE for example)
    // And only add those files
    console.time("filter")
    var newUploads = data.filter(({deletionkey: value1 }) => { // loop request array and grab deletion key as value1, as function function argument
        return !previousUploads.some(({deletionkey: value2}) => value2 === value1 ) // is the current filtered array entry NOT ANYWHERE in previous uploads
    })
    console.timeEnd("filter")

    previousUploads = data
    console.log(newUploads)
    console.time("populate")


    // ! Create thumbnail grid-item for every item in array
    newUploads.forEach(element => {
        addImageToGrid(element)
    });
    gridElement.prepend(gridFragment) // Consome the gridFragment and append it to the body
    
    console.timeEnd("startrequest")
    console.timeEnd("populate")
    console.log(document.querySelectorAll(".thumbnail-container").length)
    countElements(".dashboard__content")
    countElementsNoSVG(".dashboard__content")
    countElements(".thumbnail-container")
    initFilters() // After everything is loaded, add filters

    console.time("replaceIcons")
    feather.replace() // reload icons
    console.timeEnd("replaceIcons")
    return data
}

function addImageToGrid(element) { // Creates image element to be added to the image grid, gridElement is the element to which the grid items will be added
    console.time("singlecomponent")
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

    thumbnailContainer.addEventListener("click", (event) => {selectThumbnailContainer(event) }, false) // first event listener will be the one for the editor, so that it can stop immediate propagation if isInEditor equals true


    // Create video player or use default background image
    if (element.thumbnail && element.thumbnail != "") { // If the file has a thumbnail
        var fileExt = element.thumbnail.split('.').pop()
        fileExt = fileExt.toLowerCase()
        // console.log(fileExt)
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
    gridFragment.prepend(thumbnailContainer)
}

function openFile(elem) {
    console.log(elem.dataset.filename)
    window.open('/u/' + elem.dataset.filename, '_blank')
}

function toggleVideo(elem) { // Toggles video playback
    console.log(elem)
    if (elem.firstChild.paused) {
        elem.firstChild.play()
    } else {
        elem.firstChild.pause()
    }
}

function toggleMusic(elem) { // Toggles music playback
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
    dlButton.setAttribute("target", "_blank")

    dlButton.innerHTML = feather.icons["download-cloud"].toSvg()

    dlButton.addEventListener("click", function(event) {
        event.stopImmediatePropagation() // prevent Parent element click event being triggered
    }, false)
    return dlButton
}

function createShareButton(filename) {
    var shareButton = document.createElement("button")
    shareButton.classList.add("summary-action")
    shareButton.innerHTML = feather.icons["share-2"].toSvg()
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
    
    deleteButton.innerHTML = svgValues.iconTrash

    deleteButton.addEventListener("click", function(event) {
        event.stopImmediatePropagation() // prevent Parent element click event being triggered
        window.open("/delete/" + deletionkey, '_blank')
    }, false)
    return deleteButton
}

function createIcon(iconName) {
    var iconContainer = document.createElement("div")
    iconContainer.classList.add("icon-container")
    iconContainer.innerHTML = feather.icons[iconName].toSvg()
    iconContainer.style.pointerEvents = "none"
    return iconContainer
}



function toggleColorTheme(e) { // ? Change color theme toggle switch, saves to localstorage
    document.body.classList.toggle("dark")
    e.currentTarget.classList.toggle("dark")
    if(e.currentTarget.classList.contains("dark")) {
        localStorage.setItem("color-theme", "dark")
    } else {
        localStorage.setItem("color-theme", "light")
    }
    console.log(e.currentTarget)
}

function setSavedColorTheme() { // ? Load the currently saved color-theme
    var currentTheme = localStorage.getItem("color-theme")
    if (!currentTheme) { // If localstorage item for theme is empty
        console.log("empty")
        localStorage.setItem("color-theme", "light")
        currentTheme = "light"
    }
    if (currentTheme == "dark") { document.querySelector(".toggle-colortheme").classList.add("dark") } // Make sure the toggle switch is set to the right position onload as well
    document.body.classList.add(currentTheme)
}




// TODO: if applyFilter is called from anywhere else, also automatically set the checkboxes to checked
var applyFilter = { // adds or removes classes based on the boolean "show"
    showFilenames: function(yes) {
        var thumbnailContainers = document.getElementsByClassName("thumbnail-container")
        console.log(thumbnailContainers.length)
        for (var i = 0; i < thumbnailContainers.length; i++) {
            if (yes) {
                thumbnailContainers[i].classList.add("show-info")
            } else {
                thumbnailContainers[i].classList.remove("show-info")
            }
        }
    },
    hideDeleted: function(yes) {
        var deletedContainers = document.querySelectorAll('.thumbnail-container[data-isdeleted="true"]')
        for (var i = 0; i < deletedContainers.length; i++) {
            if(yes) {
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
        console.log(isChecked)
        console.log(filterType)
        if (isChecked && isChecked == "true") {
            console.log(isChecked)
            console.log(filterType)
            applyFilter[filterType](isChecked)
        }
        checkboxElems[i].addEventListener("click", function(e) {
            handleCheckbox(e)
        }, false)
    }
}

function initComponents() { // Add events listeners to components and set other values on body load
    setSavedColorTheme()
    document.querySelector(".generate-sharex-config").addEventListener("click", generateShareXConfig, false) // Generate sharex config file
    document.querySelector(".toggle-colortheme").addEventListener("click", (event) => {toggleColorTheme(event)}, false)
    document.querySelector(".start-editor").addEventListener("click", (event) => { startEditor(event) }, false)
    document.querySelector(".submit-deletion").addEventListener("click", submitDeleteSelection, false)
}



// ? Here we create the dashboard editor, allows selecting multiple files and deleting them, or add them to an album
function startEditor(e) {
    isInEditor = !isInEditor
    console.log(isInEditor)
    var editorControls = document.querySelector(".editor-controls")
    if (isInEditor) {
        e.currentTarget.classList.add("selected")
        editorControls.style.display = "flex"
    } else {
        e.currentTarget.classList.remove("selected")
        editorControls.style.display = "none"
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
            console.log(data)
        }
    })
    .catch((result) => {
        return
    })
}


async function showConfirmation(message) {
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
    console.log("2")


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
    console.log("1")
}

function countElements(parentSelector) {
    var parentElem = document.querySelector(parentSelector)
    // var all = parentElem.getElementsByTagName("*")
    var all = parentElem.querySelectorAll("*")
    console.log(`Elements inside "${parentSelector}": ${all.length}`)
}

function countElementsNoSVG(parentSelector) {
    var parentElem = document.querySelector(parentSelector)
    var all = parentElem.querySelectorAll("*:not(svg)")
    console.log(`Elements inside "${parentSelector}": ${all.length}`)
}