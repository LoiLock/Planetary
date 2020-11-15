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
            // var message = await database.addAlbum(albumprops)
            return res.json({
                success: false,
                message: "Albums are currently disabled as they're not fully implemented yet"
            })
        } catch(error) {
            return res.json({
                success: false,
                message: "Something went wrong"
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
        res.json(userAlbums)
    } catch (error) {
        // !
    }
})


module.exports = albumRouter