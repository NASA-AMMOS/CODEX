"use strict";

const merge = require("webpack-merge");
const common = require("./webpack.common.js");

module.exports = merge(common, {
    mode: "production",
    entry: ["./src/index.js"],
    plugins: [
        new webpack.EnvironmentPlugin({ CODEX_SERVER_URL: "https://codex.jpl.nasa.gov/server" })
    ]
});
