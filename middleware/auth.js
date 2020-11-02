const argon2 = require("argon2")
const { argon2i, argon2d, argon2id, defaults, limits } = argon2
const jwt = require("jsonwebtoken");


const Utils = require("./utils")
var config = require("../config.json")
var database = require("./database")


module.exports = {
    registerUser: async function(req, res) { // ? Create hash, create sharex token, send to database
        console.log(req.body)
        var sharexToken = Utils.rndString(20)

        try {
            hash = await argon2.hash(req.body.password, { type: argon2id, timeCost: 30, memoryCost: 1 << 14 }) // Hash users password
        } catch(error) {
            console.error(error)
        }
        var username = req.body.username
        username = username.toLowerCase()
        database.addUser(username, hash, sharexToken)
        console.log(hash)
        // TODO: Add response
    },

    isTokenValid: function(req, res, next) { // Middleware for express.js, check is JWT token is valid, and if so use next() to continue to the handler function of the protected route, if not, send back to login screen
        // database.verifyUser
        console.log(req.cookies)
        if (!req.cookies.token) { // Token cookie isn't set, redirect to login page
            return res.redirect(301, '/login')
        }
        jwt.verify(req.cookies.token, config.secretToken, (error, user) => {
            if (error) { // Invalid token
                return res.redirect(301, '/login')
            }
            // Valid token
            req.user = user
            next()
        })

    },

    loginUser: async function(req, res) { // Gives JWT token back to user if the password hash matches the one in the database
        console.log(req.body)
        database.verifyUser((req.body.username).toLowerCase(), async function(user) { // returns a 'user' object, if this is empty, the user does not exist. If it does exist > verify passwordhash
            if (!user) {
                res.json({
                    success: false,
                    message: "Invalid login"
                })
                return
            }
            console.log("USEROBJECT:")
            console.log(user)
            try {
                if (await argon2.verify(user.phash, req.body.password, { type: argon2id, timeCost: 30, memoryCost: 1 << 14 })) {
                    // passwords matched, generate JWT token
                    console.log("reached")
                    var JWTtoken = jwt.sign({username: user.username, isAdmin: user.isAdmin}, config.secretToken, { expiresIn: "1h" })
                    console.log(JWTtoken)
                    res.json({
                        success: true,
                        token: JWTtoken
                    })
                } else {
                    // passwords did not match
                    res.json({
                        success: false,
                        message: "Invalid login"
                    })
                }
            } catch(err) {

            }
        })
    },
    generateJWT: function(userObject) { // Sign a JWT token
        console.log("reached")
        return 
    }
}