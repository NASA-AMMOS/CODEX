"use strict";

const webpack = require("webpack");
const merge = require("webpack-merge");
const common = require("./webpack.common.js");
const CopyWebpackPlugin = require("copy-webpack-plugin");

module.exports = merge(common, {
    mode: "production",
    entry: ["./src/index.js"],
    plugins: [new CopyWebpackPlugin({ patterns: [{ from: "src/public", to: "public" }] })]
});
