var config = require("../config.json")

module.exports = {
    renderLoginPage: function(req, res) {
        res.render("login.html", {
            page: {
                title: `Login - ${config.siteName}`,
                description: `Login to ${config.siteName}`
            }
        })
    }
}