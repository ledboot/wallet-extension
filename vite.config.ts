/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-param-reassign */
import fs from 'fs';
import { resolve } from 'path';
import { crx } from '@crxjs/vite-plugin';
import react from '@vitejs/plugin-react';
import { defineConfig, Plugin } from 'vite';
import dotenv from 'dotenv';
import wasm from 'vite-plugin-wasm';

// 加载环境变量
dotenv.config();

import manifest from './src/manifest';

function touchFile(filePath: string): void {
  const time = new Date();
  fs.utimesSync(filePath, time, time);
}

type TouchGlobalCSSPluginOptions = {
  cssFilePath: string;
  watchFiles: string[];
};

export function touchGlobalCSSPlugin({
  cssFilePath,
  watchFiles,
}: TouchGlobalCSSPluginOptions): Plugin {
  return {
    name: 'touch-global-css',
    configureServer(server) {
      server.watcher.on('change', (file) => {
        if (watchFiles.some((watchFile) => file.includes(watchFile))) {
          touchFile(cssFilePath);
        }
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    touchGlobalCSSPlugin({
      cssFilePath: resolve(__dirname, 'src/assets/styles/index.css'),
      watchFiles: ['.tsx'],
    }),
    wasm(),
    crx({
      manifest,
      contentScripts: {
        injectCss: true,
      },
    }),
  ],
  define: {
    global: 'globalThis',
    'process.env': {},
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
      // 移除不安全的 CSP 设置，只保留 WebAssembly 支持
      'Content-Security-Policy': 'script-src \'self\' \'wasm-unsafe-eval\'; object-src \'none\';',
    },
    cors: {
      origin: [/chrome-extension:\/\//],
    },
  },
  optimizeDeps: {
    exclude: ['tiny-secp256k1'],
  },
  build: {
    target: ['chrome89', 'firefox89', 'safari15'],
    outDir: 'dist',
    rollupOptions: {
      output: {
        // chunkFileNames: '[name]-[hash].js',
        // entryFileNames: '[name].js',
        assetFileNames: (assetInfo) => {
          if (
            assetInfo.name &&
            /\.(ttf|woff|woff2|eot)$/.test(assetInfo.name)
          ) {
            return 'assets/fonts/[name][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        },
      },
    },
  },
  assetsInclude: ['**/*.wasm'],
});
