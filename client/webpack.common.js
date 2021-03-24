"use strict";

const path = require("path");
const paths = require("./config/paths");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const webpack = require("webpack");

module.exports = {
    output: {
        path: path.resolve(__dirname, "dist"),
        filename: "bundle.js"
    },
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
                test: /styles\/\.(css|scss)$/,
                include: [path.resolve(__dirname, "styles")],
                use: ["@teamsupercell/typings-for-css-modules-loader"]
            },
            {
                test: /\.(css|scss)$/,
                use: ["style-loader", "css-loader", "sass-loader"]
            },
            {
                test: /\.(png|jpg|gif|eot|ttf|woff|woff2|fnt)$/,
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
        new webpack.DefinePlugin({
            "process.browser": "true"
        })
    ],
    resolve: {
        // modules: [
        //     path.resolve("./src"),
        //     path.resolve("./node_modules"),
        //     path.resolve("./src/react-cristal/src")
        // ],
        extensions: [".ts", ".tsx", ".js", ".json"]
    },
    node: {
        fs: "empty",
        net: "empty",
        tls: "empty"
    }
};
