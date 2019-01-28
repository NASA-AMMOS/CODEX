var path = require('path');
var webpack = require('webpack');

module.exports = {
  devtool: 'cheap-module-eval-source-map',
  entry: {
    examples: [
      'webpack-hot-middleware/client',
      path.join(__dirname, 'src/examples'),
    ],
    autocomplete: path.join(__dirname, 'src'),
  },
  output: {
    path: path.join(__dirname, 'dist'),
    filename: '[name].dev.bundle.js',
    publicPath: '/static/',
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new webpack.OldWatchingPlugin(),
    new webpack.NoErrorsPlugin(),
  ],
  postcss: [
    require('postcss-nested'),
    require('postcss-custom-properties'),
    require('postcss-color-function'),
  ],
  module: {
    loaders: [{
      test: /\.jsx?/,
      loaders: ['babel'],
      exclude: /node_modules/,
    }, {
      test: /\.css/,
      loaders: [
        'style',
        'css?module&importLoaders=1&localIdentName=[name]-[local]-[hash:4]',
        'postcss',
      ],
    }, {
      test: /\.(png|jpe?g)$/,
      loaders: ['file'],
    }],
  },
};
