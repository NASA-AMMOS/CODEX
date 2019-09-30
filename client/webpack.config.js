"use strict";

const path = require("path");
const paths = require("./config/paths");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const webpack = require("webpack");

module.exports = {
    mode: "development",
    entry: ["webpack-hot-middleware/client?reload=true", "babel-polyfill", "./src/index.js"],
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
                use: [
                    {
                        loader: "babel-loader"
                    },
                    "eslint-loader"
                ]
            },
            {
                test: /\.(css|scss)$/,
                use: [
                    "style-loader",
                    "@teamsupercell/typings-for-css-modules-loader",
                    "css-loader",
                    "sass-loader"
                ]
            },
            {
                test: /\.(png|jpg|gif|eot|ttf|woff|woff2)$/,
                loader: "file-loader"
            },
            {
                test: /\.svg$/,
                use: [
                    {
                        loader: "babel-loader"
                    },
                    {
                        loader: "react-svg-loader",
                        options: {
                            jsx: true // true outputs JSX tags
                        }
                    }
                ]
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
