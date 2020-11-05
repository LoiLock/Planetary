const fs = require("fs").promises
var config = require('../config.json')
const path = require("path")
var Utils = require("../middleware/utils")
var database = require("../middleware/database")

module.exports = {
    handleUpload: async function(req, res) {
        // console.log(req.body)
        // console.log(req.files.uploadfile)
        // console.log(req.body.key)
        database.isSharexTokenValid(req.body.key, async function(err, result) { // Check if token is valid
            console.log(`RESULT: ${result}`)
            console.log(result)
            if(result.valid == false || err) { // If token is invalid or something went wrong
                res.send(JSON.stringify({
                    Url: config.protocol + config.serverURL + "/u/" + 'invalidtoken.png'
                }))
                return
            }

            console.log(req.files)
            // Keep file extension and generate a random filename
            var fileExt = path.extname(req.files.uploadfile.name)
            // ! FIXME, currently this only fixes russian characters, but does not account for files without extension
            if (fileExt == "") { //path.extname returns an empty string for Russian characters, so use the remaining name (the extension, e.g. .mp4) as the extension
                fileExt = req.files.uploadfile.name
            }
            var rndFilename = Utils.rndString(16) + fileExt
            var deletionKey = Utils.rndString(32)
            
            var uploadedFile = req.files.uploadfile
            uploadedFile.mv('public/u/' + rndFilename, function(error) {
                if (error) {
                    console.log('File upload error: ', error)
                    return res.status(500).send('Something went wrong during the file upload')
                }
                res.send(JSON.stringify({
                    Url: config.protocol + config.serverURL + "/u/" + rndFilename,
                    DeletionURL: config.protocol + config.serverURL + "/delete/" + deletionKey
                }))
                logUpload(req, rndFilename, deletionKey)
            })
            // TODO: test function above, remove comment
            // try { // Save the file
            //     await fs.writeFile('public/u/' + rndFilename, req.files.uploadfile.data)
            //     // TODO: Add Deletion URL
            //     res.send(JSON.stringify({
            //         Url: config.protocol + config.serverURL + "/u/" + rndFilename,
            //         DeletionURL: config.protocol + config.serverURL + "/delete/" + deletionKey
            //     }))
            // } catch (error) {
            //     console.error(error)
            // }
        })
    }
}

// Log file upload to database asyncrously
// Determine whether a thumbnail can be made for the uploaded file
async function logUpload(req, rndFilename, deletionKey) {
    var imageMimes = [ 'image/png', 'image/gif', 'image/jpeg']
    var videoMimes = [ 'video/mp4', 'video/mpeg', 'video/webm', 'video/x-matroska']
    if (videoMimes.includes(req.files.uploadfile.mimetype)) { // If upload file has mimetype of supported video, create thumbnail
        try {
            var rndThumbVideo = await Utils.createVideoThumb(rndFilename, Utils.rndString(16))
            console.log("random thumbnail:")
            console.log(rndThumbVideo)
            console.log("random thumbnail")
            database.logUpload(req.body.key, rndFilename, deletionKey, rndThumbVideo) // Log file upload
        } catch (error) {
            // ! couldn't create thumbnail
        }
    }
    else if(imageMimes.includes(req.files.uploadfile.mimetype)) {
        try {
            var rndThumbnail = await Utils.createImageThumb(rndFilename, Utils.rndString(16))
            database.logUpload(req.body.key, rndFilename, deletionKey, rndThumbnail) // Log file upload
        } catch (error) {
            // ! couldn't create thumbnail
        }
    } else {
        database.logUpload(req.body.key, rndFilename, deletionKey) // Log file upload
    }
}