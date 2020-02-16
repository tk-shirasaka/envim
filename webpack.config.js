const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const path = require('path');

var main = {
  mode: 'development',
  target: 'electron-main',
  entry: path.join(__dirname, 'main', 'index'),
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'main')
  },
  node: {
    __dirname: false,
    __filename: false
  },
  module: {
    rules: [{
      test: /.ts$/,
      include: [
        path.resolve(__dirname, 'main'),
      ],
      exclude: [
        path.resolve(__dirname, 'node_modules'),
      ],
      loader: 'ts-loader',
    }]
  },
  resolve: {
    extensions: ['.js', '.ts']
  },
};

var renderer = {
  mode: 'development',
  target: 'electron-renderer',
  entry: path.join(__dirname, 'renderer', 'components', 'index'),
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'renderer')
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
          path.resolve(__dirname, 'node_modules'),
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
    new MiniCssExtractPlugin({ filename: '../styles.css' }),
  ],
};

module.exports = [
  main, renderer
];
