var albumRouter = require("express").Router()

var database = require("../middleware/database")
const { rndString, addEntryAtPath } = require("../middleware/utils")

// ! WIP

// ? /albums/add
albumRouter.post("/add", async (req, res) => { // Add directory child object at specific path in user's album.data object
    const directoryname = req.body.directoryName ? req.body.directoryName : ""
    var insertIntoPath = req.body.insertIntoPath ? req.body.insertIntoPath : "/"
    if(!(directoryname.match(/^[a-z0-9]+$/i) && directoryname.length <= 14)) {
        return res.json({
            success: false,
            message: "Invalid album name"
        })
    }
    if (!directoryname) {
        return res.json({
            success: false,
            message: "Empty fields"
        })
    }
    try {
        const addedSuccess = await database.addDirectory(insertIntoPath,directoryname,req.user.username)
        res.json({
            success: true
        })
    } catch (success) {
        res.json({
            success: false
        })
    }
})

albumRouter.post("/remove", async (req, res) => {
    try {
        const removed = await database.removeDirectory(req.body.selectedPath, req.body.currentPath, req.user.username)
        res.json({
            success: true
        })
    } catch (error) {
        console.log(error)
    }
})

albumRouter.post("/addfiles", async (req, res) => {
    const directoryname = req.body.dirname ? req.body.dirname : ""
    var insertIntoPath = req.body.insertIntoPath ? req.body.insertIntoPath : "/"
    if(!(directoryname.match(/^[a-z0-9]+$/i) && directoryname.length <= 14)) {
        return res.json({
            success: false,
            message: "Invalid album name"
        })
    }
    if (!directoryname) {
        return res.json({
            success: false,
            message: "Empty fields"
        })
    }

    insertIntoPath = (insertIntoPath == "/") ? insertIntoPath + directoryname : insertIntoPath + "/" + directoryname
    try {
        const addedSuccess = await database.addFilesToDirectory(insertIntoPath, req.body.files, req.user.username)
        res.json({
            success: addedSuccess
        })
    } catch (success) {
        res.json({
            success: success
        })
    }
})

albumRouter.post("/removefiles", async (req, res) => {
    var insertIntoPath = req.body.insertIntoPath ? req.body.insertIntoPath : "/"

    console.log("a".repeat(50))
    insertIntoPath = (insertIntoPath == "/") ? insertIntoPath : insertIntoPath
    try {
        const addedSuccess = await database.removeFilesFromDirectory(insertIntoPath, req.body.files, req.user.username)
        res.json({
            success: addedSuccess
        })
    } catch (success) {
        res.json({
            success: success
        })
    }
})

// ? /albums/get
albumRouter.post("/get", async (req, res) => {
    console.log("req.body.path:", req.body.path)
    let jsonEntries = await database.getUserDirectories(req.user.username)
    const entries = JSON.parse(jsonEntries.data)

    const requestedPath = (req.body.path == "") ? "/" : req.body.path
    console.log(requestedPath)
    const entriesAtPath = entries.filter((albumEntry) => { // Get all the album entries that contain the current path
        return albumEntry.path == requestedPath
    })
    res.json({
        children: entriesAtPath
    })
})

// // TODO: change to /add/files (Cleaner)
// albumRouter.post("/addfiles", async (req, res) => {
//     console.log(req.body.filelist)
//     const albumslug = req.body.slug
//     const filelist = req.body.filelist
//     try {
//         let dbresult = await database.addFilesToAlbum(albumslug, filelist)
//         return res.json({
//             success: true,
//             message: dbresult.message,
//             filecount: dbresult.filecount
//         })
//     } catch (error) {
//         console.error(error)
//         return res.json({
//             success: false,
//             message: "Something went wrong with adding files to the album"
//         })
//     }
// })

// albumRouter.post("/removefiles", async (req, res) => {
//     console.log(req.body.filelist)
//     const albumslug = req.body.slug
//     const filelist = req.body.filelist
//     try {
//         let dbresult = await database.removeFilesFromAlbum(albumslug, filelist)
//         console.log(dbresult)
//         return res.json({
//             success: true,
//             message: dbresult
//         })
//     } catch (error) {
//         console.error(error)
//         return res.json({
//             success: false,
//             message: "Something went wrong with removing files to the album"
//         })
//     }
// })

// // ? Get list with deletionkeys by album slug
// albumRouter.get("/list/:slug", async (req, res) => {
//     console.log(req.params.slug)
//     const albumslug = req.params.slug
//     try {
//         let dbresult = await database.getKeysFromAlbum(albumslug)
//         console.log(dbresult)
//         return res.json({
//             success: true,
//             deletionkeys: dbresult
//         })
//     } catch (error) {
//         console.error(error)
//         return res.json({
//             success: false,
//             message: "Something went wrong with getting album file list"
//         })
//     }
// })


module.exports = albumRouter