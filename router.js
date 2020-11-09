var Upload = require("./routes/upload")
var Delete = require("./routes/delete")
var Login = require("./routes/login")
var Dashboard = require("./routes/dashboard")
var Auth =  require("./middleware/auth")
var { currentCommitHash } =  require("./middleware/utils")
const auth = require("./middleware/auth")

var Albums = require("./routes/albums")

module.exports = function(app) {
    app.get("/", (req, res) => {
        res.render("index.html", { currentCommitHash: currentCommitHash })
    })
    
    app.get("/login", Auth.isTokenValid, Login.renderLoginPage)
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
    // TODO: Check for JWT (Although not really necessary since the deletionkeys are already secret)
    app.post("/deleteselection", Delete.handleDeleteSelection) // Delete a list of files

    app.get("/dashboard", Auth.isTokenValid, Dashboard.handleDashboard)

    app.use("/albums",Auth.isTokenValid, Albums)

    app.get("/uploads", Auth.isTokenValid, Dashboard.getUploads) // Get uploads if JWT token is valid
}