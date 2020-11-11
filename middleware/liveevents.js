const fileUpload = require("express-fileupload")

var clients = [] // Create list of all clients currently listening to SSE

module.exports = {
    handleEvent: async function(req, res) { // Every x seconds the server checks if there's new uploads
        console.log(req.user)
        var headers = {
            'Content-Type': 'text/event-stream',
            'Connection': 'keep-alive',
            'Cache-Control': 'no-cache'
        }
        res.writeHead(200, headers) // Send back headers to client

        const clientID = Date.now() // set unique id SSE client to current unixtime in MS
        const username = req.user.username // set clients username

        const newClient = {
            id: clientID,
            username,
            res // add response object to clients array, so that we can at any moment call clients['username'].write(data: "MESSAGE OR OBJECT HERE"\n\n) to send a message to a specific user
        }
        clients.push(newClient)
        console.log(`${newClient.id} - ${newClient.username}, is listening for server-sent-events`)

        newClient.res.write(`data: ${JSON.stringify({ // ? Send a push to client when he first connects
            type: "poll",
            message: ""
        })}\n\n`)

        req.on("close", () => {
            console.log(`${clientID} - ${username} disconnected`)


            clients = clients.filter(c => { // remove all clients with the same clientID as the client that just disconnected
                return c.id !== clientID
            })
        })
    },
    sendEvent
}
setInterval(() => { // send message every 10 seconds to prevent timeout
    clients.forEach(c => {
        c.res.write(`data: ${JSON.stringify({
            type: "poll",
            message: ""
        })}\n\n`)
    })
}, 10000);

async function sendEvent(type, username, message) { // ? Sends SSE to every client with matching username
    if (clients.some(c => c.username === username)) { // If if clients array contains client.username that matches the username
        var userClients = clients.filter(c => c.username === username)
        userClients.forEach(c => { // If user is logged in on multiple devices, loop over botch connections and send the SSE
            c.res.write(`data: ${JSON.stringify({
                type: type,
                message: message || ""
            })}\n\n`)
        })
        return true
    }
    console.log(`${username} isn't connected/listening`) // The user/client for which the SSE was meant is not online
    return false
}