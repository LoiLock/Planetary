// ? Here we handle server-sent-events and notifications for new uploads

import { showNotification, refreshDashboardContent, changeOnlineCheck } from './clientutils.js'
export var isOnline = false
export function initSSE() {
    console.info("Attempting to connect")
    isOnline = false
    changeOnlineCheck()
    const eventSource = new EventSource("/events", {
        withCredentials: true
    }) // Send credentials (JWT cookie)

    eventSource.onmessage = ((event) => {
        gotActivity()
        handleEvent(event)
    })
    eventSource.onopen = (() => {
        gotActivity()
        console.info("Connected to server")
    })
    eventSource.onerror = (() => {
        isOnline = false
        changeOnlineCheck()
        console.warn("Lost connection to server")
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
            refreshDashboardContent()
            break;
    }
}

var keepaliveSecs = 20;
var keepaliveTimer = null;

function gotActivity() { // If we've received something in the last 20 seconds, clear timeout, and check again in 20 seconds. If not, reconnect
    if (keepaliveTimer != null) {
        isOnline = true
        changeOnlineCheck()
        clearTimeout(keepaliveTimer);
    }
    keepaliveTimer = setTimeout(initSSE,keepaliveSecs * 1000);
}