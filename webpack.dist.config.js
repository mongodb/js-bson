const webpack = require('webpack'),
  PolyfillsPlugin = require('webpack-polyfills-plugin');

module.exports = {
  entry: [
    'babel-polyfill',
    './index.js'
  ],
  module: {
    loaders: [
      {
        test: /\.js?$/,
        exclude: /node_modules/,
        loader: 'babel'
      },
    ]
  },
  resolve: {
    extensions: ['', '.js', '.jsx', '.less']
  },
  output: {
    path: __dirname + '/browser_build',
    publicPath: '/',
    libraryTarget: 'umd',
    filename: 'bson.js'
  },
  plugins: []
};
