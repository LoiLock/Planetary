module.exports = {
    rndString: function(length) {
        var rndStr = ""
        var charset =  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
        for (var i = 0; i < length; i++) {
            rndStr += charset.charAt(Math.floor(Math.random() * Math.floor(charset.length)))
        }
        return rndStr
    }
}