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


            // Keep file extension and generate a random filename
            var fileExt = path.extname(req.files.uploadfile.name)
            // ! FIXME, currently this only fixes russian characters, but does not account for files without extension
            if (fileExt == "") { //path.extname returns an empty string for Russian characters, so use the remaining name (the extension, e.g. .mp4) as the extension
                fileExt = req.files.uploadfile.name
            }
            var rndFilename = Utils.rndString(16) + fileExt
            var deletionKey = Utils.rndString(32)
            database.logUpload(req.body.key, rndFilename, deletionKey) // Log file upload

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