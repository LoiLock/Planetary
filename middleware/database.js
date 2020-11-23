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
    isValidDeletionkey,
    getUserAlbumJSON,
    addDirectory,
    removeDirectory,
    getUserDirectories,
    createDirectoryDataColumn,
    addFilesToDirectory,
    getFileAttributes,
    removeFilesFromDirectory
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

async function getFileAttributes(filename) {
    return new Promise((resolve) => {
        db.get("SELECT filename, deletionkey, unixtime, thumbnail FROM uploads WHERE filename = ?", filename, (error, result) => {
            if(error) {
                return resolve(undefined) // Don't reject, just assume deletionkey wasn't found, outcome would be the same eitherway
            }

            resolve(result) // If key is found (sqlite returned 1) resolve as true, otherwise resolve as false
        })
    })
}

async function getUserAlbumJSON(username) {
    return new Promise((resolve, reject) => {
        db.get("SELECT data FROM albums WHERE owner = ?", "loilock", (error, result) => {
            if (error) {
                return reject(error)
            }
            if(typeof result === 'undefined') { // If username does not have album yet, create a new one
                const emptyAlbum = {
                    data: {
                        children: []
                    }
                }

                console.log("Created album data")
                db.run("INSERT INTO albums(owner, data) VALUES(?,?)", [username, JSON.stringify(emptyAlbum)])
                return resolve(JSON.stringify(emptyAlbum))
            }
            console.log("Obtained old data")
            resolve(result.data)
        })
    })
}

// Adds directory/folder to user's albums. rejects if a folder with that name already exists, resolves if successful
// e.g. to add a folder "documentaries" to the folder "videos":
// addDirectory("/videos", "documentaries", "loilock")

async function addDirectory(path, newDirectoryName, username) {
    return new Promise(async (resolve, reject) => {
        db.serialize(async () => {
            var currentData = await self.getUserDirectories(username) // Get the current file/directory list stored in the database
            if(!currentData) { // If user does not have an album data column in the database yet, create one
                await self.createDirectoryDataColumn(username)
                currentData = await self.getUserDirectories(username)
            }
            currentData = JSON.parse(currentData.data)

            const pathExists = currentData.some((anyPath) => { // check if the path about to be created already exists
                return ((anyPath.path == path) && (anyPath.name == newDirectoryName))
            })

            if (pathExists) {
                return reject(false) // Path already exists
            }
            currentData.push({ // Push folder to entries array
                type: "folder",
                name: newDirectoryName,
                path: path
            })
            db.run("UPDATE albums SET data = ? WHERE owner = ?", [JSON.stringify(currentData), username], (error) => { // Insert the updated currentData
                if (error) {
                    return reject(error)
                }
                resolve(true)
            })
        })
    })
}

async function removeDirectory(path, currentPath, username) { // path is selected directory to be removed
    return new Promise(async (resolve, reject) => {
        db.serialize(async () => {
            var currentData = await self.getUserDirectories(username) // Get the current file/directory list stored in the database
            if(!currentData) { // If user does not have an album data column in the database yet, create one
                await self.createDirectoryDataColumn(username)
                currentData = await self.getUserDirectories(username)
            }
            currentData = JSON.parse(currentData.data)
            console.log("PATH:", path)
            const pathArr = path.split("/")
            const selectedDirName = pathArr[pathArr.length - 1]
            console.log({selectedDirName})
            console.log({currentPath})
            console.log(path + "/" + selectedDirName)
            currentData = currentData.filter((albumEntry) => { // Remove all entries where the parent path is the currently selected path
                console.log(albumEntry.path)
                return !(albumEntry.path.startsWith(path) || albumEntry.path == currentPath && albumEntry.name == selectedDirName)
            })

            db.run("UPDATE albums SET data = ? WHERE owner = ?", [JSON.stringify(currentData), username], (error) => { // Insert the updated currentData
                if (error) {
                    return reject(error)
                }
                resolve(true)
            })
        })
    })
}

async function addFilesToDirectory(path, filelist, username) { // Filelist is list of deletionkeys that are selected to be added
    return new Promise(async (resolve, reject) => {
        db.serialize(async () => {
            var currentData = await self.getUserDirectories(username) // Get the current file/directory list stored in the database
            if(!currentData) { // If user does not have an album data column in the database yet, create one
                await self.createDirectoryDataColumn(username)
                currentData = await self.getUserDirectories(username)
            }
            currentData = JSON.parse(currentData.data)

            for(const singleFile of filelist) {
                console.trace(filelist)
                const fileData = await getFileAttributes(singleFile)
                console.log(fileData)
                console.log(path)
                const pathExists = currentData.some((anyPath) => { // check if the path about to be created already exists
                    return ((anyPath.path == path) && (anyPath.name == fileData.filename))
                })
                console.log(pathExists)
                console.log(path + "/" + fileData.filename)
                if (!pathExists) {
                    currentData.push({
                        type: "file",
                        name: fileData.filename,
                        thumbnail: fileData.thumbnail,
                        unixtime: fileData.unixtime,
                        path: path
                    })
                }
            }
            console.log(JSON.stringify(currentData, null, 4))
            db.run("UPDATE albums SET data = ? WHERE owner = ?", [JSON.stringify(currentData), username], (error) => { // Insert the updated currentData
                if (error) {
                    return reject(error)
                }
                resolve(true)
            })
        })
    })
}

async function removeFilesFromDirectory(path, filelist, username) { // filelist is list of filenames that are selected to be deleted
    return new Promise(async (resolve, reject) => {
        db.serialize(async () => {
            var currentData = await self.getUserDirectories(username) // Get the current file/directory list stored in the database
            if(!currentData) { // If user does not have an album data column in the database yet, create one
                await self.createDirectoryDataColumn(username)
                currentData = await self.getUserDirectories(username)
            }
            currentData = JSON.parse(currentData.data)
            

            currentData = currentData.filter((albumEntry) => {
                let pathMatches = (path == albumEntry.path)
                let filenameMatches = (filelist.includes(albumEntry.name))
                return !(pathMatches && filenameMatches)
            })
            
            console.log(JSON.stringify(currentData, null, 4))
            db.run("UPDATE albums SET data = ? WHERE owner = ?", [JSON.stringify(currentData), username], (error) => { // Insert the updated currentData
                if (error) {
                    return reject(error)
                }
                resolve(true)
            })
        })
    })
}


async function getUserDirectories(username) {
    return new Promise((resolve, reject) => {
        db.get("SELECT data FROM albums WHERE owner = ?", username, (error, result) => {
            if (error) {
                return reject(error)
            }
            
            resolve(result)
        })
    })
}
async function createDirectoryDataColumn(username) {
    return new Promise((resolve) => {
        const emptyData = []
        db.run("INSERT INTO albums(owner, data) VALUES(?,?)", [username, JSON.stringify(emptyData)], (error) => {
            if (error) {
                return reject(error)
            }

            resolve()
        })
    })
}