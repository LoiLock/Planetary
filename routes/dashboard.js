var database = require("../middleware/database")


module.exports = {
    handleDashboard: async function(req, res) {
        res.render("dashboard.html", {user: req.user})
    },
    getUploads: async function(req, res) { // Uses signed JWT req.user object to query the uploads table for his username
        var username = req.user.username
        username = username.toLowerCase()
        try {
            var uploads = await database.getUploads(username)
            return res.send(uploads)
        } catch (error) {
            return res.send('Something went wrong') // TODO: Handle error on the client side
        }
    }
}