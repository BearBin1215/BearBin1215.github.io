const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');

const postCssLoader = {
  loader: 'postcss-loader',
  options: {
    postcssOptions: (loader) => ({
      plugins: [
        [
          'autoprefixer',
        ],
        ...(loader.mode === 'production' ? [['cssnano', { preset: 'default' }]] : []),
      ],
    }),
  },
};

module.exports = (_, argv) => ({
  mode: argv.mode,
  entry: './src/index.tsx',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        use: 'ts-loader',
      },
      // {
      //   test: /\.(js|jsx)$/,
      //   exclude: /node_modules/,
      //   use: {
      //     loader: 'babel-loader',
      //     options: {
      //       presets: ['@babel/preset-env', '@babel/preset-react'],
      //     },
      //   },
      // },
      {
        test: /\.css$/,
        use: [
          'style-loader',
          'css-loader',
          postCssLoader,
        ],
      },
      {
        test: /\.(png|jpe?g|gif)/,
        type: 'asset/resource',
      },
      {
        test: /\.s[ac]ss$/i,
        use: [
          'style-loader',
          'css-loader',
          postCssLoader,
          'sass-loader',
        ],
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'], // 添加 .ts 和 .tsx 扩展名
    alias: {
      '@': path.resolve(__dirname, 'src/'),
    },
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html',
    }),
  ],
  devServer: {
    'static': './dist',
    port: 8090,
  },
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        extractComments: false,
        terserOptions: {
          output: {
            comments: false,
          },
          compress: {
            drop_console: true,
          },
        },
      }),
    ],
  },
});
