const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');

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

module.exports = (_, argv) => {
  const isDevelopment = argv.mode === 'development';
  return {
    mode: argv.mode,
    entry: './src/index.tsx',
    output: {
      path: path.resolve(__dirname, 'dist'),
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          exclude: /node_modules/,
          use: 'ts-loader',
        },
        {
          test: /\.css$/i,
          use: [
            isDevelopment ? 'style-loader' : MiniCssExtractPlugin.loader, // 开发模式下使用style-loader
            'css-loader',
            postCssLoader,
          ],
        },
        {
          test: /\.s[ac]ss$/i,
          use: [
            isDevelopment ? 'style-loader' : MiniCssExtractPlugin.loader, // 开发模式下使用style-loader
            'css-loader',
            postCssLoader,
            'sass-loader',
          ],
        },
        {
          test: /\.(png|jpe?g|gif)/,
          type: 'asset/resource',
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
        favicon: './public/favicon.ico',
      }),
      new MiniCssExtractPlugin(),
      new CleanWebpackPlugin(),
      new ForkTsCheckerWebpackPlugin(),
    ],
    devServer: {
      'static': './dist',
      port: 8090,
      open: true,
      hot: true,
    },
    devtool: isDevelopment ? 'source-map' : false,
    optimization: {
      minimize: !isDevelopment,
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
  };
};
