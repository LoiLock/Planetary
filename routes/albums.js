var albumRouter = require("express").Router()

var database = require("../middleware/database")

albumRouter.post("/", async (req, res) => {
    console.log(req.body)
})

albumRouter.get("/", async (req, res) => {
    res.json({
        albums: [
            "memes",
            "videos"
        ]
    })
})


module.exports = albumRouter