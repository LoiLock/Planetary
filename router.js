var Upload = require("./routes/upload")
var Delete = require("./routes/delete")
var Dashboard = require("./routes/dashboard")
var Auth =  require("./middleware/auth")
const auth = require("./middleware/auth")

module.exports = function(app) {
    app.get("/", (req, res) => {
        res.render("index.html")
    })
    
    app.get("/login", (req, res) => {
        res.render("login.html")
    })
    app.post("/login", Auth.loginUser)


    app.get("/register", (req, res) => {
        res.render("register.html")
    })
    
    // ? User registers using username and password, check if user already exists, password gets hashed using argon2id. Gets stored in sqlite,
    app.post("/register", Auth.registerUser)

    
    app.post("/upload", Upload.handleUpload)
    
    // Handle sending of deletion page and confirmation page, and actual deletion on post with the right key provided
    app.get("/delete/:deletionkey", Delete.handleDelete)
    app.post("/delete", Delete.handleDeletePOST)

    app.get("/dashboard", Auth.isTokenValid, Dashboard.handleDashboard)


    app.get("/uploads", Auth.isTokenValid, Dashboard.getUploads) // Get uploads if JWT token is valid

}