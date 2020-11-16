const fs = require("fs").promises
var config = require('../config.json')
const path = require("path")
var Utils = require("../middleware/utils")
var database = require("../middleware/database")

module.exports = {
    handleUpload: async function(req, res) {
        console.log(req.body)
        console.log(req.files.uploadfile)
        if (!((req.files && req.files.uploadfile) &&
        req.files.uploadfile.size < config.fileSizeLimitMB * 1024 * 1024)) {
            res.json({
                success: false,
            })
        }
        database.isSharexTokenValid(req.body.key, async function(err, result) { // Check if token is valid
            console.log(`RESULT: ${result}`)
            console.log(result) // Username that's associated with the sharextoken
            if(result.valid == false || err) { // If token is invalid or something went wrong
                res.send(JSON.stringify({
                    Url: config.protocol + config.serverURL + "/u/" + 'invalidtoken.png'
                }))
                return res.status(413).send('File is too large')
            }
            console.log(req.body)
            console.log(req.files)
            // Keep file extension and generate a random filename
            var fileExt = path.extname(req.files.uploadfile.name)

            if (fileExt == "") { //path.extname returns an empty string for Russian characters, so use the remaining name (the extension, e.g. .mp4) as the extension
                fileExt = req.files.uploadfile.name
            }
            var rndFilename = Utils.rndString(16) + fileExt
            var deletionKey = Utils.rndString(32)
            
            var uploadedFile = req.files.uploadfile
            console.log(req.files.uploadfile.mimetype)

            // * Checks whether file is an mp4, if so, we'll optimize the file
            // 1. save the uploaded mp4 to tmp/ folder
            // 2. in optimizeMP4 save it back to public/u/ folder
            // 3. wait for this and send response back to sharex
            if(['video/mp4', 'video/mpeg'].includes(req.files.uploadfile.mimetype)) {
                console.log("trying optimization")
                console.log(rndFilename)
                try {
                    var filename = await Utils.optimizeMP4(req.files.uploadfile.tempFilePath, rndFilename) // Express file-upload provides a tempfile
                    res.send(JSON.stringify({
                        Url: config.protocol + config.serverURL + "/u/" + filename,
                        DeletionURL: config.protocol + config.serverURL + "/delete/" + deletionKey
                    }))
                    createThumbnail(req, rndFilename, deletionKey) // Log upload to database and create thumbnail

                    fs.unlink(req.files.uploadfile.tempFilePath, async (error) => { // Delete the file if the optimization was successful
                        if (error) { // Temp file does not exist
                            console.log(error)
                        }
                    })
                    return // Prevent uploadedFile.mv from firing
                } catch (error) { // something went wrong with ffmpeg video optimization
                    console.log('File upload error: ', error)
                    // Don't return, continue to uploadedFile.mv
                }
            }

            uploadedFile.mv('public/u/' + rndFilename, function(error) {
                console.log("Fired")
                if (error) {
                    console.log('File upload error: ', error)
                    return res.status(500).send('Something went wrong during the file upload')
                }
                res.send(JSON.stringify({
                    Url: config.protocol + config.serverURL + "/u/" + rndFilename,
                    DeletionURL: config.protocol + config.serverURL + "/delete/" + deletionKey
                }))
                createThumbnail(req, rndFilename, deletionKey) // Log upload to database and create thumbnail
            })
            
        })
    }
}

// Log file upload to database asyncrously
// Determine whether a thumbnail can be made for the uploaded file
async function createThumbnail(req, rndFilename, deletionKey) {
    var imageMimes = [ 'image/png', 'image/jpeg', 'image/webp']
    var videoMimes = [ 'video/mp4', 'video/mpeg', 'video/webm', 'video/x-matroska', 'image/gif']
    var soundMimes = [ 'audio/mpeg', 'audio/mp3', 'audio/x-wav', 'audio/wav', 'audio/x-aiff', 'audio/opus', 'audio/ogg', 'audio/flac', 'audio/x-flac' ]
    var pdfMimes = [ 'application/pdf' ]
    console.log(req.files.uploadfile.mimetype)

    var thumbnail = new Promise(async (resolve, reject) => {
        if (videoMimes.includes(req.files.uploadfile.mimetype)) { // If upload file has mimetype of supported video, create thumbnail
            try {
                var rndThumbVideo = await Utils.createVideoThumb(rndFilename, Utils.rndString(16))
                resolve(rndThumbVideo)
            } catch (error) {
                reject(error)
            }
        }
        else if(imageMimes.includes(req.files.uploadfile.mimetype)) {
            try {
                var rndThumbnail = await Utils.createImageThumb(rndFilename, Utils.rndString(16))
                resolve(rndThumbnail)
            } catch (error) {
                reject(error)
            }
        } else if (soundMimes.includes(req.files.uploadfile.mimetype)) {
            try {
                var rndSoundThumb = await Utils.createSoundThumb(rndFilename, Utils.rndString(16))
                resolve(rndSoundThumb)
            } catch (error) {
                console.log(error)
                reject(reject)
            }
        } else if (pdfMimes.includes(req.files.uploadfile.mimetype)) {
            try {
                var rndPDFThumb = await Utils.createPDFThumb(rndFilename, Utils.rndString(16))
                resolve(rndPDFThumb)
            } catch (error) {
                reject(error)
            }
        } else {
            reject("Filetype does not support thumbnails")
        }
    })

    try {
        var thumbnailResult = await thumbnail
        console.log("Thumbnail:")
        console.log(thumbnailResult)
        database.logUpload(req.body.key, rndFilename, deletionKey, thumbnailResult) // Log file upload with thumbnail
    } catch (error) { // ! File does not support thumbnails, or something went wrong and not thumbnail could be created
        console.log("No thumbnail was created:")
        console.log(error)
        database.logUpload(req.body.key, rndFilename, deletionKey) // Log file upload without thumbnail
    }
}