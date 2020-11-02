const sqlite3 = require("sqlite3").verbose()

const db = new sqlite3.Database("./db/planetary.db", (err) => {
    if (err) {
        console.error(err)
    }

    console.log("Connected to the database")
})

// (async () => {
//     // open the database
//     const db = await open({
//       filename: './db/planetary.db',
//       driver: sqlite3.Database
//     })
// })()

module.exports = {
    addUser,
    initDB,
    isSharexTokenValid,
    verifyUser,
    logUpload,
    getFileName
}

function initDB() {
    db.serialize(() => { // Run sqlite operation in serial order
        db.run("CREATE TABLE IF NOT EXISTS users(username text, phash text, sharextoken text, isAdmin integer)", (err) => { // Create users table
            if (err) {
                console.error(err)
            }
        })
        db.run("CREATE TABLE IF NOT EXISTS uploads(uploader text, filename text, unixtime text, deletionkey text)", (err) => { // Create users table
            if (err) {
                console.error(err)
            }
        })
    })
}

async function addUser(username, passwordhash, sharextoken) {
    var stmt = db.prepare("INSERT INTO users (username, phash, sharextoken, isAdmin) VALUES (?,?,?,?)")
    stmt.run(username, passwordhash, sharextoken, 0)
    stmt.finalize()
    console.log("added")
}

function verifyUser(username, callback) { // returns passwordhash, isAdmin and other profile information
    db.get('SELECT username, phash, isAdmin FROM users WHERE username = ?', username, function(error, result) {
        if (error) {
            console.error(error)
            return callback(null)
        }
        callback(result)
    })
}

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
                console.log("Sharextoken NOT found")
                callback(null, {
                    valid: false,
                    username: null
                })
            } else {
                console.log("Sharextoken FOUND")
                callback(null, {
                    valid: true,
                    username: result.username
                })
            }
        }
    })
}

async function logUpload(sharextoken, filename, deletionKey) { // Will lookup the sharextoken, grab the username, and add a new row to the uploads table with the current timestamp
    db.serialize(() => {
        db.get('SELECT username FROM users WHERE sharextoken = ?', sharextoken, function(error, result) {
            if (error) {
                console.log(error)
                return
            }
            var currentTime = Math.floor(Date.now() / 1000)
            db.run('INSERT INTO uploads (uploader, filename, unixtime, deletionkey) VALUES (?,?,?,?)', result.username, filename, currentTime.toString(), deletionKey)
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