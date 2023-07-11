const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const path = require('path');

var main = {
  mode: process.env.DEVELOPMENT ? 'development' : 'production',
  target: 'electron-main',
  entry: {
    main: path.join(__dirname, 'main', 'index'),
    preload: path.join(__dirname, 'preload', 'index'),
  },
  output: {
    filename: '[name].js',
    path: __dirname,
  },
  node: {
    __dirname: false,
    __filename: false
  },
  module: {
    rules: [
      {
        test: /.ts$/,
        exclude: /node_modules/,
        loader: 'ts-loader',
      },
      {
        test: /.node$/,
        loader: 'node-loader',
      },
    ]
  },
  resolve: {
    extensions: ['.js', '.ts']
  },
};

var renderer = {
  mode: process.env.DEVELOPMENT ? 'development' : 'production',
  target: 'electron-renderer',
  entry: path.join(__dirname, 'renderer', 'components', 'index'),
  output: {
    filename: 'renderer.js',
    path: __dirname,
  },
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx', 'scss']
  },
  module: {
    rules: [
      {
        test: /\.(tsx|ts)$/,
        use: [
          'ts-loader'
        ],
        include: [
          path.resolve(__dirname, 'renderer'),
        ],
      },
      {
        test: /\.scss$/,
        use: [
          MiniCssExtractPlugin.loader,
          { loader: 'css-loader', options: { url: false } },
          'sass-loader',
        ],
      },
    ]
  },
  plugins: [
    new MiniCssExtractPlugin({ filename: 'styles.css' }),
  ],
};

module.exports = [
  main, renderer
];
