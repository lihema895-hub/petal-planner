
const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
  mode: "development",
  entry: "./src/js/index.js",

  output: {
    filename: "bundle.js",
    path: path.resolve(__dirname, "dist"),
    clean: true,
  },

  module: {
   rules: [
  {
    test: /\.css$/i,
    type: "javascript/auto",
    use: ["style-loader", "css-loader"],
  },
],

  },

  plugins: [
    new HtmlWebpackPlugin({
      template: "./src/template.html",
    }),
  ],

  devServer: {
    static: "./dist",
    open: true,
  },
};
