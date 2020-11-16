var database = require("../middleware/database")
var config = require("../config.json")


module.exports = {
    handleDashboard: async function(req, res) {
        res.render("dashboard.html", { // req.user comes from the auth middleware
            user: req.user,
            page: {
                title: `Dashboard - ${config.siteName}`,
                description: `Manage your uploads`
            },
            jsPath: process.env.NODE_ENV == "production" ? "js/dist/dist.js" : "js/client.js"
        })
    },
    // ? Get all uploads for user
    getUploads: async function(req, res) { // Uses signed JWT req.user object to query the uploads table for his username
        var username = req.user.username
        username = username.toLowerCase()
        try {
            var uploads = await database.getUploads(username)
            // console.log(uploads)
            return res.send(uploads)
        } catch (error) {
            return res.send('Something went wrong') // TODO: Handle error on the client side
        }
    }
}