var Upload = require("./routes/upload")
var Delete = require("./routes/delete")
var Login = require("./routes/login")
var Dashboard = require("./routes/dashboard")
var Admin = require("./routes/admin")
var Auth =  require("./middleware/auth")
var { latestSiteInfo } =  require("./middleware/tasks")
const auth = require("./middleware/auth")
const LiveEvents = require("./middleware/liveevents")
var { getIP } = require("./middleware/utils")
var config = require("./config.json")

var Albums = require("./routes/albums")
const { ratelimit } = require("./middleware/ratelimit")

// var { ratelimit } = require("./middleware/ratelimit")

module.exports = function(app) {
    app.get("/", (req, res) => {
        res.render("index.html", {
            page: {
                title: config.siteName,
                description: config.siteDescription
            }
        })
    })

    app.get("/info", (req, res) => {
        return res.json(latestSiteInfo())
    })
    
    app.get("/login", Auth.isTokenValid, Login.renderLoginPage)
    app.post("/login", ratelimit, Auth.loginUser)


    app.get("/register", (req, res) => {
        res.render("register.html", {
            page: {
                title: `Registration - ${config.siteName}`,
                description: `Create a new account`
            }
        })
    })
    
    // ? User registers using username and password, check if user already exists, password gets hashed using argon2id. Gets stored in sqlite,
    app.post("/register", ratelimit, Auth.registerUser)

    app.post("/upload", Upload.handleUpload)
    
    // Handle sending of deletion page and confirmation page, and actual deletion on post with the right key provided
    app.get("/delete/:deletionkey", Delete.handleDelete)
    app.post("/delete", Delete.handleDeletePOST)

    app.post("/deleteselection", Delete.handleDeleteSelection) // Delete a list of files

    app.get("/dashboard", Auth.isTokenValid, Dashboard.handleDashboard)

    app.use("/albums", Auth.isTokenValid, Albums)

    app.get("/uploads", Auth.isTokenValid, Dashboard.getUploads) // Get uploads if JWT token is valid

    app.get("/events", Auth.isTokenValid, LiveEvents.handleEvent)

    app.get("/admin", Auth.isTokenValid, Admin.handleAdmin)
}