var albumRouter = require("express").Router()

var database = require("../middleware/database")
const { rndString } = require("../middleware/utils")

// ! WIP

// ? /albums/add
albumRouter.post("/add", async (req, res) => { // validate albumname, and add it to the database
    if (req.body.albumname && req.body.albumname != "") {
        var albumname = req.body.albumname
        if(!(albumname.match(/^[a-z0-9]+$/i) && albumname.length <= 14)) {
            return res.json({
                success: false,
                message: "Invalid album name"
            })
        }

        var owner = req.user.username.toLowerCase()
        var slug = rndString(8)
        var albumprops = {
            owner,
            slug,
            albumname
        }
        try { // TODO: Add album functionality
            var message = await database.addAlbum(albumprops)
            return res.json({
                success: true,
                message: message
            })
        } catch(error) {
            console.log(error)
            return res.json({
                success: false,
                message: "Something went wrong with adding the album"
            })
        }
    } else {
        return res.json({
            success: false,
            message: "empty fields"
        })
    }
})

// ? /albums/get
albumRouter.get("/get", async (req, res) => {
    try{
        var userAlbums = await database.getAlbums(req.user.username)
        res.json({
            success: true,
            albums: userAlbums
        })
    } catch (error) {
        res.json({
            success: false,
            message: "Something went wrong with retreiving the user's albums"
        })
    }
})

// TODO: change to /add/files (Cleaner)
albumRouter.post("/addfiles", async (req, res) => {
    console.log(req.body.filelist)
    const albumslug = req.body.slug
    const filelist = req.body.filelist
    try {
        let dbresult = await database.addFilesToAlbum(albumslug, filelist)
        return res.json({
            success: true,
            message: dbresult.message,
            filecount: dbresult.filecount
        })
    } catch (error) {
        console.error(error)
        return res.json({
            success: false,
            message: "Something went wrong with adding files to the album"
        })
    }
})

albumRouter.post("/removefiles", async (req, res) => {
    console.log(req.body.filelist)
    const albumslug = req.body.slug
    const filelist = req.body.filelist
    try {
        let dbresult = await database.removeFilesFromAlbum(albumslug, filelist)
        console.log(dbresult)
        return res.json({
            success: true,
            message: dbresult
        })
    } catch (error) {
        console.error(error)
        return res.json({
            success: false,
            message: "Something went wrong with removing files to the album"
        })
    }
})

// ? Get list with deletionkeys by album slug
albumRouter.get("/list/:slug", async (req, res) => {
    console.log(req.params.slug)
    const albumslug = req.params.slug
    try {
        let dbresult = await database.getKeysFromAlbum(albumslug)
        console.log(dbresult)
        return res.json({
            success: true,
            deletionkeys: dbresult
        })
    } catch (error) {
        console.error(error)
        return res.json({
            success: false,
            message: "Something went wrong with getting album file list"
        })
    }
})


module.exports = albumRouter