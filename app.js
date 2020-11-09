const express = require("express")
const app = express()
var config = require("./config.json")
const fileUpload = require("express-fileupload")
var cookieParser = require('cookie-parser')

var Utils = require("./middleware/utils")
Utils.setCurrentCommitHash()

const database = require("./middleware/database")

// Allows reading json post bodies
app.use(express.json())
app.use(express.urlencoded({extended: true}))
app.use(fileUpload({
    safeFileNames: true,
    preserveExtension: 4,
    limits: {
        fileSize: config.fileSizeLimitMB * 1024 * 1024
    },
    useTempFiles : true, // Allows for much larger file uploads and saves ram
    tempFileDir : 'tmp/'
}));

app.use(cookieParser()) // Easy cookie parsing for JWT

var nunjucks = require("nunjucks")
const utils = require("./middleware/utils")
const port = process.env.PORT || 3000

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
    console.log(`Planetary started on ${port}`);
})