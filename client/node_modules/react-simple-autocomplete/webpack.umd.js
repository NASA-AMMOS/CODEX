var path = require('path');
var webpack = require('webpack');

module.exports = {
  entry: {
    'simple-autocomplete': path.join(__dirname, 'src'),
    'simple-autocomplete.min': path.join(__dirname, 'src'),
  },
  output: {
    path: path.join(__dirname, 'build'),
    filename: '[name].js',
    publicPath: '/static/',
    library: 'SimpleAutocomplete',
    libraryTarget: 'umd',
  },
  externals: {
    'react': {
      root: 'React',
      commonjs2: 'react',
      commonjs: 'react',
      amd: 'react',
    },
    'react-dom': {
      root: 'ReactDOM',
      commonjs2: 'react-dom',
      commonjs: 'react-dom',
      amd: 'react-dom',
    },
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
  ],
  resolve: {
    modulesDirectories: ['app', 'node_modules'],
    extensions: ['', '.js', '.jsx', '.css'],
  },
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
        'css?module&importLoaders=1&localIdentName=[hash:3]',
        'postcss',
      ],
    }, {
      test: /\.(png|jpe?g)$/,
      loaders: ['file'],
    }],
  },
};
