module.exports = {
  entry: ['babel-polyfill', './index.js'],
  module: {
    loaders: [
      {
        test: /\.js?$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
        options: {
          presets: ['env']
        }
      }
    ]
  },
  output: {
    path: __dirname + '/browser_build',
    publicPath: '/',
    libraryTarget: 'umd',
    filename: 'bson.js'
  },
  plugins: []
};
