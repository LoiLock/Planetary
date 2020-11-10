// ? Here we handle server-sent-events and notifications for new uploads

import { showNotification, refreshDashboardContent } from './clientutils.js'
var iteration = 0;
export function initSSE() {
    const eventSource = new EventSource("/events", { withCredentials: true }) // Send credentials (JWT cookie)

    eventSource.onmessage = ((event) => {
        // console.log(event)
        handleEvent(event)
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
            iteration++
            console.log(iteration)
            showNotification("New file uploaded:", {
                body: data.message
            })
            refreshDashboardContent()
            break;
    }
}