"use strict";

const path = require("path");
const paths = require("./config/paths");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const webpack = require("webpack");

module.exports = {
    mode: "development",
    entry: ["webpack-hot-middleware/client?reload=true", "./src/index.js"],
    output: {
        path: path.resolve(__dirname, "dist"),
        filename: "bundle.js",
        globalObject: "this" //hack to make hot reloading work (https://github.com/webpack/webpack-dev-server/issues/628)
    },
    devServer: {
        contentBase: "./src",
        watchContentBase: true,
        inline: true,
        port: 3000,
        hot: true
    },
    devtool: "cheap-module-source-map",
    module: {
        rules: [
            { test: /\.ts(x?)$/, loader: "ts-loader" },

            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: "babel-loader"
                }
            },
            {
                test: /\.css$/,
                use: ["style-loader", "css-loader"]
            },
            {
                test: /\.(png|jpg|gif|svg|eot|ttf|woff|woff2)$/,
                loader: "file-loader"
            }
        ]
    },
    plugins: [
        new HtmlWebpackPlugin({
            inject: true,
            template: paths.appHtml
        }),
        new webpack.HotModuleReplacementPlugin()
    ],
    resolve: {
        modules: [
            path.resolve("./src"),
            path.resolve("./node_modules"),
            path.resolve("./src/react-cristal/src")
        ],
        extensions: [".ts", ".tsx", ".js", ".json"]
    }
};
