// Contains useful conversion functions

import { isOnline, isReconnecting } from './handleevents.js'

export function humanDate(unixTime) { // Takes unixtime in SECONDS and returns string in format: 4 September 2020
    var dateObject = new Date(unixTime * 1000)
    
    var dateString = dateObject.toLocaleString('en-GB', { day: 'numeric', month: 'numeric', year: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric'})
    return dateString
}

export function generateShareXConfig() { // Gets JWT token from localstorage, creates valid sharex profile, downloads it to the browser
    var JWTtoken = getCookieByName("token")
    var userString = atob(JWTtoken.split(".")[1])
    var userObj = JSON.parse(userString)

    var key = userObj.sharextoken
    var domainName = window.location.host
    var protocol = window.location.protocol
    var RequestURL = `${protocol}//${domainName}/upload`
    var sharexConfig = // Define sharex structure
    {
        Name: domainName,
        DestinationType: "ImageUploader, FileUploader",
        RequestType: "POST",
        RequestURL,
        FileFormName: "uploadfile",
        Arguments: {
            type: "file",
            key
        },
        ResponseType: "Text",
        URL: "$json:Url$",
        DeletionURL: "$json:DeletionURL$"
    }

    createTextFile(`${domainName}-${userObj.username}.sxcu`, JSON.stringify(sharexConfig, null, 2)) // Create the config file with pretty-fied json
}

export function getCookieByName(name) { // Get cookie by name
    var documentCookie = document.cookie
    var value = documentCookie.split(`; ${name}=`) // Get part with cookie name
    var parsedValue = value[0].replace(`${name}=`, "") // Remove cookie name and "=" sign and return only the cookie value
    return parsedValue
}


function createTextFile(filename, fileContent) { // Create and save file with content
    // Create temporary element, set data string as href, add download attribute, open this, remove temporary element
    var tempElem = document.createElement("a")
    tempElem.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(fileContent))
    tempElem.setAttribute('download', filename)
    tempElem.style.display = 'none'
    document.body.appendChild(tempElem)
    
    tempElem.click() // Open the download link
    
    document.body.removeChild(tempElem)
}

export function showNotification(title, notifyObj) { // notifyObj contains object with various fields to customize notifications
    if (!("Notification" in window)) {
        // ! Browser does not support notifications;
    }
    // Check if we have the permission to send notifications
    else if (Notification.permission === "granted") {
        // We have permission, send notification
        var notification = new Notification(title, notifyObj);
    }
    // No permission to send notifications, ask permission
    else if (Notification.permission !== "denied") {
        Notification.requestPermission().then(function (permission) {
            // We have permission, send notification
            if (permission === "granted") {
                var notification = new Notification(title, notifyObj);
            }
        });
    }
}
export function changeOnlineCheck() { // Show the user if we're online or not
    if (isReconnecting && !isOnline) {
        document.querySelector(".is-online-check").classList.add("reconnecting")
        document.querySelector(".is-online-check").classList.remove("online")
    } else {
        document.querySelector(".is-online-check").classList.remove("reconnecting")
        var checkValue = document.querySelector(".is-online-check").classList.contains("online")
        if (checkValue != isOnline) { // Only update DOM if the value is actually different
            if (isOnline) {
                document.querySelector(".is-online-check").classList.add("online")
            } else {
                document.querySelector(".is-online-check").classList.remove("online")
            }
        }
    }
    setTimeout(() => {
        changeOnlineCheck()
    }, 5 * TIME.SECONDS);
}

export function logout() { // Just remove the token cookie
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC;"
    window.location.reload()
}


export const TIME = {
    SECONDS: 1000,
    MINUTES: 60 * 1000,
    HOUR: 60 * 60 * 1000
}