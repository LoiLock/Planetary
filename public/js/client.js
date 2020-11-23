import { humanDate, generateShareXConfig, logout, TIME } from './clientutils.js'
import { initSSE } from './handleevents.js'

var currentDirectoryPath = window.location.pathname.replace("/dashboard", "") // "" == root. Used to get the files and directories/folders of the currently open album
var isInEditor = false // Used to check if click events
window.onload = async function() {
    console.log(currentDirectoryPath)
    initComponents() // Add event listeners to buttons and such
    initSSE()
}

window.addEventListener('DOMContentLoaded', (event) => {
    console.log(window.location.pathname)
    if(window.location.pathname == "/dashboard") { // Only load ALL uploads if we're at the root of the dashboard
        getUploads()
    } else if (window.location.pathname.startsWith("/dashboard/")) { // If dashboard has subpages (e.g. /videos/movies, etc etc) > don't load the dashboard. Load the album with that pathname
        addAlbumEntries()
    }
    document.body.classList.remove("preload") // Prevent any transitions firing on page load
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
    updateFileCount()
    addAlbumEntries()
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
                videoSource.src = `/thumbs/${element.thumbnail}`
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
                containerChild.src = `/thumbs/${element.thumbnail}` // Set img.src for the thumbnail
                break;
            case "opus":
                summaryCover.classList.add("type", "type__sound")

                thumbnailContainer.setAttribute("data-filename", element.filename) // Set Filename, used for opening in new tab
                
                var soundContainer = document.createElement("audio")
                soundContainer.preload = "metadata"
                // soundContainer.classList.add("thumbnail-container__video")
                var soundSource = document.createElement("source")
                soundSource.type = "audio/ogg"
                soundSource.src = `/thumbs/${element.thumbnail}`

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
    document.querySelector(".add-directory").addEventListener("click", createDirectory, false)
    document.querySelector(".submit-deletion").addEventListener("click", submitDeleteSelection, false)
    document.querySelector(".add-selected-to-directory").addEventListener("click", addFilesToDirectory, false)
    document.querySelector(".remove-selected-from-directory").addEventListener("click", removeFilesFromDirectory, false)
    
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
        var selectedDirectories = document.querySelectorAll(".directory-container.selected")
        for(var i = 0; i < selectedThumbs.length; i++) {
            selectedThumbs[i].classList.remove("selected")
        }
        for(var i = 0; i < selectedDirectories.length; i++) {
            selectedDirectories[i].classList.remove("selected")
        }
    }
}

function selectThumbnailContainer(e) { // ? If isInEditor, then stop other (click) events on the thumbnail-containers, this way
    if (!isInEditor) { return }
    e.stopImmediatePropagation()
    if (e.currentTarget.classList.contains("directory-container")) { // If selected container is a directory, unselect all other directory-containers
        const directoryContainers = document.querySelectorAll(".directory-container.selected")
        directoryContainers.forEach((singleContainer) => {
            singleContainer.classList.remove("selected")
        })
    }
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


async function askStringInput(data, validator) { // Popup that returns a string and also takes a validator function
    removeAllElementsByQuery(".popup-container")

    // Headers
    var popupContainer = document.createElement("div")
    popupContainer.classList.add("popup-container")

    var popupHeader = document.createElement("h2")
    popupHeader.classList.add("popup-container__header")

    var popupText = document.createTextNode(data.message)
    popupHeader.appendChild(popupText)
    // End headers

    const textInput = document.createElement("input")
    textInput.setAttribute("type", "text")
    

    // Buttons
    var confirmBtn = document.createElement("button")
    confirmBtn.classList.add("confirm-btn")
    var cancelBtn = document.createElement("button")
    cancelBtn.classList.add("cancel-btn")

    var confirmText = document.createTextNode("Confirm")
    var cancelText = document.createTextNode("Cancel")
    confirmBtn.appendChild(confirmText)
    cancelBtn.appendChild(cancelText)
    
    confirmBtn.setAttribute("disabled", "")

    confirmBtn.classList.add("confirm-action")
    cancelBtn.classList.add("btn-secondary")
    // End buttons

    popupContainer.appendChild(popupHeader)
    popupContainer.appendChild(textInput)
    popupContainer.appendChild(confirmBtn)
    popupContainer.appendChild(cancelBtn)
    document.body.appendChild(popupContainer)

    if(validator) { // If a validator function has been specified, use it
        textInput.addEventListener("input", (e) => {
            if (validateAlbumName(e.currentTarget.value)) {
                confirmBtn.removeAttribute("disabled")
                e.currentTarget.style.color = "var(--fg-color-text)"
            } else {
                confirmBtn.setAttribute("disabled", "")
                e.currentTarget.style.color = "var(--color-medium-red)"
            }
        }, false)
    }

    return new Promise((resolve, reject) => {
        confirmBtn.addEventListener("click", function() {
            popupContainer.remove()
            resolve(textInput.value)
        }, false)
        cancelBtn.addEventListener("click", function() {
            popupContainer.remove()
            reject(undefined)
        }, false)
    })
}


function removeAllElementsByQuery(query) { // Used to remove any .popup-container's that are still open
    document.querySelectorAll(query).forEach(elem => elem.remove())
}


function validateAlbumName(inputStr) { // Check if album name matches only alphanumeric characters and no spaces
    if (inputStr.match(/^[a-z0-9]+$/i) && inputStr.length <= 14) { // Validate user input and change the input color
        return true
    } else {
        return false
    }
}

async function createDirectory() { // onclick handler to create new directory
    try {
        const directoryName = await askStringInput({
            message: "Name of the folder?"
        }, validateAlbumName)
        console.log(directoryName)

        const response = await fetch("/albums/add", {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                insertIntoPath: window.location.pathname.replace("/dashboard", ""), // Add the directory to this path
                directoryName
            })
        })
        const data = await response.json()
        if(data.success) {
            document.querySelector(".dashboard__content").prepend(directoryContainer({
                name: directoryName
            }))
        } else {
            alert("Didn't add directory, already exists?")
        }
    } catch (error) {
        // User cancelled creating of directory
    }
}

async function addAlbumEntries() { // Make get albums from pathname
    try {
        const response = await fetch("/albums/get", {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                path: currentDirectoryPath
            })
        })
        const data = await response.json()
        console.log(data) // Current directory that we're browsing
        console.log(data.children) // The items that need to be added to the dashboard


        const gridFragment = document.createDocumentFragment()
        var gridElement = document.querySelector(".dashboard__content")
        for (let singleAlbumEntry of data.children) {
            if(singleAlbumEntry.type != "file"){
                continue;
            }
            console.log(singleAlbumEntry)
            singleAlbumEntry.filename = singleAlbumEntry.name
            gridFragment.prepend(thumbnailContainer(singleAlbumEntry))
        }
        for (let singleAlbumEntry of data.children) {
            if(singleAlbumEntry.type != "folder") continue;
            singleAlbumEntry.filename = singleAlbumEntry.name
            gridFragment.prepend(directoryContainer(singleAlbumEntry))
        }
        gridElement.prepend(gridFragment)
    } catch (error) {
        console.log(error)
    }
}

// Creates directory "thumbnail" card for album directories
function directoryContainer(folderInfo) {
    const directoryCard = document.createElement("div") // Different style of .thumbnail-container
    directoryCard.addEventListener("click", (event) => { selectThumbnailContainer(event) }, false) // first event listener will be the one for the editor, so that it can stop immediate propagation if isInEditor equals true

    const directoryInfoCover = document.createElement("div") // Shows filecount, etc
    directoryCard.classList.add("directory-container")
    directoryInfoCover.classList.add("directory-container__cover")

    directoryCard.setAttribute("data-name", folderInfo.name)

    const infoHeader = document.createElement("h3")
    const infoHeaderText = document.createTextNode(folderInfo.name)
    infoHeader.appendChild(infoHeaderText)

    // const fileCount = folderInfo.children.length
    const fileCount = 0
    const fileCountTag = document.createElement("span")
    fileCountTag.appendChild(document.createTextNode(fileCount))

    directoryInfoCover.appendChild(infoHeader)
    directoryInfoCover.appendChild(fileCountTag)

    directoryCard.appendChild(directoryInfoCover)

    directoryCard.addEventListener("click", (e) => {
        console.log(folderInfo.path)
        if (folderInfo.path == "/") { // If at root don't include /, prevents /dashboard//videos (double slash)
            openDirectory(folderInfo.path + folderInfo.name)
            return
        }
        openDirectory(folderInfo.path + "/" + folderInfo.name)
    }, false)

    return directoryCard
}

function openDirectory(path) { // Adds thumbnail and directory cards to the dashboard by the current album path
    clearDashboard()
    currentDirectoryPath = path
    addAlbumEntries()
    console.log(path)
    window.history.pushState({ path }, "Planetary - Dashboard", `/dashboard${path}`) // (add path as state object so we can go back to that page in the browsers history)
    console.log("openDirectory reports currentDirectoryPath:", currentDirectoryPath)
}

async function addFilesToDirectory() { // Get all the selected directories and files, add the files to all the directories selected
    const fileList = []
    const selectedDirectory = document.querySelector(".directory-container.selected")
    const selectedThumbs = document.querySelectorAll(".thumbnail-container.selected")
    for (const selectedThumb of selectedThumbs) {
        fileList.push(selectedThumb.getAttribute("data-filename"))
    }

    const response = await fetch("/albums/addfiles", {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            files: fileList,
            insertIntoPath: window.location.pathname.replace("/dashboard", ""), // Add the directory to this path
            dirname: selectedDirectory.getAttribute("data-name")
        })
    })
    const data = await response.json()
}

async function removeFilesFromDirectory() { // Get all the selected directories and files, add the files to all the directories selected
    const fileList = []
    const selectedThumbs = document.querySelectorAll(".thumbnail-container.selected")
    const selectedDirectory = document.querySelector(".directory-container.selected")
    for (const selectedThumb of selectedThumbs) {
        fileList.push(selectedThumb.getAttribute("data-filename"))
    }
    if (!selectedDirectory) {
        const response = await fetch("/albums/removefiles", {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                files: fileList,
                insertIntoPath: window.location.pathname.replace("/dashboard", ""), // Add the directory to this path
            })
        })
        const data = await response.json()
        if (data.success) {
            removeSelected()
        }
        return
    }
    // Remove selected directory
    const response = await fetch("/albums/remove", {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            currentPath: window.location.pathname.replace("/dashboard", ""),
            selectedPath: window.location.pathname.replace("/dashboard", "") + "/" + selectedDirectory.getAttribute("data-name"), // Add the directory to this path
        })
    })
    const data = await response.json()
    if (data.success) {
        removeSelected()
    }
    return
}

function removeSelected() {
    const selectedThumbs = document.querySelectorAll(".thumbnail-container.selected")
    const selectedDirs = document.querySelectorAll(".directory-container.selected")
    for(const selectedThumb of selectedThumbs) {
        selectedThumb.remove()
    }
    for(const selectedDir of selectedDirs) {
        selectedDir.remove()
    }
}

function openDirectoryFromBar() { // onclick event handler for small directory bar
    console.log(this)
}

function clearDashboard() { // Removes all thumbnails (including directories) from the dashboard__content
    document.querySelector(".dashboard__content").innerHTML = ""
}

window.addEventListener("popstate", (event) => { 
    // If the user presses back or forwards we update the dashboard accordingly
    if(window.location.pathname == "/dashboard") { // If url == /dashboard
        clearDashboard()
        currentDirectoryPath = ""
        previousUploads = [] // Remove previous uploads to completely refresh the dashboard
        getUploads()
    } else {
        clearDashboard()
        currentDirectoryPath = event.state.path
        console.log({currentDirectoryPath})
        addAlbumEntries()
    }
    console.log("onpopstate reports currenDirectoryPath:", currentDirectoryPath)
})


async function addSelectedToAlbum() { // Gets a list of all the files (array of their deletionkeys) selected, and submit array with deletionkeys to album with slug
    const selectedThumbs = document.querySelectorAll(".thumbnail-container.selected")
    const albumslug = document.querySelector(".editor-controls__album-select").value
    let fileList = []
    for (const selectedThumb of selectedThumbs) {
        fileList.push(selectedThumb.getAttribute("data-deletionkey"))
    }

    const response = await fetch("/albums/addfiles", { // Submit selected album and filelist
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            slug: albumslug,
            filelist: fileList
        })
    })
    let data = await response
    console.log(await data.json())
}

async function removeSelectedFromAlbum() { // removes selected files from album
    const selectedThumbs = document.querySelectorAll(".thumbnail-container.selected")
    const albumslug = document.querySelector(".editor-controls__album-select").value
    let fileList = []
    for (const selectedThumb of selectedThumbs) {
        fileList.push(selectedThumb.getAttribute("data-deletionkey"))
    }

    const response = await fetch("/albums/removefiles", { // Submit selected album and filelist
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            slug: albumslug,
            filelist: fileList
        })
    })
    let data = await response
    console.log(await data.json())
    for (const selectedThumb of selectedThumbs) {
        selectedThumb.style.display = 'none'
    }
}


// ? Gets files that belong to selected album, filters out the files that don't belong and hide them
async function albumFilterFiles(e) {
    showAllThumbnails()
    if(e.target.value == "") {
        updateFileCount()
        return;
    }

    const selectedAlbumSlug = e.target.value
    const response = await fetch(`/albums/list/${selectedAlbumSlug}`, {
        credentials: 'include'
    })
    let data = await response.json()
    console.log(data)
    if(data && data.success && data.deletionkeys) {
        const albumDeletionKeys = data.deletionkeys.split(",") // Csv array from server
        updateFileCount(albumDeletionKeys.length)
        const filteredContainers = new Map()

        const thumbnailContainers = document.querySelectorAll('.thumbnail-container') // All the thumbnail containers on the page
        for (const thumbnailContainer of thumbnailContainers) { // Every thumbnail that has a deletionkey that's in the album csv array, add to Map()
            const thumbnailDeletionKey = thumbnailContainer.getAttribute("data-deletionkey")
            // console.log(thumbnailDeletionKey)

            // Get index of where in the album csv array the current thumbnail is added
            let albumIndex = albumDeletionKeys.findIndex((key) => {
                return key == thumbnailDeletionKey
            }) 
            if (albumIndex != -1) { // Map thumbnailContainer element to their respective index in the album csv array (To keep added to album order)
                filteredContainers.set(albumIndex, thumbnailContainer)
            }

            // console.log(albumIndex)
            // console.log(thumbnailContainer)
        }
        // console.log(filteredContainers)
        // for (const singleEntry of filteredContainers.entries()) { // For of allows looping over Iterator object that .entries() returns
        //     console.log(singleEntry) // e.g.: [ 2, div.thumbnail-container ]
        // }

        // Every Map entry now looks like: Array [ 2, div.thumbnail-container ], an array with the key and value
        // Compare the index of the current entry (a) to the index of the next entry (b) in the filteredContainers.entries() array. e.g.:
        // return [ 2, div.thumbnail-container ] (has index 2) > [ 3, div.thumbnail-container ] (has index 3) // returns false
        const sortedMap = new Map([...filteredContainers.entries()].sort((a, b) => {
            return a[0] > b[0]
        }))

        const gridContent = document.querySelector(".dashboard__content")
        const tempFragment = document.createDocumentFragment()
        for (const singleThumbnail of thumbnailContainers) {
            if (![...sortedMap.values()].includes(singleThumbnail)) { // If a thumbnail is not in the sortedmap, hide it
                singleThumbnail.style.display = 'none'
            }
        }
        for (const albumEntry of sortedMap.values()) {
            tempFragment.prepend(albumEntry)
        }
        gridContent.appendChild(tempFragment)
    } else {
        hideAllThumbnails()
        updateFileCount(0)
    }
}

// Show all the thumbnails again (Style hide the deleted ones)
function showAllThumbnails() {
    const thumbnailContainers = document.querySelectorAll('.thumbnail-container:not([data-isdeleted="true"])')
    thumbnailContainers.forEach(singleThumbnail => {
        singleThumbnail.style.display = 'block'
    })
}

function hideAllThumbnails() {
    const thumbnailContainers = document.querySelectorAll('.thumbnail-container:not([data-isdeleted="true"])')
    thumbnailContainers.forEach(singleThumbnail => {
        singleThumbnail.style.display = 'none'
    })
}

// Updates file count label in filter bar
function updateFileCount(size) {
    var fileCount = document.querySelectorAll('.thumbnail-container:not([data-isdeleted="true"])').length
    if(typeof size !== 'undefined') {
        fileCount = size
    }
    const fileCountLabel = document.querySelector(".file-count-label").textContent = `Files: ${fileCount}`
}