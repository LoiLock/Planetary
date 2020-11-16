// Create a user called "imported", give him a random password and add files to the database under his name
// For every file in public/u/, check if the filename is present in the database, if not add it to the user

// ! This assumes that the files being imported are from a previous ShareX server, the files will NOT get a new name to prevent link-rot
// ? Imported files also do not have thumbnails


const fs = require("fs")
const Utils = require("./middleware/utils")
const sqlite3 = require("sqlite3").verbose()

const db = new sqlite3.Database("db/planetary.db", (err) => {
    if(err) {
        return reject(err)
    }
    console.log("Connected to the database")
    main()
})

var colors = {
    reset: function() {
        console.log("\x1b[0m")
    },
    resetStr: "\x1b[0m",
    underline: function() {
        console.log("\x1b[4m")
    },
    bright: function() {
        console.log("\x1b[1m")
    },
    red: function() {
        console.log("\x1b[31m")
    },
    redStr: "\x1b[31m",
    green: function() {
        console.log("\x1b[32m")
    },
    greenStr: "\x1b[32m",
    blue: function() {
        console.log("\x1b[34m")
    },
    blueStr: "\x1b[34m"
}

var unimported = [] // Array of filenames that are not in the database yet
var failedImports = [] // Object array with files that failed to import and the checks that they failed
const TWIDTH = process.stdout.columns // Width of terminal in characters
async function startImport() {
    var totalFileCount = unimported.length // Amount of unimported files, (with valid filename or not)
    var completedImporting = 0
    db.serialize(() => {
        db.exec("BEGIN"); // Start transaction
        unimported.forEach((filename) =>  {
            // Create values for fields in uploads table
            let deletionKey = Utils.rndString(32)
            let currentUnixTime = Math.round(Date.now() / 1000)
            var failedChecks = []; // Add any failed check to this array
            if(/[^A-Za-z0-9.\s]/g.test(filename)) {
                valid = false
                failedChecks.push("Filename contains non-alphanumeric characters")
            }
            if(/^(.*\s+.*)+$/.test(filename)) {
                valid = false
                failedChecks.push("Filename contains whitespace")
            }
            if(failedChecks.length > 0) { // If the filename failed any checks, remove it from the unimported array and add it to the failedImports array
                unimported = unimported.filter(file => file != filename) // Remove current filename from unimported array
                failedImports.push({
                    filename,
                    checks: failedChecks
                })
                completedImporting++
                updateProgress(totalFileCount, completedImporting)
                return; // Skip to next filename in loop
            }
            // Add file to uploads table if no checks were failed
            db.run("INSERT INTO uploads(uploader, filename, unixtime, deletionkey) VALUES(?,?,?,?)", ["imported", filename, currentUnixTime, deletionKey], (error) => { // Insert upload under the username "imported"
                if(error) {
                    colors.red()
                    console.error(`ERROR IMPORTING ${filename}:`)
                    console.error(error)
                    colors.reset()
                }
                completedImporting++
                updateProgress(totalFileCount, completedImporting)
            })
        })
    })
}

var lastProgress = 0
function updateProgress(totalFileCount, completed) { // Show progress bar for input
    let currentProgress = (100 / totalFileCount) * completed
    var barWidth = Math.floor(TWIDTH * 0.6) // 60% of the terminal will be a progressbar
    var barProgress = Math.round((barWidth / 100) * currentProgress)
    if(lastProgress != Math.ceil(currentProgress)) { // Only output to console if a full 1% has passed at least
        lastProgress = Math.ceil(currentProgress)
        process.stdout.write(`\r[${"-".repeat(barProgress)}] ${Math.ceil(currentProgress)}% (${completed} / ${totalFileCount})`)
    }
    if (Math.floor(currentProgress) == 100) { // If all the files have been added to the database (Can also be 0)
        db.exec("COMMIT"); // Commit the whole transaction into the database all at once
        process.stdout.write(`\r${colors.greenStr}[${"-".repeat(barProgress)}] ${Math.ceil(currentProgress)}% (${completed - unimported.length} / ${totalFileCount})`)
        colors.green()
        console.log(`\nImported ${unimported.length} ${unimported.length > 1 || unimported.length == 0 ? "files" : "file"}`)
        colors.reset()
        db.close()
        if (failedImports.length > 0) {
            failedImports.forEach(failedImport => {
                colors.red()
                console.log("_".repeat(40))
                colors.reset()
                console.log(`Did not import ${colors.blueStr}${failedImport.filename}${colors.resetStr}`)
                colors.red()
                failedImport.checks.forEach(check => {
                    console.log("•",check)
                })
                colors.reset()
            });
        }
    }
}

async function isFileInDatabase(filename) { // Check if the filename exists in the database
    return new Promise((resolve, reject) => {
        db.get("SELECT deletionkey FROM uploads WHERE filename = ?", filename, (error, result) => { // If it returns a deletionkey it means the file is in the database
            if(error) {
                reject(error)
            }
            resolve(result)
        })
    })
}

async function main() {
    fs.readdir("public/u", async (error, files) => { // Get all the files in the uploads folder
        if (error) {
            return console.error(error)
        }
        for(let filename of files) {
            if (filename == "desktop.ini") continue; // Ignore windows stuff
            try {
                var deletionKey = await isFileInDatabase(filename)
                if (typeof deletionKey === 'undefined') { // Deletionkey was not found, so file is not in database
                    unimported.push(filename)
                }
            } catch(error) {
                console.error(error)
            }
        };
        console.log(`Files in public/u: ${files.length}`)
        console.log(`Importing ${unimported.length} unimported files`)
        startImport() // Begin importing files that are not in DB
    });
}