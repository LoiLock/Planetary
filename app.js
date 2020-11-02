const express = require("express")
const app = express()
var config = require("./config.json")
const fileUpload = require("express-fileupload")
var cookieParser = require('cookie-parser')

const database = require("./middleware/database")

// Allows reading json post bodies
app.use(express.json())
app.use(express.urlencoded({extended: true}))
app.use(fileUpload({
    safeFileNames: true,
    preserveExtension: true,
    limits: {
        fileSize: config.fileSizeLimitMB * 1000
    }
}));

app.use(cookieParser())

var nunjucks = require("nunjucks")
const port = 3000

nunjucks.configure('views', {
    autoescape: true,
    express: app
})

app.use(express.static('public'))

// External router
require('./router')(app);

// Initialize database if not created yet:
database.initDB()

app.listen(port, () => {
    console.log(`Planetary started on ${port}`)
})