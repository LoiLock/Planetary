const { getFileName } = require("../middleware/database")

const fs = require("fs")
var database = require("../middleware/database")

module.exports = {
    handleDelete: async function(req, res) { // Serve confirmation page for deleting
        console.log(req.params.deletionkey)
        try {
            var filename = await getFileName(req.params.deletionkey) // Get filename associated with deletionkey from DB

            return res.render("delete.html", { // Return confirmation screen for file deletion
                filename: filename,
                deletionKey: req.params.deletionkey
            })
        } catch (error) { // Invalid deletionkey
            console.log(error)
            return res.send("Invalid deletionkey")
        }
    },
    handleDeletePOST: async function(req, res) { // Delete the file using hidden input type form value
        console.log(`Form deletionkey: ${req.body.deletionkey}`)
        try {
            var filename = await getFileName(req.body.deletionkey) // Get filename associated with deletionkey
        } catch (error) { // Invalid deletionkey (No associated file was found), promise reject
            console.log(error)
            return res.send("Invalid deletionkey")
        }
        if(filename) { // If filename for file with deletionkey was found, delete the file
            console.log(`Deleting: ${filename}`)

            fs.unlink(`./public/u/${filename}`, async (error) => { // Delete file async
                if (error) { // File does not exist, or something else
                    console.log(error)
                    return res.render("deleted.html", {
                        filename: filename,
                        deletionKey: req.body.deletionkey,
                        message: "Already deleted file "
                    })
                }

                console.log(`Successfully deleted: ${filename}`)

                try {
                    var flagDeleted = await database.flagDelete(req.body.deletionkey)
                    return res.render("deleted.html", { // Show success screen if the file was successfully deleted
                        filename: filename,
                        deletionKey: req.body.deletionkey,
                        message: flagDeleted
                    })
                } catch (error) {
                    return res.status(500).send("Something went terribly wrong")
                }
            })
        }
    },
    handleDeleteSelection: async function(req, res) {
        var deletionkeys = req.body.keys // List of deletionkeys to delete
        for(const deletionkey of deletionkeys) { // For ...of waits for async await
            try {
                await database.flagDelete(deletionkey)
            } catch(error) {
                console.log(error)
            }
        }
        return res.json({
            message: "Deleted the file(s)"
        })
    }
}