// ? Here we handle server-sent-events and notifications for new uploads

import { showNotification, changeOnlineCheck } from './clientutils.js'
import { getUploads } from './client.js'

export var isOnline = false
export var isReconnecting = false
export function initSSE() {
    console.info("Attempting to connect")
    isOnline = false
    changeOnlineCheck()
    const eventSource = new EventSource("/events", {
        withCredentials: true
    }) // Send credentials (JWT cookie)
    eventSource.onmessage = ((event) => {
        gotActivity()
        isOnline = true
        changeOnlineCheck()
        handleEvent(event)
    })
    eventSource.onopen = ((event) => {
        gotActivity()
        isOnline = true
        changeOnlineCheck()
        console.info("Connected to server")
    })
    eventSource.onerror = ((event) => {
        eventSource.close()
        isOnline = false
        isReconnecting = true
        changeOnlineCheck() // If we've made a connection before, and will soon be attempting to reconnect again
        console.log(event.target.readyState)
        console.warn("Lost connection to server")
    })
    eventSource.addEventListener("error", function(event) {
        console.log(event)
        console.log(event.target.readyState)
    })
}

function handleEvent(event) {
    var data = JSON.parse(event.data)
    console.log(data)
    switch(data.type) {
        case "poll": // Ignore polls
            break;
        case "message":
            showNotification("Message:", {
                body: data.message
            })
            break;
        case "fileupload":
            showNotification("New file uploaded:", {
                body: data.message
            })
            getUploads()
            break;
    }
}

var keepaliveSecs = 20;
var keepaliveTimer = null;

function gotActivity() { // If we've received something in the last 20 seconds, clear timeout, and check again in 20 seconds. If not, reconnect
    if (keepaliveTimer != null) {
        isOnline = true
        clearTimeout(keepaliveTimer);
    }
    keepaliveTimer = setTimeout(initSSE,keepaliveSecs * 1000);
}