var ffmpeg = require("fluent-ffmpeg");
const { resolve } = require("path");
var sharp =  require('sharp')
var fs = require('fs')
  , gm = require('gm').subClass({imageMagick: true});

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
    createImageThumb,
    createSoundThumb,
    createPDFThumb,
    optimizeMP4
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
        .videoFilters('setdar=1:1')
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

async function createSoundThumb(inputFile, outputFile) {
    var data = new Promise((resolve, reject) => {
        ffmpeg('public/u/' + inputFile)
        .audioCodec('libopus')
        .audioBitrate('80k')
        .outputOptions("-compression_level 6")
        .outputOptions('-t 10')
        .on('start', (commandline) => {
            console.log(commandline);
        })
        .on('error', (error) => {
            reject(error)
        })
        .on('end', () => {
            resolve(outputFile + '.opus') // resolve with random filename
        })
        .save('public/thumbs/' + outputFile + '.opus')
    })
    var res = await data
    return res
}

async function createPDFThumb(inputFile, outputFile) {
    var data = new Promise((resolve, reject) => {
        console.log("sdkfhsdjfhskjdf")
        gm('public/u/' + inputFile + '[0]')
        .setFormat("jpg")
        .resize(250)
        .quality(70)
        .interlace("Plane")
        .background('White')
        .in('-layers', 'flatten')
        .write('public/thumbs/' + outputFile + '.jpg', (error) => {
            if (error) {
                reject(error)
            }
            resolve(outputFile + '.jpg')
        })
    })

    var res = await data
    return res
}

// Moves mp4's MOOV atom to the beginning of the file so it can start streaming immediately
// This function adds roughly 1-2 seconds of delay to a 3 hour long mp4 that's 358MB
async function optimizeMP4(tempfile, filename) {
    var data = new Promise((resolve, reject) => {
        ffmpeg(tempfile)
        .outputOptions('-c copy')
        .outputOptions("-movflags +faststart")
        .on('start', (commandline) => {
            console.log(commandline);
        })
        .on('error', (error) => {
            reject(error)
        })
        .on('end', () => {
            resolve(filename) // resolve with random filename
        })
        .save('public/u/' + filename)
    })
    var res = await data
    return res
}