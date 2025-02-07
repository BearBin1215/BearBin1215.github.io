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

/** @returns {import('@rspack/core').RspackOptions} */
module.exports = (_, args) => {
  const isDevelopment = args.mode === 'development';
  return {
    entry: './src/index.tsx',
    output: {
      path: path.resolve(__dirname, 'dist'),
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          exclude: /node_modules/,
          loader: 'builtin:swc-loader',
          options: {
            jsc: {
              parser: {
                syntax: 'typescript',
              },
            },
          },
          type: 'javascript/auto',
        },
        {
          test: /\.jsx$/,
          use: {
            loader: 'builtin:swc-loader',
            options: {
              jsc: {
                parser: {
                  syntax: 'ecmascript',
                  jsx: true,
                },
              },
            },
          },
          type: 'javascript/auto',
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
          test: /\.less$/,
          assert: { type: 'string' },
          type: 'asset/source',
        },
        {
          test: /\.s[ac]ss$/i,
          use: [
            rspack.CssExtractRspackPlugin.loader,
            'css-loader',
            postCssLoader,
            {
              loader: 'sass-loader',
              options: {
                api: 'modern-compiler',
                implementation: require.resolve('sass-embedded'),
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
      new rspack.CssExtractRspackPlugin({}),
      ...isDevelopment ? [new TsCheckerRspackPlugin()] : [],
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
};
