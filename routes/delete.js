const { getFileName } = require("../middleware/database")

const fs = require("fs")

module.exports = {
    handleDelete: async function(req, res) { // Serve confirmation page for deleting
        console.log(req.params.deletionkey)
        try {
            var filename = await getFileName(req.params.deletionkey) // Get filename associated with deletionkey

            return res.render("delete.html", {
                filename: filename,
                deletionKey: req.params.deletionkey
            })
        } catch (error) { // Invalid deletionkey
            console.log(error)
            return res.send("Invalid deletionkey")
        }
        console.log(filename)
    },
    handleDeletePOST: async function(req, res) { // Delete the file
        console.log(`Form deletionkey: ${req.body.deletionkey}`)
        try {
            var filename = await getFileName(req.body.deletionkey) // Get filename associated with deletionkey
        } catch (error) { // Invalid deletionkey, promise reject
            console.log(error)
            return res.send("Invalid deletionkey")
        }
        if(filename) {
            console.log(`Deleting: ${filename}`)

            fs.unlink(`./public/u/${filename}`, (error) => {
                if (error) {
                    console.log(error)
                    return res.send("Something went wrong with deleting the file")
                }

                console.log(`Successfully deleted: ${filename}`)
                return res.render("deleted.html", {
                    filename: filename,
                    deletionKey: req.params.deletionkey
                })
            })

        }
    }
}