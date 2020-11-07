// Contains useful conversion functions

export function humanDate(unixTime) { // Takes unixtime in SECONDS and returns string in format: 4 September 2020
    var dateObject = new Date(unixTime * 1000)
    
    var dateString = dateObject.toLocaleString('en-GB', { day: 'numeric', month: 'numeric', year: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric'})
    return dateString
}

export function generateShareXConfig() { // Gets JWT token from localstorage, creates valid sharex profile, downloads it to the browser
    var JWTtoken = getCookieByName("token")
    var userString = atob(JWTtoken.split(".")[1])
    var userObj = JSON.parse(userString)

    var RequestURL = "http://localhost:3000/upload"
    var key = userObj.sharextoken
    var sharexConfig = // Define sharex structure
    {
        Name: "Planetary", // TODO: Set this to websitename
        DestinationType: "ImageUploader, TextUploader, FileUploader",
        RequestType: "POST",
        RequestURL,
        FileFormName: "uploadfile",
        Arguments: {
            type: "file",
            key
        },
        ResponseType: "Text",
        URL: "$json:Url$",
        DeletionURL: "$json:DeletionURL$"
    }

    createTextFile(`Planetary-${userObj.username}.sxcu`, JSON.stringify(sharexConfig, null, 2)) // Create the config file with pretty-fied json
}

export function getCookieByName(name) { // Get cookie by name
    var documentCookie = document.cookie
    var value = documentCookie.split(`; ${name}=`) // Get part with cookie name
    var parsedValue = value[0].replace(`${name}=`, "") // Remove cookie name and "=" sign and return only the cookie value
    return parsedValue
}


function createTextFile(filename, fileContent) { // Create and save file with content

    // Create temporary element, set data string as href, add download attribute, open this, remove temporary element
    var tempElem = document.createElement("a")
    tempElem.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(fileContent))
    tempElem.setAttribute('download', filename)
    tempElem.style.display = 'none'
    document.body.appendChild(tempElem)
    
    tempElem.click()
    
    document.body.removeChild(tempElem)
}