const fileUpload = require("express-fileupload")
const { TIME } = require("./utils")

var clients = [] // Create list of all clients currently listening to SSE
const SSE_HEADERS = {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
}
module.exports = {
    handleEvent: async function(req, res) { // Every x seconds the server checks if there's new uploads
        // console.log(req.user)
        
        res.status(200).set(SSE_HEADERS) // Send back headers to client
        // res.connection.setTimeout(86400 * 1000) // Set timeout to 24 hours
        res.write('retry: 3000\n') // tell client to retry every 10 seconds if connection is lost

        const clientID = Date.now() // set unique id SSE client to current unixtime in MS
        const username = req.user.username // set clients username

        const newClient = {
            id: clientID,
            username,
            res // add response object to clients array, so that we can at any moment call clients['username'].write(data: "MESSAGE OR OBJECT HERE"\n\n) to send a message to a specific user
        }
        clients.push(newClient)
        console.info(`${newClient.id} - ${newClient.username}, is listening for server-sent-events`)

        req.on("close", () => {
            var firstConnStamp = clientID / 1000
            var lastConnStamp = Date.now() / 1000

            console.info(`${clientID} - ${username} disconnected, was connected for ${lastConnStamp - firstConnStamp} seconds`)

            clients = clients.filter(c => { // remove all clients with the same clientID as the client that just disconnected
                return c.id !== clientID
            })
        })
    },
    sendEvent
}
setInterval(() => { // send message every 5 seconds to prevent timeout
    clients.forEach(c => {
        c.res.write(`id: ${Date.now()}\nevent: poll\ndata: ${JSON.stringify({
            message: ""
        })}\n\n`)
    })
}, 5 * TIME.SECONDS);

async function sendEvent(type, username, message) { // ? Sends SSE to every client with matching username
    if (clients.some(c => c.username === username)) { // If if clients array contains client.username that matches the username
        var userClients = clients.filter(c => c.username === username)
        userClients.forEach(c => { // If user is logged in on multiple devices, loop over botch connections and send the SSE
            c.res.write(`id: ${Date.now()}\nevent: ${type}\ndata: ${JSON.stringify({
                message: message || ""
            })}\n\n`)
        })
        return true
    }
    console.info(`${username} isn't connected/listening`) // The user/client for which the SSE was meant is not online
    return false
}