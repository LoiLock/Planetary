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
    optimizeMP4,
    getIP
}

module.exports.TIME = {
    SECONDS: 1000,
    MINUTES: 60 * 1000,
    HOUR: 60 * 60 * 1000
}

async function createVideoThumb(inputFile, outputFile) {
    var data = new Promise((resolve, reject) => {
        ffmpeg('public/u/' + inputFile)
        .videoCodec('libx264')
        .outputOptions("-crf 30")
        .outputOptions("-maxrate 600k")
        .outputOptions("-bufsize 1M")
        .outputOptions("-movflags +faststart")
        .outputOptions("-pix_fmt yuv420p") // Mainly for gifs, firefox doesn't support it
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
    })

    var res = await data
    return res
}

// Assumes the server has libvips installed, otherwise it wll error out and continue as if it were a regular file
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

// Assumes the server has graphicsmagick or imagemagick 7 installed, other wise it will error out and continue as if it were a regular file
async function createPDFThumb(inputFile, outputFile) {
    var data = new Promise((resolve, reject) => {
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


function getIP (req) {  // Give a request object, it will return the client's IP
    return req.headers['x-forwarded-for'] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    (req.connection.socket ? req.connection.socket.remoteAddress : null);
}


async function getDirectoryFromPath(obj, path) {
    return new Promise((resolve, reject) => {
        var currentDirectory = obj
        /*
            Example for full urlpath: /videos/documentaries
    
            First iteration it will go over data.children (where .name == "videos" and "music")
            it will find videos and set that as the new currentDirectory
            
            Second iteration it will find the first occurance of "videos"'s children and check the second part of the urlpath
            (/documentaries/)
            It will find this and set that as the new currentDirectory
            
        */
        for (let i = 0; i < path.length; i++) { // For all paths. e.g.: /videos/documentaries ["videos", "documentaries"]
            var foundPath = currentDirectory.children.find(currentChild => { // In the currentDirectory's children array, look for child where the name property matches the current url-part
                return currentChild.name == path[i]
            });
            if (foundPath && foundPath.children) { // If currentDirectory has a child with the same .name as the current url-part, set currentDirectory to that object part
                currentDirectory = foundPath
            } else {
                const validPath = foundPath ? currentDirectory : undefined // if /documentaries/ AND /videos/ (or whatever the previous path is) are correctly spelled. Otherwise /videos/doScusdfsd/ falls back onto /videos
                return resolve(validPath)
            }
        }
        // console.log("Found directory:", currentDirectory)
        return resolve(currentDirectory)
    })
}

// // Add folder called memes in /videos/movies: addEntryAtPath(userAlbum, "/videos/movies", "memes")
// /* Add file to folder called /videos/movies: addEntryAtPath(userAlbum, "/videos/movies", null, false {
//     type: "file",
//     name: "buEciCHeLlNK7ZKL.mp3",
//     thumbnail: "s1vJFqhPZYLyuX4h.opus",
//     unixtime: "1605795678",
//     path: "/videos/movies/buEciCHeLlNK7ZKL.mp3"
// })



// */
// async function addEntryAtPath(obj, path, directoryname, isFolder, fileobject) {
//     path = path.split("/")
//     console.log("path:")
//     console.log(path)
//     return new Promise((resolve, reject) => {
//         var userAlbum = obj // userAlbum is the user's directory data object
//         console.log(userAlbum)
//         var tempObject = userAlbum.data
//         if (path[0] == "") { // If directory is created at the root, no need to search the rest
//             tempObject.children.push( {
//                 type: "folder",
//                 name: directoryname,
//                 path: "/" + directoryname,
//                 children: []
//             })
//         } else {
//             var objectWalker = tempObject
//             for (let i = 0; i < path.length; i++) {
//                 var foundChild = tempObject.children.find(currentChild => { // In the currentDirectory's children array, look for child where the name property matches the current url-part
//                     return currentChild.name == path[i]
//                 });
//                 if (foundChild && tempObject.children) { // If current level has child that matches current path level name
//                     objectWalker = foundChild
//                 }
//             }
//             if (isFolder) {
//                 objectWalker.children.push({
//                     type: "folder",
//                     name: directoryname,
//                     path: "/" + directoryname,
//                     children: []
//                 })
//             } else {
//                 objectWalker.children.push(fileobject)
//             }
//         }



//         userAlbum.data = tempObject

//         // console.log("Useralbum:")
//         // console.log(JSON.stringify(userAlbum, null, 4))
//         console.log(userAlbum)
//         resolve(userAlbum)
//     })
// }