var database = require("../middleware/database")

module.exports = {
    handleAdmin: async function(req, res) {
        if(req.user.isAdmin !== 1) { return res.redirect(302, '/dashboard') }
        const [users, uploads] = await getAll()
        var dbCollection = {
            users,
            uploads
        }
        // console.log(dbCollection)
        res.render("admin.html", { db: dbCollection})
    }
}

async function getAll() { // Returns all users, and all uploads
    return new Promise(async (resolve, reject) => {
        var users = await database.getAllUsers()
        var uploads = await database.getAllUploads()
        resolve([users, uploads])
    })
}