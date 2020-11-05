// Contains useful conversion functions

export function humanDate(unixTime) { // Takes unixtime in SECONDS and returns string in format: 4 September 2020
    var dateObject = new Date(unixTime * 1000)
    
    var dateString = dateObject.toLocaleString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric'})
    return dateString
}