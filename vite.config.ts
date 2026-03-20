import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from "vite-plugin-svgr";

/** esm 中模拟 cjs 的 __dirname */
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  const isProd = mode === 'production';

  return {
    plugins: [
      react(),
      svgr({
        svgrOptions: {
          exportType: 'named',
          namedExport: 'ReactComponent',
          plugins: ['@svgr/plugin-svgo', '@svgr/plugin-jsx'],
        },
      }),
    ],
    resolve: {
      extensions: ['.tsx', '.ts', '.js', '.jsx'],
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    assetsInclude: ['**/*.txt'],
    server: {
      port: 8090,
      open: true,
      // static 目录在 Vite 中默认为 public，原 ./dist 作为输出目录
    },
    build: {
      outDir: 'dist',
      sourcemap: !isProd,
    },
  };
});
