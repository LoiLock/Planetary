var ffmpeg = require("fluent-ffmpeg")
var sharp =  require('sharp')

module.exports = {
    rndString: function(length) {
        var rndStr = ""
        var charset =  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
        for (var i = 0; i < length; i++) {
            rndStr += charset.charAt(Math.floor(Math.random() * Math.floor(charset.length)))
        }
        return rndStr
    },
    createVideoThumb,
    createImageThumb
}

async function createVideoThumb(inputFile, outputFile) {
    var data = new Promise((resolve, reject) => {
        ffmpeg('public/u/' + inputFile)
        .videoCodec('libx264')
        .outputOptions("-crf 30")
        .outputOptions("-maxrate 600k")
        .outputOptions("-bufsize 1M")
        .outputOptions("-movflags +faststart")
        .audioCodec('aac')
        .audioBitrate('96k')
        .fps('24')
        .size('300x300')
        .outputOptions('-t 10')
        .on('start', (commandline) => {
            console.log(commandline);
        })
        .on('error', (error) => {
            reject(error)
        })
        .on('end', () => {
            resolve(outputFile + '.mp4') // resolve with random filename
        })
        .save('public/thumbs/' + outputFile + '.mp4')
        // .videoBitrate('450k')
    })
    var res = await data
    return res
}

async function createImageThumb(inputFile, outputFile) {
    var data = new Promise((resolve, reject) => {
        sharp('public/u/' + inputFile).jpeg({
            quality: 75,
            progressive: true
        })
        .resize(300, 300, {
            fit: 'cover'
        })
        .toFile('public/thumbs/' + outputFile + '.jpg', (error, info) => {
            if (error) {
                reject(error)
            }
            console.log(info)
            resolve(outputFile + '.jpg')
        })
    })
    var res = await data
    return res
}

// async function createSoundThumb(inputFile, outputFile)