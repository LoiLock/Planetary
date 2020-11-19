const sqlite3 = require("sqlite3").verbose()

var { sendEvent } = require("../middleware/liveevents")
// ? Start update background task to update site info
const db = new sqlite3.Database("./db/planetary.db", (err) => {
    if (err) {
        console.error(err)
    }

    console.info("Connected to the database")
})

process.on('SIGINT', () => {
    db.close(function() {
        console.info("\nClosed database")
        process.exit(0)
    });
});

var self = module.exports = {
    addUser,
    initDB,
    isSharexTokenValid,
    verifyUser,
    logUpload,
    getFileName,
    getUploads,
    flagDelete,
    getAllUsers,
    getAllUploads,
    getUserCount,
    addAlbum,
    getAlbums,
    addFilesToAlbum,
    removeFilesFromAlbum,
    getKeysFromAlbum,
    isValidDeletionkey
}

async function initDB() {
    db.serialize(() => { // Run sqlite operation in serial order
        db.run("CREATE TABLE IF NOT EXISTS users(username text UNIQUE, phash text, sharextoken text, isAdmin integer)", (err) => { // Create users table
            if (err) {
                console.error(err)
            }
        })
        db.run("CREATE TABLE IF NOT EXISTS uploads(uploader text, filename text, unixtime text, deletionkey text, thumbnail text, isdeleted integer DEFAULT 0)", (err) => { // Create uploads table
            if (err) {
                console.error(err)
            }
        })
        db.run("CREATE TABLE IF NOT EXISTS albums(name text, cover text, owner text, public integer DEFAULT 0, slug text, files text)", (err) => { // Create albums table
            if (err) {
                console.error(err)
            }
        })
    })
}

async function addUser(username, passwordhash, sharextoken) {
    // ? If user added is the first user, make him the admin
    var userCount = await self.getUserCount()
    var isAdmin = 0
    if (userCount === 0) {
        isAdmin = 1
    }
    var result = new Promise((resolve, reject) => {
        db.run("INSERT INTO users(username, phash, sharextoken, isAdmin) VALUES(?,?,?,?)", [username, passwordhash, sharextoken, isAdmin], (error) => {
            if(error) {
                reject(error)
            }
            else {
                resolve(`Added user ${username}`)
            }
        })
    })
    var res = await result
    return res
}

function verifyUser(username, callback) { // returns passwordhash, isAdmin and other profile information
    db.get('SELECT username, phash, sharextoken, isAdmin FROM users WHERE username = ?', username, function(error, result) {
        if (error) {
            console.error(error)
            return callback(null)
        }
        callback(result)
    })
}

// TODO: make promise
// ? Returns object with a boolean true and the username if the sharex token is found
function isSharexTokenValid(sharextoken, callback) { // returns error (could be null) and object if valid and username
    var res;
    var sql = 'SELECT username FROM users WHERE sharextoken = ?'
    // var result = db.get('SELECT username FROM users WHERE sharextoken = ?', sharextoken)
    
    db.get(sql, sharextoken, function(error, result) {
        if (error) {
            console.error(error)
            return callback(error)
        }
        else {
            if (!result) { // If username is NOT found that has matching sharextoken
                console.info("Sharextoken NOT found:", sharextoken)
                callback(null, {
                    valid: false,
                    username: null
                })
            } else {
                console.info("Sharextoken FOUND", sharextoken)
                callback(null, {
                    valid: true,
                    username: result.username
                })
            }
        }
    })
}

// ? Thumbnail is a smaller / shorter image or video of the original file
async function logUpload(sharextoken, filename, deletionKey, thumbnail) { // Will lookup the sharextoken, grab the username, and add a new row to the uploads table with the current timestamp
    db.serialize(() => {
        db.get('SELECT username FROM users WHERE sharextoken = ?', sharextoken, function(error, result) {
            if (error) {
                console.log(error)
                return
            }
            var currentTime = Math.floor(Date.now() / 1000)
            db.run('INSERT INTO uploads (uploader, filename, unixtime, deletionkey, thumbnail) VALUES (?,?,?,?,?)', result.username, filename, currentTime.toString(), deletionKey, thumbnail)
            sendEvent("fileupload", result.username, filename) // ? Send SSE to client/browser when the thumbnail has been added to the database
        })
        return // !
    })
}

async function getFileName(deletionkey) { // Get filename associated with deletionkey
    let results = new Promise((resolve, reject) => db.get('SELECT filename FROM uploads WHERE deletionkey = ?', deletionkey, (error, result) => {
        if (error) {
            reject(error)
        }
        if (!result) {
            reject("Invalid file name")
        } else {
            resolve(result.filename)
        }
    }))
    let res = await results
    return res
}

async function getUploads(username) { // Get all uploads for a given user
    let results = new Promise((resolve, reject) => db.all('SELECT uploader, filename, unixtime, deletionkey, thumbnail, isdeleted FROM uploads WHERE uploader = ?', username, (error, result) => {
        if (error) {
            console.log(error)
            reject(error)
        }
        if(!result) {
            reject("Invalid request") // ? no uploads or no user found with that name????
        } else {
            resolve(result)
        }
    }))
    let res = await results
    return res
}

async function flagDelete(deletionkey) { // Flag file as deleted by deletionkey
    var results = new Promise((resolve, reject) => {
        db.run("UPDATE uploads SET isdeleted = 1 WHERE deletionkey = ?", deletionkey, (error) => {
            if(error) {
                reject(error)
            }
            resolve("Successfully deleted")
        })
    })
    var res = await results
    return res
}

async function getAllUploads() { // ? For admin panel, not yet implemented
    var results = new Promise((resolve, reject) => {
        db.all("SELECT * FROM uploads ORDER BY unixtime DESC", (error, result) => {
            if (error) {
                reject(error)
            }
            if (!result) {
                reject("No uploads")
            } else {
                resolve(result)
            }
        })
    })
    var res = await results
    return res
}

async function getAllUsers() { // ? For admin panel, not yet implemented
    var results = new Promise((resolve, reject) => {
        db.all("SELECT username, sharextoken, isAdmin FROM users ORDER BY username ASC", (error, result) => {
            if (error) {
                reject(error)
            }
            if (!result) {
                reject("No users")
            } else {
                resolve(result)
            }
        })
    })
    var res = await results
    return res
}

async function getUserCount() { // Get user count
    return new Promise((resolve, reject) => {
        db.get("SELECT COUNT(*) FROM users", (error, result) => {
            if(error) {
                reject(error)
            }
            resolve(result[Object.keys(result)[0]]) // Get value of first property
        })
    })
}

// ! WIP
async function addAlbum(albumprops) { // ? adds album to database, not yet implemented
    var results = new Promise((resolve, reject) => {
        db.run("INSERT INTO albums(name, owner, slug) VALUES(?,?,?)", [albumprops.albumname, albumprops.owner, albumprops.slug], (error) => {
            if(error) {
                return reject(error)
            }
            resolve("Successfully added album")
        })
    })
    var res = await results
    return res
}

// tags must be an array
async function getAlbums(username) { // ? Gets all the albums where the owner matches the username who requested it, not yet implemented
    var results = new Promise((resolve, reject) => {
        db.all("SELECT name, slug, files, cover FROM albums WHERE owner = ?", username, (error, result) => {
            if(error) {
                reject(error)
            }
            resolve(result)
        })
    })
    var res = await results
    return res
}

// ? Gets the files currently in the album as a set (To prevent duplicates).
async function addFilesToAlbum(slug, files) { // Files is array of deletionkeys from the client
    let currentFiles = await self.getKeysFromAlbum(slug) // Get array of files (deletionkeys) in album by slug
    if (!currentFiles) { // If files array currently does not contain any files (sqlite returns NULL), create an empty array
        currentFiles = []
    } else { // If currentfiles is csv string, split it into an array
        currentFiles = currentFiles.split(",")
    }
    console.log(currentFiles)
    var fileSet = new Set(currentFiles) // Create set from files array in the album
    console.log(fileSet)
    // for every deletionkey in user submitted files array, check if valid and if so add it to the fileSet
    for (const file of files) {
        const fileExists = await self.isValidDeletionkey(file)
        if (fileExists === false) { continue }; // Skip current iteration
        fileSet.add(file)
        console.log(fileSet)
    }
    const fileCountAlbum = fileSet.size
    const csvFileList = Array.from(fileSet).join(",") // Create csv string from fileSet Set()
    const results = new Promise((resolve, reject) => {
        db.run("UPDATE albums SET files = ? WHERE slug = ?", [csvFileList, slug], (error) => {
            if(error) {
                return reject(error)
            }
            resolve("Succesfully added files to album")
        })
    })
    let res = await results
    return {
        message: res,
        filecount: fileCountAlbum
    }
}

async function removeFilesFromAlbum(slug, files) { // Files is array of deletionkeys from the client
    let currentFiles = await self.getKeysFromAlbum(slug) // Get array of files (deletionkeys) in album by slug
    currentFiles = currentFiles.split(",")
    console.log(currentFiles)

    currentFiles = currentFiles.filter((key) => { // Remove all array entries that contain deletionkey
        return !files.includes(key)
    })
    
    const csvFileList = currentFiles.join(",") // Create csv string from currentFiles array
    const results = new Promise((resolve, reject) => {
        db.run("UPDATE albums SET files = ? WHERE slug = ?", [csvFileList, slug], (error) => {
            if(error) {
                return reject(error)
            }
            resolve("Succesfully removed files from album")
        })
    })
    let res = await results
    return {
        message: res
    }
}

async function getKeysFromAlbum(slug) { // Returns csv string with deletionkeys (Which act as unique file IDs) for all the files in album by slug
    const results = new Promise((resolve, reject) => {
        db.get("SELECT files FROM albums WHERE slug = ? ", slug, (error, result) => {
            if (error) {
                return reject(error)
            }

            resolve(result.files)
        })
    })
    let res = await results
    return res
}

// ? Return boolean indicating whether deletionkey exists in the database
async function isValidDeletionkey(deletionkey) { // Could use getFilename, but this is cleaner
    return new Promise((resolve) => {
        db.get("SELECT EXISTS(SELECT 1 FROM uploads WHERE deletionkey = ?)", deletionkey, (error, result) => {
            if(error) {
                return resolve(false) // Don't reject, just assume deletionkey wasn't found, outcome would be the same eitherway
            }

            let resultValue = result[Object.keys(result)[0]] // Get 1 or 0 (true false) from result object (first object key)
            resolve((resultValue == 1 ? true : false)) // If key is found (sqlite returned 1) resolve as true, otherwise resolve as false
        })
    })
}