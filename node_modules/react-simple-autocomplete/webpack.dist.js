var path = require('path')
var webpack = require('webpack')
var Extract = require('extract-text-webpack-plugin')

module.exports = {
  devtool: 'source-map',
  entry: {
    'examples.min': path.join(__dirname, 'src/examples'),
    'simple-autocomplete': path.join(__dirname, 'src'),
    'simple-autocomplete.min': path.join(__dirname, 'src'),
  },
  output: {
    path: path.join(__dirname, 'dist'),
    filename: '[name].bundle.js',
    publicPath: '/static/',
  },
  plugins: [
    new webpack.optimize.OccurenceOrderPlugin(),
    new webpack.DefinePlugin({
      'process.env': {
        'NODE_ENV': JSON.stringify('production'),
      },
    }),
    new webpack.optimize.UglifyJsPlugin({
      compressor: { warnings: false },
      include: /\.min\./,
    }),
    new Extract('styles.min.bundle.css'),
  ],
  resolve: {
    modulesDirectories: ['app', 'node_modules'],
    extensions: ['', '.js', '.jsx', '.css'],
  },
  postcss: [
    require('postcss-nested'),
    require('postcss-custom-properties'),
    require('postcss-color-function'),
    require('cssnano'),
  ],
  module: {
    loaders: [{
      test: /\.jsx?/,
      loaders: ['babel'],
      exclude: /node_modules/,
    }, {
      test: /\.css/,
      loader: Extract.extract(
        'style',
        'css?module&importLoaders=1&localIdentName=[hash:3]!postcss'
      ),
    }, {
      test: /\.(png|jpe?g)$/,
      loaders: ['file'],
    }],
  },
};
