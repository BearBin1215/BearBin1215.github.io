import path from 'path';
import { fileURLToPath } from 'url';
import { rspack } from '@rspack/core';
import { defineConfig } from '@rspack/cli';
import { TsCheckerRspackPlugin } from 'ts-checker-rspack-plugin';
import svgToMiniDataURI from 'mini-svg-data-uri';

/** esm中模拟cjs的__dirname */
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default (_, args) => defineConfig({
  entry: './src/index.tsx',
  output: {
    path: path.resolve(__dirname, 'dist'),
  },
  experiments: {
    css: true,
  },
  module: {
    rules: [
      {
        test: /\.[jt]sx?$/,
        exclude: /node_modules/,
        loader: 'builtin:swc-loader',
        options: {
          env: {
            targets: '> 0.5%, not dead',
          },
          jsc: {
            parser: {
              syntax: 'typescript',
              jsx: true,
            },
          },
        },
        type: 'javascript/auto',
      },
      {
        test: /\.txt$/,
        type: 'asset/source',
      },
      {
        test: /\.(s[ac]ss|less|css)$/i,
        oneOf: [
          {
            test: /\.inline\.(s[ac]ss|less|css)$/i,
            type: 'asset/source',
          },
          {
            type: 'css/auto',
            use: [
              {
                loader: 'builtin:lightningcss-loader',
                /** @type {import('@rspack/core').LightningcssLoaderOptions} */
                options: {
                  targets: args.mode !== 'development' ? '> 0.5%, not dead' : void 0,
                  minify: args.mode !== 'development',
                },
              },
              'less-loader',
            ],
          },
        ],
      },
      {
        test: /\.svg$/,
        oneOf: [
          // 在jsx中作为react组件引入
          {
            issuer: /\.[jt]sx$/,
            use: ['@svgr/webpack'],
          },
          {
            type: 'asset/inline',
            generator: {
              dataUrl: (content) => svgToMiniDataURI(content.toString()),
            },
          },
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
    new rspack.HtmlRspackPlugin({
      template: './public/index.html',
      favicon: './public/favicon.ico',
    }),
    ...(args.mode === 'development') ? [new TsCheckerRspackPlugin()] : [],
  ],
  devServer: {
    'static': './dist',
    port: 8090,
    open: true,
    hot: true,
  },
  devtool: (args.mode === 'development') ? 'source-map' : false,
  optimization: {
    minimize: args.mode !== 'development',
    minimizer: [
      new rspack.SwcJsMinimizerRspackPlugin({
        extractComments: false,
        minimizerOptions: {
          compress: {
            drop_console: true,
          },
        },
      }),
    ],
  },
  performance: {
    maxAssetSize: 1024 * 1024 * 10,
  },
});
