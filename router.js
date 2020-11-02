var Upload = require("./routes/upload")
var Delete = require("./routes/delete")
var Auth =  require("./middleware/auth")
const auth = require("./middleware/auth")

module.exports = function(app) {
    app.get("/", (req, res) => {
        res.render("index.html")
    })
    
    app.get("/login", (req, res) => {
        res.render("login.html")
    })
    app.get("/register", (req, res) => {
        res.render("register.html")
    })
    
    app.post("/login", Auth.loginUser)

    app.get("/dashboard", Auth.isTokenValid, (req, res) => {
        res.send("test")
    })

    // ? User registers using username and password, check if user already exists, password gets hashed using argon2id. Gets stored in sqlite,
    app.post("/register", Auth.registerUser)

    app.post("/upload", Upload.handleUpload)

    app.get("/delete/:deletionkey", Delete.handleDelete)
    app.post("/delete", Delete.handleDeletePOST)
}