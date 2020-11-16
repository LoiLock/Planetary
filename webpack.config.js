var path = require("path")

module.exports = {
    entry: './public/js/client.js',
    output: {
        filename: "dist.js",
        path: path.resolve(__dirname, "public/js", "dist")
    },
    optimization: {
        minimize: true
    }
}