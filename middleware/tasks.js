var { exec } = require("child_process")
const { TIME } =  require("./utils")
var { getUserCount } = require("./database")


module.exports = {
    updateSiteInfo,
    latestSiteInfo
}

async function updateSiteInfo() { // Updates the website info
    try {
        // Create all promises
        var CommmitHashCommand = execPromise("git rev-parse HEAD")
        var ShortCommitHashCommand = execPromise("git rev-parse --short HEAD")
        var FileCountCommand = execPromise("ls public/u | wc -l")
        var FileSizeCommand = execPromise("du -s public/u")
        var FileSizeHumanCommand = execPromise("du -sh public/u")
        var UserCountPromise = getUserCount()

        var [CommitHash, ShortCommitHash, FileCount, FileSize, FileSizeHuman, UserCount] = await Promise.all([ // Wait for all promises to finish and then update the export
            CommmitHashCommand, ShortCommitHashCommand,
            FileCountCommand, FileSizeCommand, FileSizeHumanCommand, UserCountPromise
        ])
        // Remove tabs from du stdout
        FileSize = FileSize.split("\t")[0]
        FileSizeHuman = FileSizeHuman.split("\t")[0]
        module.exports.SiteInfo = {
            CommitHash,
            ShortCommitHash,
            FileCount,
            FileSize,
            FileSizeHuman,
            UserCount
        }
        updateSiteInfoLoop()
    } catch(error) {
        console.log(error) // Might be useful for the site admin, but it doesn't break anything
        updateSiteInfoLoop() // Just try again in 5 minutes ¯\_(ツ)_/¯
    }
}

function updateSiteInfoLoop() { // Update the website information every 5 minutes
    setTimeout(() => {
        updateSiteInfo()
    }, 5 * TIME.MINUTES);
}

// Returns a promise for a CLI command to be ran
function execPromise(command) {
    return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            if(error) {
                reject(error)
                return
            }
            resolve(stdout.trim())
        })
    })
}

function latestSiteInfo () { // Just returns the latest export
    return module.exports.SiteInfo
}