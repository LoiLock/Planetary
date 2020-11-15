const { getIP } = require("./utils")

var connectedClients = new Map() // Map with ["Client IP", "first connection timestamp", "connection count"]
var rLimit = 10 * 1000
module.exports = {
    ratelimit: async (req, res, next) => {
        var clientIP = getIP(req)
        var timestamp = Date.now()
        var timeNow = Date.now()

        connectedClients.forEach((client, key) => { // remove clients from map that haven't connected in the last 10 seconds
            var hasNewConnections = client.some((tStamp) => { // Remove clients that don't have any connections associated with their IP in the last 10 seconds
                return (tStamp + rLimit) > timeNow
            })
            if(!hasNewConnections) {
                connectedClients.delete(key)
            }
        })

        if (connectedClients.has(clientIP)) {
            var connections = connectedClients.get(clientIP) // Get array with timestamps of all the connections
            connections.push(timestamp)
            newConnections = connections.filter((tStamp) => { // Remove connections older than 10 seconds
                return (tStamp + rLimit) > timeNow
            });
            connectedClients.set(clientIP, newConnections)
            if (newConnections.length > 10) { // Only allow 10 connections, every 10 seconds, per IP
                return res.status(429).send("Too fast")
            }
            next()
        } else { // If it's the first time the client has connected in the last 10 seconds, add him to the map
            connectedClients.set(clientIP, [ Date.now() ])
            next()
        }        
    }
}