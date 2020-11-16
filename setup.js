var crypto = require('crypto')
const { stdin } = require("process")
const readline = require("readline")
const fs = require("fs")
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
})

var colors = {
    reset: function() {
        console.log("\x1b[0m")
    },
    underline: function() {
        console.log("\x1b[4m")
    },
    red: function() {
        console.log("\x1b[31m")
    },
    green: function() {
        console.log("\x1b[32m")
    },
    blue: function() {
        console.log("\x1b[34m")
    }
}

var newConfig = {}

async function main() {
    console.log("Current working directory:", process.cwd())
    if(!fs.existsSync("public/u/")) {
        console.log("Creating uploads folder")
        fs.mkdirSync("public/u/")
    }
    if(!fs.existsSync("public/thumbs/")) {
        console.log("Creating thumbnail folder")
        fs.mkdirSync("public/thumbs/")
    }
    if(!fs.existsSync("tmp/")) {
        console.log("Creating temp folder")
        fs.mkdirSync("tmp/")
    }

    console.log("Folders created!")
    console.log("Configuration:\n")
    await askSiteName()
    await askDescription()
    await askMaxUploadSize()
    await askPort()
    await askProtocol()
    await askDomain()
    await showConfirmation(newConfig)
    rl.close()
    await saveConfig()
}

// Gets name of site, if not valid, ask again
async function askSiteName() {
    return new Promise((resolve) => {
        colors.reset()
        rl.question('What is the name of the website? e.g. "Planetary"\nWebsite name: ', function(answer) {
            if(answer.trim() == "") {
                colors.red()
                console.log("Website name cannot be empty")
                return askSiteName()
            }
            colors.green()
            console.log('Set website name as: ' + answer.trim());
            colors.reset()
            newConfig.siteName = answer.trim()
            resolve()
        });
    })
}

// Asks what the site description should be
async function askDescription() {
    return new Promise((resolve) => {
        colors.reset()
        rl.question('What is description of the website? e.g. "A ShareX server"\nDescription: ', function(answer) {
            if(answer.trim() == "") {
                colors.red()
                console.log("Description cannot be empty")
                return askDescription()
            }
            colors.green()
            console.log('Set description as: ' + answer.trim());
            colors.reset()
            newConfig.siteDescription = answer.trim()
            return resolve()
        });
    })
}

// Asks for the max filesize anyone can upload
async function askMaxUploadSize() {
    return new Promise((resolve) => {
        colors.reset()
        rl.question('Max filesize that can be upload in MB\nFilesize (MB): ', function(answer) {
            if(isNaN(answer.trim() || answer.trim() == "") || parseInt(answer.trim() < 1)) {
                colors.red()
                console.log("Must be a number")
                return askMaxUploadSize()
            }
            colors.green()
            console.log('Set max uploadsize as: ' + answer.trim() + "MB");
            colors.reset()
            newConfig.fileSizeLimitMB = parseInt(answer.trim())
            return resolve()
        });
    })
}

// Asks what port the site will be running on
async function askPort() {
    return new Promise((resolve) => {
        colors.reset()
        rl.question('On what port will this be running? e.g. 3000\nPort: ', function(answer) {
            if(!isValidPort(answer.trim())) {
                colors.red()
                console.log("Port cannot be empty and has to be a number between 1024 and 65535")
                return askPort()
            }
            colors.green()
            console.log('Set Server port as: ' + answer.trim());
            colors.reset()
            newConfig.port = parseInt(answer.trim())
            return resolve()
        });
    })
}

// Asks if site is using https or not
async function askProtocol() {
    return new Promise((resolve) => {
        colors.reset()
        rl.question('Have you set up https?"\ny) Yes\nn) No\nyes/no: ', function(answer) {
            colors.green()
            if(answerNo(answer.trim())) {
                newConfig.protocol = "http://"
                console.log('Set protocol as: http://');
                return resolve()
            } else if(answerYes(answer.trim())) {
                newConfig.protocol = "https://"
                console.log('Set protocol as: https://');
                return resolve()
            } else {
                return askProtocol()
            }
        });
    })
}

// Asks what the domain for the website is
async function askDomain() {
    return new Promise((resolve) => {
        colors.reset()
        rl.question('What is domain of the website? e.g. example.com\nDomain: ', function(answer) {
            if(answer.trim() == "") {
                colors.red()
                console.log("Domain cannot be empty")
                return askDomain()
            }
            colors.green()
            console.log('Set Domain as: ' + answer.trim());
            colors.reset()
            newConfig.serverURL = answer.trim()
            return resolve()
        });
    })
}

// Shows summary of all the data entered
async function showConfirmation() {
    colors.underline()
    colors.blue()
    console.log("Configuration overview:")
    colors.reset()
    console.log(newConfig)
    return new Promise((resolve) => {
        rl.question('Is the information entered above correct?: ', function(answer) {
            colors.reset()
            if(answerNo(answer.trim())) {
                colors.red()
                console.log('Starting over');
                colors.reset()
                newConfig = {}
                main()
                return resolve()
            } else if(answerYes(answer.trim())) {
                colors.green()
                console.log('OK');
                colors.reset()
                return resolve()
            } else {
                return showConfirmation()
            }
        });
    })
}

async function saveConfig() {
    colors.blue()
    console.log("Generating secret key...")
    colors.reset()
    newConfig.secretToken = generateSecretKey()
    var configString = JSON.stringify(newConfig, null, 4)
    fs.writeFile("config.json", configString, (error) => {
        if(error) {
            colors.red()
            console.error(error)
            colors.reset()
            return
        }
        colors.green()
        console.log("Created config file!")
        colors.reset()
    })
}


// Generates 64Bytes (512bits) key for JWT signing
function generateSecretKey() {
    return crypto.randomBytes(64).toString('hex');
}

function isValidPort(port) {
    return !(port == "" || isNaN(port) || parseInt(port, 10) <= 1023 || parseInt(port, 10) > 65535 || parseInt(port, 10) < 0)
}
function answerNo(answer) {
    var answer = answer.toLowerCase()
    return (answer == "n" || answer == "no")
}
function answerYes(answer) {
    var answer = answer.toLowerCase()
    return (answer == "y" || answer == "yes")
}
main()