const express = require("express")
const app = express()
var config = require("./config.json")
const fileUpload = require("express-fileupload")
var cookieParser = require('cookie-parser')
var nunjucks = require("nunjucks")

const { updateSiteInfo } = require("./middleware/tasks")
const database = require("./middleware/database")
const { TIME } = require("./middleware/utils")

// Allows reading json post bodies
app.use(express.json())
app.use(express.urlencoded({extended: true}))
app.use(fileUpload({
    safeFileNames: true, // ? Breaks files with ONLY non-alphanumeric characters, needs further testing
    preserveExtension: 4,
    limits: {
        fileSize: config.fileSizeLimitMB * 1024 * 1024
    },
    abortOnLimit: true,
    useTempFiles : true, // Allows for much larger file uploads and saves ram
    tempFileDir : 'tmp/',
    uploadTimeout: 3 * TIME.MINUTES // Allow receiving data for 3 minutes incase of big uploads
}));

app.use(cookieParser()) // Easy cookie parsing for JWT

const port = process.env.PORT || config.port || 3000

nunjucks.configure('views', {
    autoescape: true,
    express: app
})

app.use(express.static('public'))

// External router
require('./router')(app);

// Initialize database if not created yet:
app.listen(port, async () => {
    console.log(`Planetary started on ${port}`);
    await database.initDB()
    updateSiteInfo()
    // Turn off any logging in production, only show console.info and console.warn
    if (process.env.NODE_ENV && process.env.NODE_ENV.trim().toLowerCase() == "production") {
        console.log = function() {}
        console.error = function() {}
    }
})