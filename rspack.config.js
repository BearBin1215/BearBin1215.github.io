const path = require('path');
const { rspack } = require('@rspack/core');
const { TsCheckerRspackPlugin } = require('ts-checker-rspack-plugin');

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

module.exports = {
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
          rspack.CssExtractRspackPlugin.loader,
          'css-loader',
          postCssLoader,
        ],
      },
      {
        test: /\.s[ac]ss$/i,
        use: [
          rspack.CssExtractRspackPlugin.loader,
          'css-loader',
          postCssLoader,
          'sass-loader',
        ],
      },
      {
        test: /\.less$/,
        assert: { type: 'string' },
        type: 'asset/source',
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
    new rspack.HtmlRspackPlugin({
      template: './public/index.html',
      favicon: './public/favicon.ico',
    }),
    new rspack.CssExtractRspackPlugin({}),
    new TsCheckerRspackPlugin(),
  ],
  devServer: {
    'static': './dist',
    port: 8090,
    open: true,
    hot: true,
  },
  devtool: 'source-map',
  optimization: {
    minimize: true,
    minimizer: [
      new rspack.SwcJsMinimizerRspackPlugin({
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
