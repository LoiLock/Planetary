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

        // TODO: Make this a Utils function, checks if post body fields are set or empty or less than 8 in length
        if (!req.body.password || !req.body.username) {
            return res.status(400).json({
                success: false,
                message: "Missing fields"
            })
        }
        if(req.body.password == "" || req.body.password.length < 8) {
            return res.json({
                success: false,
                message: "Password is too short"
            })
        }

        try {
            hash = await argon2.hash(req.body.password, { type: argon2id, timeCost: 30, memoryCost: 1 << 14 }) // Hash users password
            var username = req.body.username
            username = username.toLowerCase()
            try {
                var result = await database.addUser(username, hash, sharexToken)
                if (result) {
                    return res.json({
                        success: true,
                        message: "Registered successfully"
                    })
                }
            } catch (error) { // We're just gonna assume here that it's a SQLITE_CONSTRAINT error for the unique username field
                return res.json({
                    success: false,
                    message: "User already exists"
                })
            }
        } catch(error) {
            console.log(error)
        }
        
        // console.log(hash)
        // TODO: Add response
    },

    isTokenValid: function(req, res, next) { // * Middleware for express.js, check is JWT token is valid, and if so use next() to continue to the handler function of the protected route, if not, send back to login screen
        if(req.originalUrl == "/login") { // ? If the user is on the /login route, don't put him in a redirect loop. Verify his token and send him back
            jwt.verify(req.cookies.token, config.secretToken, (error, user) => {
                if (error) { // Invalid token
                    return next() // Continue to the route handler if the cookie was invalid
                }
                return res.redirect(302, '/dashboard') // Valid token/cookie, send user to dashboard
            })
            return
        }

        if (!req.cookies.token) { // Token cookie isn't set, redirect to login page
            return res.redirect(302, '/login')
        }
        jwt.verify(req.cookies.token, config.secretToken, (error, user) => {
            if (error) { // Invalid token
                return res.redirect(302, '/login')
            }
            // Valid token
            req.user = user // Allows us to access signed JWT token user object from the routehandler function
            next()
        })

    },

    loginUser: async function(req, res) { // Gives JWT token back to user if the password hash matches the one in the database
        console.log(req.body)

        // TODO: Make this a Utils function, checks if post body fields are set or empty or less than 8 in length
        if (!req.body.password || !req.body.username) {
            return res.status(400).json({
                success: false,
                message: "Missing fields"
            })
        }
        if(req.body.password == "" || req.body.password.length < 8) {
            return res.json({
                success: false,
                message: "Invalid login"
            })
        }

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
                    var JWTtoken = jwt.sign({username: user.username, isAdmin: user.isAdmin, sharextoken: user.sharextoken}, config.secretToken, { expiresIn: "1h" })
                    console.log(JWTtoken)
                    // set cookie
                    res.cookie("token", JWTtoken, {
                        expiresIn: 60 * 60 * 1000 // Cookie expires after 1 hour, just like the JWT token
                    })
                    return res.json({
                        success: true,
                        message: "Logged in. Redirecting..."
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