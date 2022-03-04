const R = require("ramda");
const dotenv = require("dotenv");
const path = require("path");
const WebpackBar = require("webpackbar");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const { EnvironmentPlugin, ProvidePlugin } = require("webpack");
const CompressionPlugin = require("compression-webpack-plugin");
const zlib = require("zlib");

// Load environment files from .env files
dotenv.config();

const isDevelopment = process.env.NODE_ENV !== "production";

// Pick environment variables start with RODONES_MAP_ (RODONES_MAP_EXAMPLE)
const environment = R.pickBy(R.flip(R.startsWith(`RODONES_MAP_`)), process.env);
environment.RODONES_MAP_BUILT_DATE = new Date().toUTCString();

module.exports = {
  mode: isDevelopment ? "development" : "production",
  devtool: isDevelopment ? "eval-source-map" : false,
  entry: {
    index: "./src/index.js",
  },
  module: {
    rules: [
      {
        test: /\.js$/i,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-env"],
            plugins: [["@babel/plugin-transform-runtime"]],
          },
        },
      },
    ],
  },
  resolve: {
    extensions: [".js"],
  },
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "[name].bundle.js",
  },
  stats: {
    modules: false,
  },
  devServer: {
    compress: true,
    open: false,
    hot: true,
    static: {
      directory: path.resolve(__dirname, "./public"),
      publicPath: "/",
    },
  },
  plugins: R.filter(R.identity, [
    new ProvidePlugin({
      process: "process/browser",
    }),
    new EnvironmentPlugin(environment),
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, "src", "index.html"),
      templateParameters: environment,
    }),
    new WebpackBar(),
    new CopyWebpackPlugin({
      patterns: [{ from: "public" }],
    }),
    new CompressionPlugin({
      filename: "[path][base].br",
      algorithm: "brotliCompress",
      test: /\.(js|css|html|svg)$/,
      compressionOptions: {
        params: {
          [zlib.constants.BROTLI_PARAM_QUALITY]: 11,
        },
      },
      threshold: 10240,
      minRatio: 0.8,
      deleteOriginalAssets: false,
    }),
  ]),
};
